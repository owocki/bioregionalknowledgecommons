import { create } from 'zustand';
import type { GlobeState, Realm, ThematicDomain, CameraTarget, SelectedNativeLand, AppMode } from '@/types';

interface HoveredFlow {
  sourceId: string;
  targetId: string;
}

interface GlobeStore extends GlobeState {
  setAppMode: (mode: AppMode) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setSelectedBioregion: (code: string | null) => void;
  setHoveredBioregion: (code: string | null) => void;
  setUserLocation: (lat: number, lng: number) => void;
  setUserBioregion: (code: string | null) => void;
  setCameraTarget: (target: CameraTarget | null) => void;
  /** Convenience: fly camera to a lat/lng with zoom */
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  toggleFlowArcs: () => void;
  toggleBridges: () => void;
  toggleBioregions: () => void;
  toggleEcoregions: () => void;
  togglePlaceNames: () => void;
  toggleSatelliteImagery: () => void;
  toggleWaterFeatures: () => void;
  toggleNativeTerritories: () => void;
  toggleNativeLanguages: () => void;
  toggleNativeTreaties: () => void;
  setSelectedNativeLand: (selected: SelectedNativeLand | null) => void;
  setViewMode: (mode: 'globe' | 'map' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setRealmFilter: (realms: Realm[]) => void;
  setDomainFilter: (domains: ThematicDomain[]) => void;
  setActivityFilter: (days: number | null) => void;
  resetFilters: () => void;
  /** Flow hover state for tooltip */
  hoveredFlow: HoveredFlow | null;
  setHoveredFlow: (flow: HoveredFlow | null) => void;
  setSelectedEcoregion: (ecoId: number | null) => void;
  setShowOnboarding: (show: boolean) => void;
  setShowIntakeForm: (show: boolean) => void;
  setIsDrawingBoundary: (drawing: boolean) => void;
  addBoundaryPoint: (lngLat: [number, number]) => void;
  undoBoundaryPoint: () => void;
  clearBoundary: () => void;
  setBoundary: (points: [number, number][]) => void;
  /** Camera distance from globe center (lower = closer zoom) */
  zoomDistance: number;
  setZoomDistance: (distance: number) => void;
}

const initialState: GlobeState = {
  appMode: 'knowledge-commons',
  selectedNodeId: null,
  selectedBioregion: null,
  hoveredBioregion: null,
  userLocation: null,
  userBioregion: null,
  cameraTarget: null,
  showFlowArcs: false,
  showBridges: false,
  showBioregions: false,
  showEcoregions: false,
  showPlaceNames: false,
  showSatelliteImagery: false,
  showWaterFeatures: false,
  showOnboarding: false,
  showIntakeForm: false,
  selectedEcoregion: null,
  onboardingBoundary: [],
  isDrawingBoundary: false,
  viewMode: 'globe',
  searchQuery: '',
  filters: {
    realms: [],
    domains: [],
    activityDays: null,
    minBridges: 0,
  },
  showNativeTerritories: false,
  showNativeLanguages: false,
  showNativeTreaties: false,
  selectedNativeLand: null,
};

export const useGlobeStore = create<GlobeStore>((set) => ({
  ...initialState,

  hoveredFlow: null,
  setHoveredFlow: (flow) => set({ hoveredFlow: flow }),
  setAppMode: (mode) =>
    set((s) => ({
      appMode: mode,
      // Clear KC-specific state when switching to fund mode
      ...(mode === 'fund-a-region'
        ? { selectedNodeId: null, hoveredFlow: null }
        : {}),
      // Clear fund-specific state when switching to KC mode
      ...(mode === 'knowledge-commons'
        ? { selectedBioregion: s.appMode === 'fund-a-region' ? null : s.selectedBioregion }
        : {}),
    })),
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
  setSelectedBioregion: (code) => set({ selectedBioregion: code }),
  setHoveredBioregion: (code) => set({ hoveredBioregion: code }),
  setUserLocation: (lat, lng) => set({ userLocation: { lat, lng } }),
  setUserBioregion: (code) => set({ userBioregion: code }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  flyTo: (lat, lng, zoom = 2.2) =>
    set({ cameraTarget: { lat, lng, zoom, timestamp: Date.now() } }),
  toggleFlowArcs: () => set((s) => ({ showFlowArcs: !s.showFlowArcs })),
  toggleBridges: () => set((s) => ({ showBridges: !s.showBridges })),
  toggleBioregions: () => set((s) => ({ showBioregions: !s.showBioregions })),
  toggleEcoregions: () => set((s) => ({ showEcoregions: !s.showEcoregions })),
  togglePlaceNames: () => set((s) => ({ showPlaceNames: !s.showPlaceNames })),
  toggleSatelliteImagery: () => set((s) => ({ showSatelliteImagery: !s.showSatelliteImagery })),
  toggleWaterFeatures: () => set((s) => ({ showWaterFeatures: !s.showWaterFeatures })),
  toggleNativeTerritories: () => set((s) => ({ showNativeTerritories: !s.showNativeTerritories })),
  toggleNativeLanguages: () => set((s) => ({ showNativeLanguages: !s.showNativeLanguages })),
  toggleNativeTreaties: () => set((s) => ({ showNativeTreaties: !s.showNativeTreaties })),
  setSelectedNativeLand: (selected) => set({ selectedNativeLand: selected }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setRealmFilter: (realms) =>
    set((s) => ({ filters: { ...s.filters, realms } })),
  setDomainFilter: (domains) =>
    set((s) => ({ filters: { ...s.filters, domains } })),
  setActivityFilter: (days) =>
    set((s) => ({ filters: { ...s.filters, activityDays: days } })),
  resetFilters: () =>
    set({
      filters: { realms: [], domains: [], activityDays: null, minBridges: 0 },
    }),
  setSelectedEcoregion: (ecoId) => set({ selectedEcoregion: ecoId }),
  setShowOnboarding: (show) => set({ showOnboarding: show }),
  setShowIntakeForm: (show) => set({ showIntakeForm: show }),
  setIsDrawingBoundary: (drawing) => set({ isDrawingBoundary: drawing }),
  addBoundaryPoint: (lngLat) =>
    set((s) => ({ onboardingBoundary: [...s.onboardingBoundary, lngLat] })),
  undoBoundaryPoint: () =>
    set((s) => ({ onboardingBoundary: s.onboardingBoundary.slice(0, -1) })),
  clearBoundary: () => set({ onboardingBoundary: [] }),
  setBoundary: (points) => set({ onboardingBoundary: points }),
  zoomDistance: 2.8,
  setZoomDistance: (distance) => set({ zoomDistance: distance }),
}));
