'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { assetPath } from '@/lib/constants';

// ─── Day/Night Blending Shader ───────────────────────────────────────
// Blends satellite day texture with night city-lights based on a
// slowly rotating sun direction vector, creating a living earth.
const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const earthFragmentShader = /* glsl */ `
  uniform sampler2D uDayMap;
  uniform sampler2D uNightMap;
  uniform vec3 uSunDirection;
  uniform float uNightIntensity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 sunDir = normalize(uSunDirection);

    // Sunlight factor: 1.0 on lit hemisphere, 0.0 on dark side
    float sunDot = dot(normal, sunDir);

    // Smooth transition at the terminator (dawn/dusk band)
    float dayFactor = smoothstep(-0.15, 0.25, sunDot);

    // Sample textures
    vec4 dayColor = texture2D(uDayMap, vUv);
    vec4 nightColor = texture2D(uNightMap, vUv);

    // Slightly boost day texture with "sunlight" tint
    vec3 lit = dayColor.rgb * (0.6 + 0.5 * max(sunDot, 0.0));

    // Night lights glow with warm tone — boost significantly
    vec3 nightGlow = nightColor.rgb * uNightIntensity * 2.5;
    // Add warm tint to city lights
    nightGlow *= vec3(1.0, 0.85, 0.6);

    // Blend: day in sunlight, night lights in shadow
    vec3 color = mix(nightGlow, lit, dayFactor);

    // Add subtle blue ambient to prevent pure black on oceans
    color += vec3(0.008, 0.012, 0.025);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Atmosphere Glow Shader ───────────────────────────────────────────
const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform vec3 uSunDirection;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - dot(viewDir, vNormal);
    fresnel = pow(fresnel, 3.0) * uIntensity;

    // Tint atmosphere slightly warmer on the sun side
    vec3 sunDir = normalize(uSunDirection);
    float sunInfluence = max(dot(vNormal, sunDir), 0.0);
    vec3 atmColor = mix(uColor, vec3(0.5, 0.7, 1.0), sunInfluence * 0.3);

    gl_FragColor = vec4(atmColor, fresnel);
  }
`;

// ─── Globe Core Component ─────────────────────────────────────────────
export default function GlobeCore() {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  // Load satellite textures
  const [dayMap, nightMap] = useLoader(THREE.TextureLoader, [
    assetPath('/textures/earth-day-4k.jpg'),
    assetPath('/textures/earth-night-4k.jpg'),
  ]);

  // Configure textures for best quality
  useMemo(() => {
    [dayMap, nightMap].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
    });
  }, [dayMap, nightMap]);

  // Uniforms for the earth shader
  const earthUniforms = useMemo(
    () => ({
      uDayMap: { value: dayMap },
      uNightMap: { value: nightMap },
      uSunDirection: { value: new THREE.Vector3(5, 2, 3).normalize() },
      uNightIntensity: { value: 1.2 },
    }),
    [dayMap, nightMap]
  );

  // Uniforms for the atmosphere shader
  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#4fc3f7') },
      uIntensity: { value: 1.4 },
      uSunDirection: { value: new THREE.Vector3(5, 2, 3).normalize() },
    }),
    []
  );

  // Animate the sun direction slowly (full revolution ~5 minutes)
  // and pulse atmosphere
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Rotate sun direction slowly
    const angle = t * 0.02; // full rotation in ~314 seconds
    const sunDir = new THREE.Vector3(
      Math.cos(angle) * 5,
      2 + Math.sin(t * 0.05) * 0.5,
      Math.sin(angle) * 3
    ).normalize();

    // Update earth shader sun
    if (globeRef.current) {
      const mat = globeRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uSunDirection.value.copy(sunDir);
    }

    // Update atmosphere shader sun + pulse
    if (atmosphereRef.current) {
      const mat = atmosphereRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uSunDirection.value.copy(sunDir);
      mat.uniforms.uIntensity.value = 1.3 + Math.sin(t * 0.5) * 0.15;
    }
  });

  return (
    <group>
      {/* Lighting — reduced since the shader handles sun lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 5]} intensity={0.3} color="#ffffff" />

      {/* Earth with satellite imagery */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[1.0, 96, 96]} />
        <shaderMaterial
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={earthUniforms}
        />
      </mesh>

      {/* Atmosphere glow (slightly larger transparent sphere with Fresnel) */}
      <mesh ref={atmosphereRef} scale={1.025}>
        <sphereGeometry args={[1.0, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosphereUniforms}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Subtle inner rim glow */}
      <mesh scale={1.002}>
        <sphereGeometry args={[1.0, 64, 64]} />
        <meshBasicMaterial
          color="#1a3a5c"
          transparent
          opacity={0.04}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
