import * as THREE from 'three';

const GLOBE_RADIUS = 1.0;

/**
 * Convert latitude/longitude to 3D position on sphere
 */
export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number = GLOBE_RADIUS,
  altitude: number = 0
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = radius + altitude;

  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Convert 3D position to lat/lng
 */
export function vector3ToLatLng(position: THREE.Vector3): { lat: number; lng: number } {
  const r = position.length();
  const lat = 90 - Math.acos(position.y / r) * (180 / Math.PI);
  const lng = -(Math.atan2(position.z, -position.x) * (180 / Math.PI)) - 180;
  return {
    lat,
    lng: lng < -180 ? lng + 360 : lng > 180 ? lng - 360 : lng,
  };
}

/**
 * Calculate great circle arc points between two lat/lng positions
 */
export function greatCirclePoints(
  start: [number, number], // [lng, lat]
  end: [number, number],   // [lng, lat]
  numPoints: number = 50,
  arcHeight: number = 0.15
): THREE.Vector3[] {
  const startVec = latLngToVector3(start[1], start[0]);
  const endVec = latLngToVector3(end[1], end[0]);

  const points: THREE.Vector3[] = [];
  const angle = startVec.angleTo(endVec);

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;

    // Spherical interpolation
    const sinAngle = Math.sin(angle);
    const a = Math.sin((1 - t) * angle) / sinAngle;
    const b = Math.sin(t * angle) / sinAngle;

    const point = new THREE.Vector3(
      a * startVec.x + b * endVec.x,
      a * startVec.y + b * endVec.y,
      a * startVec.z + b * endVec.z
    );

    // Add altitude for the arc (bell curve)
    const altFactor = Math.sin(t * Math.PI) * arcHeight;
    point.normalize().multiplyScalar(GLOBE_RADIUS + altFactor);

    points.push(point);
  }

  return points;
}

/**
 * Calculate distance between two lat/lng pairs (Haversine formula)
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get camera position that looks at a specific lat/lng
 */
export function getCameraPositionForLatLng(
  lat: number,
  lng: number,
  distance: number = 2.5
): THREE.Vector3 {
  return latLngToVector3(lat, lng, distance);
}

/**
 * Generate a slight offset for clustered nodes
 */
export function getClusterOffset(index: number, total: number): [number, number] {
  if (total <= 1) return [0, 0];
  const angle = (index / total) * Math.PI * 2;
  const radius = 0.5; // Offset in degrees
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}
