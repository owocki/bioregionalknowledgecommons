import { create } from 'zustand';
import type { GlobeState, Realm, ThematicDomain, CameraTarget } from '@/types';

interface HoveredFlow {
  sourceId: string;
  targetId: string;
}

interface GlobeStore extends GlobeState {
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
  setViewMode: (mode: 'globe' | 'map' | 'list') => void;
  setSearchQuery: (query: string) => void;
  setRealmFilter: (realms: Realm[]) => void;
  setDomainFilter: (domains: ThematicDomain[]) => void;
  setActivityFilter: (days: number | null) => void;
  resetFilters: () => void;
  /** Flow hover state for tooltip */
  hoveredFlow: HoveredFlow | null;
  setHoveredFlow: (flow: HoveredFlow | null) => void;
  setShowOnboarding: (show: boolean) => void;
}

const initialState: GlobeState = {
  selectedNodeId: null,
  selectedBioregion: null,
  hoveredBioregion: null,
  userLocation: null,
  userBioregion: null,
  cameraTarget: null,
  showFlowArcs: true,
  showBridges: true,
  showBioregions: true,
  showOnboarding: false,
  viewMode: 'globe',
  searchQuery: '',
  filters: {
    realms: [],
    domains: [],
    activityDays: null,
    minBridges: 0,
  },
};

export const useGlobeStore = create<GlobeStore>((set) => ({
  ...initialState,

  hoveredFlow: null,
  setHoveredFlow: (flow) => set({ hoveredFlow: flow }),
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
  setShowOnboarding: (show) => set({ showOnboarding: show }),
}));
