import type { NodeEntry, RegistryData, FlowData, BioregionInfo, BioregionLookup, BridgeEntry } from '@/types';

// ============================================================
// Seed Node Registry Data
// ============================================================

export const seedNodes: NodeEntry[] = [
  {
    node_id: 'a1b2c3d4-1111-4000-8000-000000000001',
    display_name: 'Colorado Plateau Watershed Commons',
    repo_url: 'https://github.com/opencivics-commons/colorado-plateau-watershed',
    quartz_url: 'https://colorado-plateau-watershed.opencivics.org',
    bioregion_codes: ['NA19'],
    thematic_domain: 'watershed-governance',
    topic_tags: ['water-rights', 'acequia', 'riparian-buffer', 'stream-health'],
    agent_endpoint: null,
    hosting: 'shared',
    federation_version: '1.0',
    schema_version: '1.0.0',
    bridges: ['NA19-watershed_NA15-water'],
    interaction_channels: { web_chat: true },
    created_at: '2026-01-15T00:00:00Z',
    maintainers: ['opencivics-team', 'watershed-steward'],
  },
  {
    node_id: 'a1b2c3d4-2222-4000-8000-000000000002',
    display_name: 'Sierra Nevada Water Systems Hub',
    repo_url: 'https://github.com/opencivics-commons/sierra-nevada-water',
    quartz_url: 'https://sierra-nevada-water.opencivics.org',
    bioregion_codes: ['NA15'],
    thematic_domain: 'watershed-governance',
    topic_tags: ['water-systems', 'snowpack', 'aquatic-indicators', 'allocation'],
    agent_endpoint: null,
    hosting: 'shared',
    federation_version: '1.0',
    schema_version: '2.1.0',
    bridges: ['NA19-watershed_NA15-water', 'NA15-water_NA08-cascadia'],
    interaction_channels: { web_chat: true },
    created_at: '2026-01-20T00:00:00Z',
    maintainers: ['sierra-steward'],
  },
  {
    node_id: 'a1b2c3d4-3333-4000-8000-000000000003',
    display_name: 'Cascadia Bioregion Governance',
    repo_url: 'https://github.com/opencivics-commons/cascadia-governance',
    quartz_url: 'https://cascadia-governance.opencivics.org',
    bioregion_codes: ['NA08'],
    thematic_domain: 'community-governance',
    topic_tags: ['bioregional-governance', 'watershed-councils', 'indigenous-sovereignty', 'salmon'],
    agent_endpoint: null,
    hosting: 'shared',
    federation_version: '1.0',
    schema_version: '1.0.0',
    bridges: ['NA15-water_NA08-cascadia', 'NA08-cascadia_NA22-greatlakes'],
    interaction_channels: { web_chat: true, telegram: '@cascadia_commons_bot' },
    created_at: '2026-01-25T00:00:00Z',
    maintainers: ['cascadia-council', 'opencivics-team'],
  },
  {
    node_id: 'a1b2c3d4-4444-4000-8000-000000000004',
    display_name: 'Great Lakes Commons Network',
    repo_url: 'https://github.com/opencivics-commons/great-lakes-commons',
    quartz_url: 'https://great-lakes-commons.opencivics.org',
    bioregion_codes: ['NA22'],
    thematic_domain: 'ecological-restoration',
    topic_tags: ['freshwater-ecology', 'invasive-species', 'wetland-restoration', 'tribal-agreements'],
    agent_endpoint: null,
    hosting: 'shared',
    federation_version: '1.0',
    schema_version: '1.0.0',
    bridges: ['NA08-cascadia_NA22-greatlakes'],
    interaction_channels: { web_chat: true },
    created_at: '2026-02-01T00:00:00Z',
    maintainers: ['greatlakes-steward'],
  },
  {
    node_id: 'a1b2c3d4-5555-4000-8000-000000000005',
    display_name: 'Chesapeake Watershed Alliance',
    repo_url: 'https://github.com/opencivics-commons/chesapeake-watershed',
    quartz_url: 'https://chesapeake-watershed.opencivics.org',
    bioregion_codes: ['NA25'],
    thematic_domain: 'watershed-governance',
    topic_tags: ['bay-restoration', 'nutrient-management', 'oyster-reefs', 'agricultural-runoff'],
    agent_endpoint: null,
    hosting: 'shared',
    federation_version: '1.0',
    schema_version: '1.0.0',
    bridges: [],
    interaction_channels: { web_chat: true },
    created_at: '2026-02-05T00:00:00Z',
    maintainers: ['chesapeake-steward', 'opencivics-team'],
  },
];

export const seedRegistry: RegistryData = {
  nodes: seedNodes,
  meta: {
    count: seedNodes.length,
    last_updated: '2026-02-10T00:00:00Z',
  },
};

// ============================================================
// Seed Flow Data (mock git fork/contribution data)
// ============================================================

export const seedFlows: FlowData = {
  flows: [
    {
      source_node_id: 'a1b2c3d4-1111-4000-8000-000000000001',
      target_node_id: 'a1b2c3d4-2222-4000-8000-000000000002',
      flow_type: 'contribution',
      volume: 12,
      last_activity: '2026-02-08T00:00:00Z',
      direction: 'bidirectional',
    },
    {
      source_node_id: 'a1b2c3d4-2222-4000-8000-000000000002',
      target_node_id: 'a1b2c3d4-3333-4000-8000-000000000003',
      flow_type: 'fork',
      volume: 5,
      last_activity: '2026-02-06T00:00:00Z',
      direction: 'unidirectional',
    },
    {
      source_node_id: 'a1b2c3d4-3333-4000-8000-000000000003',
      target_node_id: 'a1b2c3d4-4444-4000-8000-000000000004',
      flow_type: 'contribution',
      volume: 8,
      last_activity: '2026-02-09T00:00:00Z',
      direction: 'bidirectional',
    },
    {
      source_node_id: 'a1b2c3d4-1111-4000-8000-000000000001',
      target_node_id: 'a1b2c3d4-5555-4000-8000-000000000005',
      flow_type: 'fork',
      volume: 3,
      last_activity: '2026-02-05T00:00:00Z',
      direction: 'unidirectional',
    },
    {
      source_node_id: 'a1b2c3d4-4444-4000-8000-000000000004',
      target_node_id: 'a1b2c3d4-5555-4000-8000-000000000005',
      flow_type: 'contribution',
      volume: 2,
      last_activity: '2026-02-03T00:00:00Z',
      direction: 'unidirectional',
    },
  ],
  generated_at: '2026-02-10T12:00:00Z',
  cache_ttl: 3600,
};

// ============================================================
// Bioregion Lookup (key seed bioregions + a selection of others)
// ============================================================

export const bioregionLookup: BioregionLookup = {
  // Seed node bioregions
  NA19: {
    code: 'NA19',
    name: 'Colorado Plateau & Mountain Forests',
    realm: 'Nearctic',
    subrealm: 'Western North America',
    centroid: [-109.5, 37.5],
  },
  NA15: {
    code: 'NA15',
    name: 'Sierra Nevada & California Chaparral',
    realm: 'Nearctic',
    subrealm: 'Western North America',
    centroid: [-119.5, 37.0],
  },
  NA08: {
    code: 'NA08',
    name: 'Pacific Northwest Coastal Forests',
    realm: 'Nearctic',
    subrealm: 'Western North America',
    centroid: [-122.5, 46.0],
  },
  NA22: {
    code: 'NA22',
    name: 'Great Lakes & St. Lawrence Forests',
    realm: 'Nearctic',
    subrealm: 'Eastern North America',
    centroid: [-83.0, 44.0],
  },
  NA25: {
    code: 'NA25',
    name: 'Mid-Atlantic Coastal Forests',
    realm: 'Nearctic',
    subrealm: 'Eastern North America',
    centroid: [-76.5, 38.5],
  },
  // Additional bioregions for global presence
  PA09: {
    code: 'PA09',
    name: 'English Lowlands & Welsh Borders',
    realm: 'Palearctic',
    subrealm: 'Western Europe',
    centroid: [-1.5, 52.0],
  },
  PA15: {
    code: 'PA15',
    name: 'Mediterranean Forests & Woodlands',
    realm: 'Palearctic',
    subrealm: 'Mediterranean',
    centroid: [15.0, 40.0],
  },
  NT14: {
    code: 'NT14',
    name: 'Serra do Mar & Atlantic Forests',
    realm: 'Neotropic',
    subrealm: 'South America',
    centroid: [-45.0, -23.0],
  },
  AT11: {
    code: 'AT11',
    name: 'East African Montane & Coastal Forests',
    realm: 'Afrotropic',
    subrealm: 'East Africa',
    centroid: [37.0, -3.0],
  },
  IM06: {
    code: 'IM06',
    name: 'Western Ghats & Sri Lankan Rainforests',
    realm: 'Indomalayan',
    subrealm: 'South Asia',
    centroid: [76.0, 12.0],
  },
  AU03: {
    code: 'AU03',
    name: 'Southeast Australian Temperate Forests',
    realm: 'Australasia',
    subrealm: 'Australia',
    centroid: [147.0, -37.0],
  },
  OC03: {
    code: 'OC03',
    name: 'Polynesian-Micronesian Tropical Islands',
    realm: 'Oceanian',
    subrealm: 'Pacific Islands',
    centroid: [-170.0, -14.0],
  },
};

// ============================================================
// Seed Bridge Data
// ============================================================

export const seedBridges: BridgeEntry[] = [
  {
    bridge_id: 'NA19-watershed_NA15-water',
    version: '1.0.0',
    source_node_id: 'a1b2c3d4-1111-4000-8000-000000000001',
    target_node_id: 'a1b2c3d4-2222-4000-8000-000000000002',
    vocabulary_count: 24,
    confidence_avg: 0.82,
    last_updated: '2026-02-08T00:00:00Z',
    review_status: 'recent',
  },
  {
    bridge_id: 'NA15-water_NA08-cascadia',
    version: '1.0.0',
    source_node_id: 'a1b2c3d4-2222-4000-8000-000000000002',
    target_node_id: 'a1b2c3d4-3333-4000-8000-000000000003',
    vocabulary_count: 18,
    confidence_avg: 0.75,
    last_updated: '2026-01-30T00:00:00Z',
    review_status: 'recent',
  },
  {
    bridge_id: 'NA08-cascadia_NA22-greatlakes',
    version: '0.9.0',
    source_node_id: 'a1b2c3d4-3333-4000-8000-000000000003',
    target_node_id: 'a1b2c3d4-4444-4000-8000-000000000004',
    vocabulary_count: 15,
    confidence_avg: 0.68,
    last_updated: '2026-01-15T00:00:00Z',
    review_status: 'approaching',
  },
];

// ============================================================
// Helper: Get node coordinates from bioregion
// ============================================================

export function getNodePosition(node: NodeEntry): [number, number] | null {
  const primaryCode = node.bioregion_codes[0];
  const bioregion = bioregionLookup[primaryCode];
  if (!bioregion) return null;
  return bioregion.centroid;
}

export function getBioregionForCode(code: string): BioregionInfo | null {
  return bioregionLookup[code] || null;
}
