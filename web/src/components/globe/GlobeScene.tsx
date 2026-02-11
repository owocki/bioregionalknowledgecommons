'use client';

import { Suspense, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import GlobeCore from './GlobeCore';
import PoliticalBoundaries from './PoliticalBoundaries';
import CityLabels from './CityLabels';
import BioregionLayer from './BioregionLayer';
import NodeMarkers from './NodeMarkers';
import FlowArcs from './FlowArcs';
import BridgeConnections from './BridgeConnections';
import CameraAnimator from './CameraAnimator';

export default function GlobeScene() {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Pause auto-rotation on interaction, resume after timeout
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInteractionStart = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
    if (resumeTimer.current) {
      clearTimeout(resumeTimer.current);
    }
  }, []);

  const handleInteractionEnd = useCallback(() => {
    resumeTimer.current = setTimeout(() => {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = true;
      }
    }, 3000);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0a' }}>
      <Canvas
        camera={{
          position: [0, 0, 2.8],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Starfield background */}
        <Stars
          radius={50}
          depth={60}
          count={2500}
          factor={3}
          saturation={0}
          fade
          speed={0.5}
        />

        <Suspense fallback={null}>
          {/* Globe sphere + atmosphere */}
          <GlobeCore />

          {/* Political boundaries (countries + states) */}
          <PoliticalBoundaries />

          {/* City labels */}
          <CityLabels />

          {/* Bioregion translucent patches */}
          <BioregionLayer />

          {/* Node markers with hover labels */}
          <NodeMarkers />

          {/* Animated flow arcs */}
          <FlowArcs />

          {/* Dashed bridge connections */}
          <BridgeConnections />

          {/* Camera animation controller */}
          <CameraAnimator />
        </Suspense>

        {/* Orbit controls with auto-rotation */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.5}
          minDistance={1.5}
          maxDistance={5}
          autoRotate
          autoRotateSpeed={0.3}
          onStart={handleInteractionStart}
          onEnd={handleInteractionEnd}
        />
      </Canvas>
    </div>
  );
}
