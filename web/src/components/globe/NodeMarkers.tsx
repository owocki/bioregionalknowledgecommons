'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { seedNodes, getNodePosition } from '@/data/seed-registry';
import { latLngToVector3, getClusterOffset } from '@/lib/geo-utils';
import { DOMAIN_COLORS } from '@/types';
import type { NodeEntry } from '@/types';
import { useGlobeStore } from '@/stores/globeStore';

const BASE_MARKER_SIZE = 0.015;
const TAG_SCALE_FACTOR = 0.003;
const ALTITUDE = 0.008; // Hover just above the sphere surface

export default function NodeMarkers() {
  const selectedNodeId = useGlobeStore((s) => s.selectedNodeId);
  const setSelectedNode = useGlobeStore((s) => s.setSelectedNode);

  // Pre-compute node positions and sizes with cluster offsets
  const nodeData = useMemo(() => {
    // Group nodes by their primary bioregion code
    const bioregionGroups = new Map<string, NodeEntry[]>();
    for (const node of seedNodes) {
      const code = node.bioregion_codes[0];
      if (!code) continue;
      const group = bioregionGroups.get(code) || [];
      group.push(node);
      bioregionGroups.set(code, group);
    }

    return seedNodes
      .map((node) => {
        const coords = getNodePosition(node);
        if (!coords) return null;
        const [lng, lat] = coords;

        // Apply cluster offset if multiple nodes share a bioregion
        const code = node.bioregion_codes[0];
        const group = bioregionGroups.get(code) || [];
        const indexInGroup = group.indexOf(node);
        const [lngOffset, latOffset] = getClusterOffset(indexInGroup, group.length);

        const position = latLngToVector3(lat + latOffset, lng + lngOffset, 1.0, ALTITUDE);
        const size = BASE_MARKER_SIZE + node.topic_tags.length * TAG_SCALE_FACTOR;
        const color = DOMAIN_COLORS[node.thematic_domain] || '#7F8C8D';
        return { node, position, size, color };
      })
      .filter(Boolean) as {
      node: NodeEntry;
      position: THREE.Vector3;
      size: number;
      color: string;
    }[];
  }, []);

  return (
    <group>
      {nodeData.map(({ node, position, size, color }) => (
        <NodeMarker
          key={node.node_id}
          node={node}
          position={position}
          size={size}
          color={color}
          isSelected={selectedNodeId === node.node_id}
          onSelect={setSelectedNode}
        />
      ))}
    </group>
  );
}

// ─── Individual Node Marker ───────────────────────────────────────────
interface NodeMarkerProps {
  node: NodeEntry;
  position: THREE.Vector3;
  size: number;
  color: string;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}

function NodeMarker({ node, position, size, color, isSelected, onSelect }: NodeMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Unique phase offset so markers don't all pulse in sync
  const phaseOffset = useMemo(
    () => node.node_id.charCodeAt(0) + node.node_id.charCodeAt(5),
    [node.node_id]
  );

  // Pulse animation
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime + phaseOffset;
    const pulse = 1.0 + Math.sin(t * 2.0) * 0.12;
    const targetScale = isSelected ? 1.5 : hovered ? 1.25 : pulse;
    const s = meshRef.current.scale.x;
    meshRef.current.scale.setScalar(s + (targetScale - s) * 0.15);

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + Math.sin(t * 2.0) * 0.1;
    }
  });

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(isSelected ? null : node.node_id);
    },
    [node.node_id, isSelected, onSelect]
  );

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHovered(true);
      document.body.style.cursor = 'pointer';
    },
    []
  );

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  return (
    <group position={position}>
      {/* Outer glow sphere */}
      <mesh ref={glowRef} scale={2.5}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Core marker sphere */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 1.2 : 0.6}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Hover label */}
      {(hovered || isSelected) && (
        <Html
          distanceFactor={3}
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
          position={[0, size * 3, 0]}
          center
        >
          <div
            style={{
              background: 'rgba(10, 10, 10, 0.9)',
              border: `1px solid ${color}`,
              borderRadius: '6px',
              padding: '4px 10px',
              color: '#e0e0e0',
              fontSize: '11px',
              fontFamily: 'system-ui, sans-serif',
              boxShadow: `0 0 12px ${color}44`,
              transform: 'translateY(-8px)',
            }}
          >
            <div style={{ fontWeight: 600, color }}>{node.display_name}</div>
            <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
              {node.thematic_domain.replace(/-/g, ' ')} · {node.topic_tags.length} tags
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
