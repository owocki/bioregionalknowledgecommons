'use client';

import { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { latLngToVector3 } from '@/lib/geo-utils';
import { assetPath } from '@/lib/constants';

// ─── GeoJSON types ──────────────────────────────────────────────────────
interface CountryFeature {
  type: 'Feature';
  properties: {
    NAME: string;
    ISO_A3: string;
    CONTINENT: string;
    POP_EST: number;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface Admin1Feature {
  type: 'Feature';
  properties: {
    name: string;
    adm0_a3: string;
    adm0_name: string;
    scalerank: number;
  };
  geometry: {
    type: 'LineString' | 'MultiLineString';
    coordinates: number[][] | number[][][];
  };
}

interface GeoJSONCollection<F> {
  type: 'FeatureCollection';
  features: F[];
}

// ─── Altitude constants ─────────────────────────────────────────────────
const COUNTRY_ALTITUDE = 0.0015;
const ADMIN1_ALTITUDE = 0.0012;

// ─── Convert a coordinate ring to 3D points ─────────────────────────────
function ringToPoints(ring: number[][], altitude: number): THREE.Vector3[] {
  return ring.map(([lng, lat]) => latLngToVector3(lat, lng, 1.0 + altitude));
}

// ─── Create a BufferGeometry from an array of Vector3 ───────────────────
function pointsToGeometry(points: THREE.Vector3[]): THREE.BufferGeometry {
  return new THREE.BufferGeometry().setFromPoints(points);
}

// ─── Process country features into line-loop geometries ─────────────────
function processCountries(features: CountryFeature[]): THREE.BufferGeometry[] {
  const geometries: THREE.BufferGeometry[] = [];

  for (const feature of features) {
    if (feature.geometry.type === 'Polygon') {
      const rings = feature.geometry.coordinates as number[][][];
      if (rings[0] && rings[0].length >= 4) {
        const points = ringToPoints(rings[0], COUNTRY_ALTITUDE);
        geometries.push(pointsToGeometry(points));
      }
    } else if (feature.geometry.type === 'MultiPolygon') {
      const polygons = feature.geometry.coordinates as number[][][][];
      for (const polygon of polygons) {
        if (polygon[0] && polygon[0].length >= 4) {
          const points = ringToPoints(polygon[0], COUNTRY_ALTITUDE);
          geometries.push(pointsToGeometry(points));
        }
      }
    }
  }

  return geometries;
}

// ─── Shared materials (created once) ────────────────────────────────────
const countryMaterial = new THREE.LineBasicMaterial({
  color: new THREE.Color('#334155'),
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
});

const admin1Material = new THREE.LineBasicMaterial({
  color: new THREE.Color('#1e293b'),
  transparent: true,
  opacity: 0.25,
  depthWrite: false,
});

// ─── Process admin1 features into THREE.Line objects ────────────────────
function processAdmin1Lines(features: Admin1Feature[]): THREE.Line[] {
  const lines: THREE.Line[] = [];

  for (const feature of features) {
    if (feature.geometry.type === 'LineString') {
      const coords = feature.geometry.coordinates as number[][];
      if (coords.length >= 2) {
        const points = ringToPoints(coords, ADMIN1_ALTITUDE);
        const geom = pointsToGeometry(points);
        lines.push(new THREE.Line(geom, admin1Material));
      }
    } else if (feature.geometry.type === 'MultiLineString') {
      const multiLines = feature.geometry.coordinates as number[][][];
      for (const lineCoords of multiLines) {
        if (lineCoords.length >= 2) {
          const points = ringToPoints(lineCoords, ADMIN1_ALTITUDE);
          const geom = pointsToGeometry(points);
          lines.push(new THREE.Line(geom, admin1Material));
        }
      }
    }
  }

  return lines;
}

// ─── Main Component ─────────────────────────────────────────────────────
export default function PoliticalBoundaries() {
  const [countryData, setCountryData] = useState<GeoJSONCollection<CountryFeature> | null>(null);
  const [admin1Data, setAdmin1Data] = useState<GeoJSONCollection<Admin1Feature> | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetch(assetPath('/data/ne_110m_countries.json'))
      .then((res) => res.json())
      .then((data: GeoJSONCollection<CountryFeature>) => setCountryData(data))
      .catch((err) => console.error('Failed to load country boundaries:', err));

    fetch(assetPath('/data/ne_50m_admin1_lines.json'))
      .then((res) => res.json())
      .then((data: GeoJSONCollection<Admin1Feature>) => setAdmin1Data(data))
      .catch((err) => console.error('Failed to load admin1 boundaries:', err));
  }, []);

  // Process country geometries
  const countryGeometries = useMemo(() => {
    if (!countryData) return [];
    return processCountries(countryData.features);
  }, [countryData]);

  // Process admin1 line objects
  const admin1Lines = useMemo(() => {
    if (!admin1Data) return [];
    return processAdmin1Lines(admin1Data.features);
  }, [admin1Data]);

  // Don't render until at least one dataset is loaded
  if (countryGeometries.length === 0 && admin1Lines.length === 0) return null;

  return (
    <group>
      {/* Country borders */}
      {countryGeometries.map((geom, i) => (
        <lineLoop key={`country-${i}`} geometry={geom} material={countryMaterial} />
      ))}

      {/* State/province borders */}
      {admin1Lines.map((lineObj, i) => (
        <primitive key={`admin1-${i}`} object={lineObj} />
      ))}
    </group>
  );
}
