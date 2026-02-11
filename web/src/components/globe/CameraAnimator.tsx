'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobeStore } from '@/stores/globeStore';
import { latLngToVector3 } from '@/lib/geo-utils';

const ANIMATION_DURATION = 1.8; // seconds

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * CameraAnimator - must be rendered inside <Canvas>.
 * Watches the globeStore.cameraTarget and smoothly animates
 * the camera to that lat/lng/zoom when it changes.
 */
export default function CameraAnimator() {
  const { camera } = useThree();
  const cameraTarget = useGlobeStore((s) => s.cameraTarget);

  // Animation state
  const animRef = useRef<{
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTime: number;
    duration: number;
    active: boolean;
  }>({
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTime: 0,
    duration: ANIMATION_DURATION,
    active: false,
  });

  // Track which cameraTarget timestamp we already processed
  const lastTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!cameraTarget) return;
    if (cameraTarget.timestamp === lastTimestampRef.current) return;
    lastTimestampRef.current = cameraTarget.timestamp;

    const targetPos = latLngToVector3(
      cameraTarget.lat,
      cameraTarget.lng,
      cameraTarget.zoom
    );

    animRef.current = {
      startPos: camera.position.clone(),
      endPos: targetPos,
      startTime: -1, // will be set on first frame
      duration: ANIMATION_DURATION,
      active: true,
    };
  }, [cameraTarget, camera]);

  useFrame(({ clock }) => {
    const anim = animRef.current;
    if (!anim.active) return;

    if (anim.startTime < 0) {
      anim.startTime = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - anim.startTime;
    const rawProgress = Math.min(elapsed / anim.duration, 1);
    const progress = easeInOutCubic(rawProgress);

    // Spherical interpolation for smooth globe rotation
    const startNorm = anim.startPos.clone().normalize();
    const endNorm = anim.endPos.clone().normalize();

    // Interpolate direction via slerp-like approach
    const angle = startNorm.angleTo(endNorm);
    let interpDir: THREE.Vector3;

    if (angle < 0.001) {
      interpDir = endNorm.clone();
    } else {
      const sinAngle = Math.sin(angle);
      const a = Math.sin((1 - progress) * angle) / sinAngle;
      const b = Math.sin(progress * angle) / sinAngle;
      interpDir = new THREE.Vector3(
        a * startNorm.x + b * endNorm.x,
        a * startNorm.y + b * endNorm.y,
        a * startNorm.z + b * endNorm.z
      ).normalize();
    }

    // Interpolate distance
    const startDist = anim.startPos.length();
    const endDist = anim.endPos.length();
    const dist = startDist + (endDist - startDist) * progress;

    camera.position.copy(interpDir.multiplyScalar(dist));
    camera.lookAt(0, 0, 0);

    if (rawProgress >= 1) {
      anim.active = false;
    }
  });

  return null;
}
