'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobeStore } from '@/stores/globeStore';

// ─── Tile Configuration ────────────────────────────────────────────────
const TILE_CONFIG = {
  // Show tiles when camera is closer than this distance
  enableThreshold: 2.2,
  // Fade-in range
  fadeStart: 2.2,
  fadeEnd: 1.8,
  // Zoom level mapping
  maxZoom: 10,
  minZoom: 2,
};

// Tile URL - ESRI World Imagery
function getTileUrl(z: number, x: number, y: number): string {
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}

// Convert lat/lng to Web Mercator tile coordinates
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const latClamped = Math.max(-85.051129, Math.min(85.051129, lat));
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (latClamped * Math.PI) / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y))
  };
}

// Convert camera distance to zoom level
function distanceToZoom(distance: number): number {
  if (distance >= 2.2) return 2;
  if (distance <= 1.02) return 10;
  const t = (2.2 - distance) / (2.2 - 1.02);
  return Math.round(2 + t * 8);
}

// Convert tile coordinates to lat/lng bounds
function tileBounds(x: number, y: number, zoom: number): {
  north: number; south: number; west: number; east: number;
} {
  const n = Math.pow(2, zoom);
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  const north = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const south = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;
  return { north, south, west, east };
}

// Convert lat/lng to 3D position on sphere
// Uses standard geographic formula matching Three.js SphereGeometry
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;
  return new THREE.Vector3(
    radius * Math.cos(latRad) * Math.cos(lngRad),
    radius * Math.sin(latRad),
    -radius * Math.cos(latRad) * Math.sin(lngRad)
  );
}

// Convert 3D position to lat/lng (inverse of latLngToVector3)
function vector3ToLatLng(vec: THREE.Vector3): { lat: number; lng: number } {
  const normalized = vec.clone().normalize();
  // y = sin(lat), so lat = asin(y)
  const lat = Math.asin(normalized.y) * (180 / Math.PI);
  // x = cos(lat)*cos(lng), z = -cos(lat)*sin(lng)
  // So: lng = atan2(-z, x)
  const lng = Math.atan2(-normalized.z, normalized.x) * (180 / Math.PI);
  return { lat, lng };
}

// ─── Tile Cache ────────────────────────────────────────────────────────
interface TileData {
  key: string;
  texture: THREE.Texture | null;
  loading: boolean;
  error: boolean;
  loadedAt: number;
  bounds: { north: number; south: number; west: number; east: number };
  zoom: number;
  x: number;
  y: number;
}

const tileCache = new Map<string, TileData>();
const textureLoader = new THREE.TextureLoader();
textureLoader.setCrossOrigin('anonymous');

function getTileKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`;
}

// ─── Individual Tile Component ─────────────────────────────────────────
function Tile({ tileData, globalOpacity }: { tileData: TileData; globalOpacity: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [tileOpacity, setTileOpacity] = useState(0);

  // Fade in individual tile when loaded
  useFrame((_, delta) => {
    if (!tileData.texture || tileData.loading) return;

    const targetOpacity = globalOpacity;
    const diff = targetOpacity - tileOpacity;
    if (Math.abs(diff) > 0.01) {
      setTileOpacity(prev => prev + diff * Math.min(delta * 4, 1));
    } else if (tileOpacity !== targetOpacity) {
      setTileOpacity(targetOpacity);
    }
  });

  const geometry = useMemo(() => {
    const { north, south, west, east } = tileData.bounds;

    const segments = 16;
    // Radius must be > 1.002 to be above the inner rim glow in GlobeCore
    const radius = 1.005 + (10 - tileData.zoom) * 0.0005; // Higher zoom = closer to surface

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let j = 0; j <= segments; j++) {
      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const v = j / segments;
        const lat = north + (south - north) * v;
        const lng = west + (east - west) * u;
        const pos = latLngToVector3(lat, lng, radius);
        positions.push(pos.x, pos.y, pos.z);
        uvs.push(u, 1 - v);
      }
    }

    for (let j = 0; j < segments; j++) {
      for (let i = 0; i < segments; i++) {
        const a = j * (segments + 1) + i;
        const b = a + 1;
        const c = a + segments + 1;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [tileData.bounds, tileData.zoom]);

  if (!tileData.texture || tileData.loading || tileData.error || tileOpacity < 0.01) {
    return null;
  }

  return (
    <mesh ref={meshRef} geometry={geometry} raycast={() => null}>
      <meshBasicMaterial
        map={tileData.texture}
        transparent
        opacity={tileOpacity}
        side={THREE.FrontSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Main High-Res Tile Layer ──────────────────────────────────────────
export default function HighResTileLayer() {
  const { camera } = useThree();
  const zoomDistance = useGlobeStore((s) => s.zoomDistance);
  const [visibleTiles, setVisibleTiles] = useState<TileData[]>([]);
  const [globalOpacity, setGlobalOpacity] = useState(0);
  const lastUpdate = useRef(0);
  const lastCenter = useRef({ lat: 0, lng: 0, zoom: 0 });
  const updateCounter = useRef(0);

  // Global opacity based on zoom distance
  const targetOpacity = useMemo(() => {
    if (zoomDistance >= TILE_CONFIG.fadeStart) return 0;
    if (zoomDistance <= TILE_CONFIG.fadeEnd) return 0.95;
    const t = (TILE_CONFIG.fadeStart - zoomDistance) / (TILE_CONFIG.fadeStart - TILE_CONFIG.fadeEnd);
    return t * 0.95;
  }, [zoomDistance]);

  useFrame((_, delta) => {
    const diff = targetOpacity - globalOpacity;
    if (Math.abs(diff) > 0.01) {
      setGlobalOpacity(prev => prev + diff * Math.min(delta * 3, 1));
    } else if (globalOpacity !== targetOpacity) {
      setGlobalOpacity(targetOpacity);
    }
  });

  const showTiles = zoomDistance < TILE_CONFIG.enableThreshold;

  // Load a tile texture
  const loadTile = (z: number, x: number, y: number): TileData => {
    const key = getTileKey(z, x, y);

    if (tileCache.has(key)) {
      return tileCache.get(key)!;
    }

    const bounds = tileBounds(x, y, z);
    const tileData: TileData = {
      key,
      texture: null,
      loading: true,
      error: false,
      loadedAt: 0,
      bounds,
      zoom: z,
      x,
      y,
    };

    tileCache.set(key, tileData);
    const url = getTileUrl(z, x, y);

    textureLoader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        tileData.texture = texture;
        tileData.loading = false;
        tileData.loadedAt = Date.now();
        // Trigger re-render
        updateCounter.current++;
        setVisibleTiles(prev => [...prev]);
      },
      undefined,
      () => {
        tileData.loading = false;
        tileData.error = true;
      }
    );

    return tileData;
  };

  // Update visible tiles
  useFrame(() => {
    if (!showTiles) {
      if (visibleTiles.length > 0) {
        setVisibleTiles([]);
      }
      return;
    }

    const now = Date.now();
    if (now - lastUpdate.current < 150) return;
    lastUpdate.current = now;

    // Get camera look point
    const lookAtPoint = camera.position.clone().normalize();
    const { lat, lng } = vector3ToLatLng(lookAtPoint);
    const zoom = distanceToZoom(zoomDistance);

    // Check if we need to update
    const latDiff = Math.abs(lat - lastCenter.current.lat);
    const lngDiff = Math.abs(lng - lastCenter.current.lng);
    const zoomChanged = zoom !== lastCenter.current.zoom;

    if (!zoomChanged && latDiff < 1.0 && lngDiff < 1.0 && visibleTiles.length > 0) {
      return;
    }

    lastCenter.current = { lat, lng, zoom };

    const tiles: TileData[] = [];
    const addedKeys = new Set<string>();

    // Load tiles at current zoom level with large coverage
    // Increased grid size to ensure continuous view when zoomed in
    const currentZoomGrid = zoom >= 7 ? 6 : zoom >= 5 ? 5 : 4;
    const centerTile = latLngToTile(lat, lng, zoom);
    const n = Math.pow(2, zoom);

    for (let dy = -currentZoomGrid; dy <= currentZoomGrid; dy++) {
      for (let dx = -currentZoomGrid; dx <= currentZoomGrid; dx++) {
        const tx = ((centerTile.x + dx) % n + n) % n;
        const ty = centerTile.y + dy;
        if (ty < 0 || ty >= n) continue;

        const tile = loadTile(zoom, tx, ty);
        if (!addedKeys.has(tile.key)) {
          tiles.push(tile);
          addedKeys.add(tile.key);
        }
      }
    }

    // Also load one zoom level lower as fallback (shows while high-res loads)
    if (zoom > 2) {
      const lowerZoom = zoom - 1;
      const lowerGrid = 4;
      const lowerCenter = latLngToTile(lat, lng, lowerZoom);
      const lowerN = Math.pow(2, lowerZoom);

      for (let dy = -lowerGrid; dy <= lowerGrid; dy++) {
        for (let dx = -lowerGrid; dx <= lowerGrid; dx++) {
          const tx = ((lowerCenter.x + dx) % lowerN + lowerN) % lowerN;
          const ty = lowerCenter.y + dy;
          if (ty < 0 || ty >= lowerN) continue;

          const tile = loadTile(lowerZoom, tx, ty);
          if (!addedKeys.has(tile.key)) {
            tiles.push(tile);
            addedKeys.add(tile.key);
          }
        }
      }
    }

    // Sort: lower zoom first (renders underneath), then by loaded status
    tiles.sort((a, b) => {
      if (a.zoom !== b.zoom) return a.zoom - b.zoom;
      if (a.texture && !b.texture) return -1;
      if (!a.texture && b.texture) return 1;
      return 0;
    });

    setVisibleTiles(tiles);
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tileCache.forEach((tile) => {
        if (tile.texture) tile.texture.dispose();
      });
      tileCache.clear();
    };
  }, []);

  if (globalOpacity < 0.01) {
    return null;
  }

  return (
    <group>
      {visibleTiles.map((tile) => (
        <Tile key={tile.key} tileData={tile} globalOpacity={globalOpacity} />
      ))}
    </group>
  );
}
