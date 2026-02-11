'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - dot(viewDir, vNormal);
    fresnel = pow(fresnel, 3.0) * uIntensity;
    gl_FragColor = vec4(uColor, fresnel);
  }
`;

// ─── Globe Core Component ─────────────────────────────────────────────
export default function GlobeCore() {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#4fc3f7') },
      uIntensity: { value: 1.4 },
    }),
    []
  );

  // Gentle atmosphere pulse
  useFrame(({ clock }) => {
    if (atmosphereRef.current) {
      const mat = atmosphereRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uIntensity.value = 1.4 + Math.sin(clock.elapsedTime * 0.5) * 0.15;
    }
  });

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.9} color="#ffffff" />
      <directionalLight position={[-3, -1, -4]} intensity={0.2} color="#4fc3f7" />

      {/* Ocean sphere */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[1.0, 64, 64]} />
        <meshPhongMaterial
          color="#1a1a2e"
          emissive="#0d0d1a"
          emissiveIntensity={0.3}
          shininess={15}
          specular="#222244"
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
          opacity={0.06}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
