// ============================================================
// Globe & Camera Constants
// ============================================================

/** Radius of the 3D globe mesh */
export const GLOBE_RADIUS = 1.0;

/** Default camera distance from globe center */
export const CAMERA_DEFAULT_DISTANCE = 2.8;

/** Camera distance when zoomed into a bioregion or node */
export const CAMERA_ZOOM_DISTANCE = 2.0;

/** Duration (seconds) for camera fly-to animations */
export const ANIMATION_DURATION = 1.8;

// ============================================================
// Data URLs (served from /public)
// ============================================================

/** Simplified bioregion GeoJSON for globe rendering */
export const BIOREGION_DATA_URL = '/data/bioregions-simplified.json';

/** Bioregion code → metadata lookup table */
export const BIOREGION_LOOKUP_URL = '/data/bioregion-lookup.json';
