'use client';

import { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { latLngToVector3 } from '@/lib/geo-utils';
import { assetPath } from '@/lib/constants';

// ─── GeoJSON types ──────────────────────────────────────────────────────
interface PlaceFeature {
  type: 'Feature';
  properties: {
    name: string;
    scalerank: number;
    pop_max: number;
    adm0cap: number;
    sov0name: string;
    adm1name: string;
    megacity: number;
    worldcity: number;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

interface PlacesGeoJSON {
  type: 'FeatureCollection';
  features: PlaceFeature[];
}

// ─── Constants ──────────────────────────────────────────────────────────
const LABEL_ALTITUDE = 0.01;
const DOT_ALTITUDE = 0.005;
const MAX_SCALERANK = 3; // Show cities with scalerank <= 3

const CAPITAL_COLOR = '#fbbf24'; // amber
const CITY_COLOR = '#94a3b8'; // gray-400

// Sprite scale by scalerank: [xScale, yScale]
const SCALE_MAP: Record<number, [number, number]> = {
  0: [0.08, 0.02],
  1: [0.06, 0.015],
  2: [0.05, 0.012],
  3: [0.04, 0.01],
};

// Font size by scalerank
const FONT_SIZE_MAP: Record<number, number> = {
  0: 48,
  1: 40,
  2: 32,
  3: 26,
};

// ─── Canvas label texture creator ───────────────────────────────────────
function createLabelTexture(
  text: string,
  color: string,
  fontSize: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Measure text first
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  const metrics = ctx.measureText(text);
  const width = Math.ceil(metrics.width) + 8;
  const height = fontSize + 8;

  // Resize canvas and re-set font (resizing clears context state)
  canvas.width = width;
  canvas.height = height;
  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 4, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// ─── Processed city data for rendering ──────────────────────────────────
interface CitySprite {
  key: string;
  name: string;
  position: THREE.Vector3;
  dotPosition: THREE.Vector3;
  texture: THREE.CanvasTexture;
  material: THREE.SpriteMaterial;
  dotColor: string;
  scale: [number, number, number];
  isCapital: boolean;
}

// ─── Shared dot geometry ────────────────────────────────────────────────
const dotGeometry = new THREE.SphereGeometry(0.0015, 6, 6);

// ─── Main Component ─────────────────────────────────────────────────────
export default function CityLabels() {
  const [placesData, setPlacesData] = useState<PlacesGeoJSON | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetch(assetPath('/data/ne_50m_populated_places.json'))
      .then((res) => res.json())
      .then((data: PlacesGeoJSON) => setPlacesData(data))
      .catch((err) => console.error('Failed to load populated places:', err));
  }, []);

  // Process all city data into sprites
  const cities = useMemo(() => {
    if (!placesData) return [];

    const result: CitySprite[] = [];

    for (const feature of placesData.features) {
      const { name, scalerank, adm0cap } = feature.properties;

      // Filter: only show important cities
      if (scalerank > MAX_SCALERANK) continue;

      const [lng, lat] = feature.geometry.coordinates;
      const isCapital = adm0cap === 1;
      const color = isCapital ? CAPITAL_COLOR : CITY_COLOR;
      const rank = Math.min(scalerank, 3) as 0 | 1 | 2 | 3;
      const fontSize = FONT_SIZE_MAP[rank];
      const [sx, sy] = SCALE_MAP[rank];

      const texture = createLabelTexture(name, color, fontSize);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: isCapital ? 0.9 : 0.7,
        depthWrite: false,
        depthTest: true,
        sizeAttenuation: true,
      });

      const position = latLngToVector3(lat, lng, 1.0 + LABEL_ALTITUDE);
      const dotPosition = latLngToVector3(lat, lng, 1.0 + DOT_ALTITUDE);

      result.push({
        key: `${name}-${lng}-${lat}`,
        name,
        position,
        dotPosition,
        texture,
        material,
        dotColor: color,
        scale: [sx, sy, 1],
        isCapital,
      });
    }

    return result;
  }, [placesData]);

  // Cleanup textures on unmount
  useEffect(() => {
    return () => {
      for (const city of cities) {
        city.texture.dispose();
        city.material.dispose();
      }
    };
  }, [cities]);

  if (cities.length === 0) return null;

  return (
    <group>
      {cities.map((city) => (
        <group key={city.key}>
          {/* City dot */}
          <mesh geometry={dotGeometry} position={city.dotPosition}>
            <meshBasicMaterial
              color={city.dotColor}
              transparent
              opacity={city.isCapital ? 0.8 : 0.5}
              depthWrite={false}
            />
          </mesh>

          {/* City label sprite */}
          <sprite
            material={city.material}
            position={city.position}
            scale={city.scale}
          />
        </group>
      ))}
    </group>
  );
}
