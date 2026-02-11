'use client';

import { useMemo, useCallback } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobeStore } from '@/stores/globeStore';
import { latLngToVector3 } from '@/lib/geo-utils';

const ALTITUDE = 0.003;
const DOT_SIZE = 0.012;
const CYAN = new THREE.Color('#06b6d4');
const FILL_COLOR = new THREE.Color('#06b6d4');

/**
 * Converts a [lng, lat] pair to a Vector3 on the globe sphere.
 */
function toVec(lngLat: [number, number], alt: number = ALTITUDE): THREE.Vector3 {
  return latLngToVector3(lngLat[1], lngLat[0], 1.0, alt);
}

/**
 * TerritoryDrawer renders:
 * 1. An invisible click-interceptor sphere (when drawing mode is on)
 * 2. Cyan dot markers at each boundary point
 * 3. Lines connecting the dots
 * 4. A translucent fill polygon when 3+ points exist
 */
export default function TerritoryDrawer() {
  const isDrawing = useGlobeStore((s) => s.isDrawingBoundary);
  const boundary = useGlobeStore((s) => s.onboardingBoundary);
  const addPoint = useGlobeStore((s) => s.addBoundaryPoint);

  // Handle click on the invisible sphere to add a boundary point
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!isDrawing) return;
      e.stopPropagation();

      // Convert the hit point on the unit sphere to lat/lng
      const point = e.point.clone().normalize();
      const lat = 90 - Math.acos(point.y) * (180 / Math.PI);
      const r = Math.sqrt(point.x * point.x + point.z * point.z);
      let lng =
        Math.atan2(point.z, -point.x) * (180 / Math.PI) - 180;
      // Normalize to [-180, 180]
      if (lng < -180) lng += 360;
      if (lng > 180) lng -= 360;

      addPoint([lng, lat]);
    },
    [isDrawing, addPoint],
  );

  // Boundary point positions
  const dotPositions = useMemo(
    () => boundary.map((pt) => toVec(pt, ALTITUDE + 0.002)),
    [boundary],
  );

  // Line geometry connecting the dots
  const lineGeometry = useMemo(() => {
    if (boundary.length < 2) return null;
    const points = boundary.map((pt) => toVec(pt, ALTITUDE + 0.001));
    // Close the loop if 3+
    if (boundary.length >= 3) points.push(points[0]);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [boundary]);

  // Fill polygon geometry (simple triangle fan from centroid)
  const fillGeometry = useMemo(() => {
    if (boundary.length < 3) return null;

    // Compute centroid
    const centroid: [number, number] = [0, 0];
    boundary.forEach(([lng, lat]) => {
      centroid[0] += lng / boundary.length;
      centroid[1] += lat / boundary.length;
    });

    const centerVec = toVec(centroid, ALTITUDE);
    const pts = boundary.map((pt) => toVec(pt, ALTITUDE));

    // Triangle fan: center -> pt[i] -> pt[i+1]
    const positions: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const next = pts[(i + 1) % pts.length];
      positions.push(
        centerVec.x, centerVec.y, centerVec.z,
        pts[i].x, pts[i].y, pts[i].z,
        next.x, next.y, next.z,
      );
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return geo;
  }, [boundary]);

  return (
    <group>
      {/* Invisible click interceptor sphere — only active when drawing */}
      {isDrawing && (
        <mesh onClick={handleClick}>
          <sphereGeometry args={[1.01, 64, 64]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* Boundary point markers */}
      {dotPositions.map((pos, i) => (
        <mesh key={`dot-${i}`} position={pos}>
          <sphereGeometry args={[DOT_SIZE, 16, 16]} />
          <meshBasicMaterial color={CYAN} />
        </mesh>
      ))}

      {/* First point slightly larger — indicates start */}
      {dotPositions.length > 0 && (
        <mesh position={dotPositions[0]}>
          <sphereGeometry args={[DOT_SIZE * 1.5, 16, 16]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.4} />
        </mesh>
      )}

      {/* Connecting lines */}
      {lineGeometry && (
        <lineLoop geometry={lineGeometry}>
          <lineBasicMaterial color={CYAN} linewidth={2} transparent opacity={0.8} />
        </lineLoop>
      )}

      {/* Fill polygon */}
      {fillGeometry && (
        <mesh geometry={fillGeometry}>
          <meshBasicMaterial
            color={FILL_COLOR}
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
