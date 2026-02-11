'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobeStore } from '@/stores/globeStore';

// ─── Tile Configuration ────────────────────────────────────────────────
// Uses standard Web Mercator (EPSG:3857) tiles

const TILE_CONFIG = {
  // Zoom threshold: show tiles when camera is closer than this distance
  enableThreshold: 1.3,
  // Fade-in range (smooth transition)
  fadeStart: 1.3,
  fadeEnd: 1.15,
  // Zoom level mapping
  maxZoom: 10,
  minZoom: 4,
};

// Tile URL - using ESRI World Imagery (free, high quality satellite)
function getTileUrl(z: number, x: number, y: number): string {
  // ESRI World Imagery - free for non-commercial use, high quality
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}

// Convert lat/lng to Web Mercator tile coordinates
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  // Clamp latitude to valid Mercator range
  const latClamped = Math.max(-85.051129, Math.min(85.051129, lat));
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (latClamped * Math.PI) / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y))
  };
}

// Convert camera distance to zoom level (smooth interpolation)
function distanceToZoom(distance: number): number {
  // Map distance to zoom: closer = higher zoom
  // distance 1.3 -> zoom 4, distance 1.01 -> zoom 10
  if (distance >= 1.3) return 4;
  if (distance <= 1.02) return 10;
  const t = (1.3 - distance) / (1.3 - 1.02);
  return Math.round(4 + t * 6);
}

// Convert Web Mercator tile coordinates to lat/lng bounds
function tileBounds(x: number, y: number, zoom: number): {
  north: number;
  south: number;
  west: number;
  east: number;
} {
  const n = Math.pow(2, zoom);
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  // Web Mercator Y to latitude
  const north = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const south = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;
  return { north, south, west, east };
}

// Convert lat/lng to 3D position on sphere (matching GlobeCore coordinate system)
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Convert 3D position to lat/lng (inverse of above)
function vector3ToLatLng(vec: THREE.Vector3): { lat: number; lng: number } {
  const normalized = vec.clone().normalize();
  const lat = Math.asin(normalized.y) * (180 / Math.PI);
  const lng = Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI) - 180;
  return { lat, lng: lng < -180 ? lng + 360 : lng > 180 ? lng - 360 : lng };
}

// ─── Tile Cache ────────────────────────────────────────────────────────
interface TileData {
  key: string;
  texture: THREE.Texture | null;
  loading: boolean;
  error: boolean;
  bounds: { north: number; south: number; west: number; east: number };
  zoom: number;
  x: number;
  y: number;
}

const tileCache = new Map<string, TileData>();
const textureLoader = new THREE.TextureLoader();
// Enable CORS for cross-origin textures
textureLoader.setCrossOrigin('anonymous');

function getTileKey(z: number, x: number, y: number): string {
  return `${z}/${x}/${y}`;
}

// ─── Individual Tile Component ─────────────────────────────────────────
function Tile({ tileData, opacity }: { tileData: TileData; opacity: number }) {
  // Create curved geometry for the tile (memoized based on bounds)
  const geometry = useMemo(() => {
    const { north, south, west, east } = tileData.bounds;

    // More segments for smoother curvature, especially important at close zoom
    const segments = 24;
    const radius = 1.002; // Slightly above globe surface to prevent z-fighting

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Generate vertices with proper spherical mapping
    for (let j = 0; j <= segments; j++) {
      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const v = j / segments;
        // Interpolate lat/lng within tile bounds
        const lat = north + (south - north) * v;
        const lng = west + (east - west) * u;

        const pos = latLngToVector3(lat, lng, radius);
        positions.push(pos.x, pos.y, pos.z);
        // UV mapping: u goes left-to-right, v goes top-to-bottom in texture
        uvs.push(u, 1 - v);
      }
    }

    // Generate triangle indices
    for (let j = 0; j < segments; j++) {
      for (let i = 0; i < segments; i++) {
        const a = j * (segments + 1) + i;
        const b = a + 1;
        const c = a + segments + 1;
        const d = c + 1;
        // Two triangles per quad
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
  }, [tileData.bounds]);

  if (!tileData.texture || tileData.loading || tileData.error) {
    return null;
  }

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        map={tileData.texture}
        transparent
        opacity={opacity}
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
  const [tileOpacity, setTileOpacity] = useState(0);
  const lastUpdate = useRef(0);
  const lastCenter = useRef({ lat: 0, lng: 0, zoom: 0 });

  // Calculate opacity for smooth fade-in
  const targetOpacity = useMemo(() => {
    if (zoomDistance >= TILE_CONFIG.fadeStart) return 0;
    if (zoomDistance <= TILE_CONFIG.fadeEnd) return 0.95;
    // Smooth interpolation
    const t = (TILE_CONFIG.fadeStart - zoomDistance) / (TILE_CONFIG.fadeStart - TILE_CONFIG.fadeEnd);
    return t * 0.95;
  }, [zoomDistance]);

  // Smoothly animate opacity
  useFrame((_, delta) => {
    const diff = targetOpacity - tileOpacity;
    if (Math.abs(diff) > 0.01) {
      setTileOpacity((prev) => prev + diff * Math.min(delta * 5, 1));
    } else if (tileOpacity !== targetOpacity) {
      setTileOpacity(targetOpacity);
    }
  });

  // Determine if we should show/load tiles
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
        // Force re-render by creating new array reference
        setVisibleTiles((prev) => [...prev]);
      },
      undefined,
      () => {
        tileData.loading = false;
        tileData.error = true;
        console.warn(`Failed to load tile: ${key}`);
      }
    );

    return tileData;
  };

  // Update visible tiles based on camera position
  useFrame(() => {
    if (!showTiles) {
      if (visibleTiles.length > 0) {
        setVisibleTiles([]);
      }
      return;
    }

    // Throttle updates (but not too much for smooth experience)
    const now = Date.now();
    if (now - lastUpdate.current < 100) return;
    lastUpdate.current = now;

    // Get the point on the globe the camera is looking at
    // Camera position points from origin to camera, so -camera.position points to the near surface
    const lookAtPoint = camera.position.clone().negate().normalize();
    const { lat, lng } = vector3ToLatLng(lookAtPoint);

    // Calculate zoom level based on distance
    const zoom = distanceToZoom(zoomDistance);

    // Skip update if center hasn't moved significantly
    const latDiff = Math.abs(lat - lastCenter.current.lat);
    const lngDiff = Math.abs(lng - lastCenter.current.lng);
    const zoomChanged = zoom !== lastCenter.current.zoom;

    // Only update tiles if moved enough or zoom changed
    if (!zoomChanged && latDiff < 0.5 && lngDiff < 0.5 && visibleTiles.length > 0) {
      return;
    }

    lastCenter.current = { lat, lng, zoom };

    // Get the center tile
    const centerTile = latLngToTile(lat, lng, zoom);
    const tiles: TileData[] = [];
    const n = Math.pow(2, zoom);

    // Load a grid of tiles around the center
    // Larger grid at higher zoom for better coverage
    const gridSize = zoom >= 8 ? 3 : zoom >= 6 ? 2 : 1;

    for (let dy = -gridSize; dy <= gridSize; dy++) {
      for (let dx = -gridSize; dx <= gridSize; dx++) {
        // Wrap X around (longitude wraps), clamp Y (latitude doesn't wrap)
        const tx = ((centerTile.x + dx) % n + n) % n;
        const ty = centerTile.y + dy;

        // Skip tiles outside valid Y range
        if (ty < 0 || ty >= n) continue;

        const tile = loadTile(zoom, tx, ty);
        tiles.push(tile);
      }
    }

    setVisibleTiles(tiles);
  });

  // Cleanup old textures when component unmounts
  useEffect(() => {
    return () => {
      tileCache.forEach((tile) => {
        if (tile.texture) {
          tile.texture.dispose();
        }
      });
      tileCache.clear();
    };
  }, []);

  // Don't render if fully transparent
  if (tileOpacity < 0.01) {
    return null;
  }

  return (
    <group>
      {visibleTiles.map((tile) => (
        <Tile key={tile.key} tileData={tile} opacity={tileOpacity} />
      ))}
    </group>
  );
}
