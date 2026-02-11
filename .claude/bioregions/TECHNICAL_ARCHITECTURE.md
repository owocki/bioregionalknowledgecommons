# Bioregional Knowledge Commons Visualizer

**Technical Architecture Document**

OpenCivics Labs · Version 1.0 · February 2026

---

## Contents

1. [Architecture Overview](#1-architecture-overview)
2. [System Topology](#2-system-topology)
3. [Module Technical Specifications](#3-module-technical-specifications)
4. [Data Schemas & Contracts](#4-data-schemas--contracts)
5. [API Specifications](#5-api-specifications)
6. [Infrastructure Architecture](#6-infrastructure-architecture)
7. [Security Model](#7-security-model)
8. [Performance Requirements](#8-performance-requirements)
9. [Integration Patterns](#9-integration-patterns)
10. [Technology Stack Details](#10-technology-stack-details)

---

## 1. Architecture Overview

### 1.1 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Permissionless First** | All platform actions have git-equivalent paths; registry.json is the protocol |
| **Module Independence** | Each module functions in degraded mode without others |
| **Community Ownership** | Data lives in community-owned GitHub repos; platform is a view layer |
| **BYOK (Bring Your Own Key)** | AI compute costs borne by node operators via their own API keys |
| **Progressive Enhancement** | Minimal registration (JSON entry) → full features (agent, bridges, federation) |

### 1.2 Architecture Pattern

The system follows a **federated microservices architecture** with a git-native data layer:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Globe View    │  │   Node Cards    │  │     Creation Portal         │  │
│  │   (Three.js)    │  │    (React)      │  │      (Next.js)              │  │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘  │
│           │                    │                          │                  │
├───────────┴────────────────────┴──────────────────────────┴──────────────────┤
│                              APPLICATION LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Next.js API Routes                                │ │
│  │  /api/registry  /api/flows  /api/bioregion  /api/agents  /api/search    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                              AGENT RUNTIME LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Agent A    │  │  Agent B    │  │  Agent N    │  │  Config Agent       │  │
│  │  (Claude)   │  │  (Claude)   │  │  (Claude)   │  │  (Claude)           │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                │                     │            │
│  ┌──────┴────────────────┴────────────────┴─────────────────────┴──────────┐ │
│  │                    Federation Protocol (HTTPS/JSON)                      │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                              DATA LAYER                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │   PostgreSQL    │  │    pgvector     │  │      GitHub Registry        │   │
│  │  (Agent Memory) │  │  (RAG Indexes)  │  │   (registry.json + YAML)    │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘   │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                              EXTERNAL SERVICES                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  GitHub  │  │ Claude   │  │ Telegram │  │  Vercel  │  │ One Earth    │   │
│  │   API    │  │   API    │  │ Bot API  │  │ Hosting  │  │ Bioregions   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Module Dependency Graph

```
                    ┌──────────────────┐
                    │  Index Registry  │ ← Single source of truth
                    │    (Module 7)    │
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │    Globe    │   │   Schema    │   │   Agent     │
    │  (Module 1) │   │   Bridges   │   │  Runtime    │
    └──────┬──────┘   │  (Module 6) │   │ (Module 4)  │
           │          └──────┬──────┘   └──────┬──────┘
           │                 │                 │
           ▼                 └────────┬────────┘
    ┌─────────────┐                   ▼
    │ Node Cards  │           ┌─────────────┐
    │ (Module 2)  │◄──────────│ Federation  │
    └─────────────┘           │ (Module 5)  │
           ▲                  └─────────────┘
           │
    ┌─────────────┐
    │  Creation   │
    │   Engine    │
    │ (Module 3)  │
    └─────────────┘
```

---

## 2. System Topology

### 2.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VERCEL EDGE                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      Next.js Application                           │ │
│  │  • Globe (SSG + client hydration)                                  │ │
│  │  • Node Cards (SSR)                                                │ │
│  │  • API Routes (Serverless Functions)                               │ │
│  │  • Creation Portal (SSR with GitHub OAuth)                         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     SHARED AGENT SERVER (Railway/Fly.io)                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     Container Orchestration                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │ │
│  │  │   Agent A    │  │   Agent B    │  │   Agent C    │  ...        │ │
│  │  │  Container   │  │  Container   │  │  Container   │             │ │
│  │  │ (Node.js)    │  │ (Node.js)    │  │ (Node.js)    │             │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         PostgreSQL                                 │ │
│  │  • Agent Memory (JSON documents)                                   │ │
│  │  • pgvector Extension (RAG embeddings)                             │ │
│  │  • Session State                                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     Configuration Agent                            │ │
│  │  • Node Scaffolding                                                │ │
│  │  • Registry PR Generation                                          │ │
│  │  • Interaction Channel Setup                                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          GITHUB                                          │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
│  │   Index Registry   │  │  Template Repo     │  │  Node Repos      │  │
│  │   (registry.json)  │  │  (Obsidian vault)  │  │  (Community)     │  │
│  │   (bridges/*.yaml) │  │  (Quartz config)   │  │                  │  │
│  └────────────────────┘  └────────────────────┘  └──────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      GitHub Actions CI                             │ │
│  │  • validate-node.yaml (JSON Schema validation)                     │ │
│  │  • validate-bridge.yaml (Bridge validation)                        │ │
│  │  • build-globe.yaml (Trigger Vercel rebuild)                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Topology

```
User Request Flow:

  Browser ──► Vercel ──► GitHub (registry.json) ──► Render Globe
     │                                                    │
     │                                                    ▼
     └──────────────────────────────────────────────► Node Card
                                                          │
                                                          ▼
                                               Embedded Agent Chat
                                                          │
                                                          ▼
                                               Shared Agent Server
                                                          │
                                        ┌─────────────────┼─────────────────┐
                                        ▼                 ▼                 ▼
                                   pgvector          Claude API      Federation
                                   (RAG)            (Reasoning)       (Peers)
```

---

## 3. Module Technical Specifications

### 3.1 Module 1: Globe

#### 3.1.1 Rendering Engine

| Component | Technology | Specification |
|-----------|------------|---------------|
| 3D Engine | Three.js r150+ | WebGL 2.0, ES Module build |
| Globe Geometry | `SphereGeometry` | 64 segments, radius 1.0 |
| Bioregion Layer | Custom shader material | Choropleth from vertex colors |
| Vector Tiles | MapLibre GL JS 3.x | Tippecanoe-generated tiles |
| Flow Arcs | `TubeGeometry` + Custom shader | Animated UV offset for particle effect |

#### 3.1.2 Bioregion Data Pipeline

```
one_earth-bioregions-2023-enriched.geojson (21.4 MB)
                    │
                    ▼
            Tippecanoe Processing
            • Simplify to 2-3 MB
            • Generate vector tiles
            • Extract centroids
                    │
                    ▼
    ┌───────────────┴───────────────┐
    │                               │
    ▼                               ▼
bioregion-tiles/              bioregion-lookup.json
(Mapbox Vector Tiles)         (48 KB, centroid + metadata)
    │                               │
    ▼                               ▼
MapLibre GL Layer             Point-in-Polygon Lookup
(Choropleth rendering)        (Client-side geolocation)
```

#### 3.1.3 Globe Component Structure

```typescript
// src/components/globe/Globe.tsx
interface GlobeProps {
  registryData: RegistryData;
  flowData: FlowData;
  onNodeClick: (nodeId: string) => void;
  onBioregionHover: (code: string | null) => void;
  userLocation?: { lat: number; lng: number };
}

// Sub-components
Globe/
├── GlobeCore.tsx           // Three.js scene, camera, renderer
├── BioregionLayer.tsx      // Choropleth mesh from vector tiles
├── NodeMarkers.tsx         // Instanced meshes for node points
├── FlowArcs.tsx            // Animated arc geometries
├── BridgeConnections.tsx   // Dashed line geometries
├── SearchOverlay.tsx       // Global search UI
├── FilterPanel.tsx         // Filter controls
└── hooks/
    ├── useGlobeAnimation.ts    // Rotation, zoom, transition
    ├── useBioregionLookup.ts   // Point-in-polygon
    └── useFlowData.ts          // Git flow arc calculations
```

#### 3.1.4 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load | < 3s on broadband | First Contentful Paint |
| Interaction Latency | < 16ms (60fps) | RAF callback duration |
| Memory | < 200 MB | Chrome DevTools heap |
| Node Render Limit | 500 nodes | No visible lag |
| Arc Render Limit | 1000 arcs | Maintained 60fps |

### 3.2 Module 2: Node Cards

#### 3.2.1 Component Architecture

```typescript
// src/components/node-card/NodeCard.tsx
interface NodeCardProps {
  node: NodeEntry;
  onClose: () => void;
}

NodeCard/
├── IdentityBlock.tsx       // Name, bioregion, description, maintainers
├── ActivityBlock.tsx       // Stats, flow connections, bridges
├── ParticipationBlock.tsx  // Read/Ask/Contribute/Connect/Fork CTAs
├── AgentChat.tsx           // Embedded chat interface
├── MiniMap.tsx             // Bioregion highlight map
└── ShareButton.tsx         // URL copy, social sharing
```

#### 3.2.2 Agent Chat Integration

```typescript
// src/components/node-card/AgentChat.tsx
interface AgentChatProps {
  nodeId: string;
  agentEndpoint: string | null;
  fallbackMode: 'quartz-link' | 'disabled';
}

// WebSocket connection for real-time chat
const ws = new WebSocket(`wss://agents.opencivics.org/${nodeId}/chat`);

// Message format
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  federatedFrom?: {
    nodeId: string;
    nodeName: string;
    bridgeId?: string;
  };
}
```

### 3.3 Module 3: Node Creation Engine

#### 3.3.1 Configuration Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Configuration Agent                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Claude API (Anthropic)                      │  │
│  │  System Prompt: Node scaffolding specialist                    │  │
│  │  Tools: GitHub API, Template Engine, Registry Writer           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │   Intake Parser │  │ Schema Generator│  │  Registry Writer    │ │
│  │                 │  │                 │  │                     │ │
│  │ • Parse form    │  │ • Generate      │  │ • Create JSON entry │ │
│  │ • Extract       │  │   schema.yaml   │  │ • Submit PR         │ │
│  │   vocabulary    │  │ • Generate      │  │ • Track CI status   │ │
│  │ • Detect        │  │   agent.config  │  │                     │ │
│  │   bioregion     │  │ • Scaffold      │  │                     │ │
│  │                 │  │   vault pages   │  │                     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3.3.2 Creation Flow State Machine

```
┌─────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────┐
│ INTAKE  │────►│ BIOREGION   │────►│ DEFINITION   │────►│ GITHUB     │
│         │     │ DETECTION   │     │ GATHERING    │     │ SETUP      │
└─────────┘     └─────────────┘     └──────────────┘     └─────┬──────┘
                                                               │
┌─────────┐     ┌─────────────┐     ┌──────────────┐          │
│COMPLETE │◄────│ REGISTRY    │◄────│ AGENT        │◄─────────┘
│         │     │ SUBMISSION  │     │ CONFIG       │
└─────────┘     └─────────────┘     └──────────────┘
```

#### 3.3.3 CLI Package Structure

```
@opencivics/commons/
├── bin/
│   └── commons.js              # CLI entry point
├── src/
│   ├── commands/
│   │   ├── init.ts             # npx @opencivics/commons init
│   │   ├── register.ts         # npx @opencivics/commons register
│   │   ├── agent-setup.ts      # npx @opencivics/commons agent setup
│   │   ├── bridge-propose.ts   # npx @opencivics/commons bridge propose
│   │   ├── bridge-validate.ts  # npx @opencivics/commons bridge validate
│   │   ├── agent-test.ts       # npx @opencivics/commons agent test
│   │   └── status.ts           # npx @opencivics/commons status
│   ├── lib/
│   │   ├── github.ts           # GitHub API wrapper
│   │   ├── registry.ts         # Registry operations
│   │   ├── schema.ts           # Schema/bridge validation
│   │   └── agent.ts            # Agent configuration
│   └── templates/
│       ├── schema.yaml.hbs     # Handlebars template
│       └── agent.config.yaml.hbs
├── package.json
└── tsconfig.json
```

### 3.4 Module 4: Agent Runtime

#### 3.4.1 Agent Container Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Agent Container (per node)                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Node.js Runtime                            │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │                    Agent Core                            │  │  │
│  │  │  • Message Router (WebSocket + HTTP)                     │  │  │
│  │  │  • Tool Executor (RAG, GitHub, Federation)               │  │  │
│  │  │  • Memory Manager (read/write PostgreSQL)                │  │  │
│  │  │  • Bridge Loader (cache bridge YAML)                     │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Environment Variables:                                              │
│  • CLAUDE_API_KEY (encrypted, from operator)                         │
│  • NODE_ID                                                           │
│  • GITHUB_REPO_URL                                                   │
│  • VECTOR_STORE_URL                                                  │
│  • MEMORY_DB_URL                                                     │
│  • FEDERATION_POLICY                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3.4.2 Tool Definitions

```typescript
// Agent tool schema (Claude tool use format)
const agentTools = [
  {
    name: "search_vault",
    description: "Search the knowledge vault using semantic similarity",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number", default: 5 }
      },
      required: ["query"]
    }
  },
  {
    name: "federated_query",
    description: "Route a query to peer nodes via federation",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
        target_nodes: { type: "array", items: { type: "string" } },
        use_bridges: { type: "boolean", default: true }
      },
      required: ["query"]
    }
  },
  {
    name: "github_commit",
    description: "Commit content to the vault repository",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" },
        message: { type: "string" }
      },
      required: ["path", "content", "message"]
    }
  },
  {
    name: "read_memory",
    description: "Read from persistent agent memory",
    input_schema: {
      type: "object",
      properties: {
        key: { type: "string" }
      },
      required: ["key"]
    }
  },
  {
    name: "write_memory",
    description: "Write to persistent agent memory",
    input_schema: {
      type: "object",
      properties: {
        key: { type: "string" },
        value: { type: "object" }
      },
      required: ["key", "value"]
    }
  }
];
```

#### 3.4.3 RAG Pipeline

```
Vault Update Trigger (GitHub Webhook)
              │
              ▼
    ┌─────────────────┐
    │  Content Fetch  │  ← Pull changed .md files from repo
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │    Chunking     │  ← Split by heading, 500-1000 tokens
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │   Embedding     │  ← OpenAI text-embedding-3-small or local
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │    pgvector     │  ← Upsert with file path + chunk index
    └─────────────────┘
```

### 3.5 Module 5: Federation Layer

#### 3.5.1 Protocol Specification

```yaml
# Federation Protocol v1.0

Endpoints:
  POST /federation/query      # Receive federated query
  GET  /federation/health     # Health check for discovery
  GET  /federation/manifest   # Node capabilities and schema version

Authentication: None (v1), Mutual TLS or signed tokens (v2)

Rate Limiting:
  - Per-source-node: 100 requests/minute
  - Global: 1000 requests/minute

Timeout: 30 seconds per request
```

#### 3.5.2 Query Routing Algorithm

```typescript
interface RoutingDecision {
  isLocal: boolean;
  candidatePeers: PeerCandidate[];
}

interface PeerCandidate {
  nodeId: string;
  score: number;          // 0-1 routing score
  hasBridge: boolean;
  bridgeId?: string;
  bioregionProximity: number;  // 0-1
  thematicOverlap: number;     // 0-1
}

function routeQuery(query: string, context: QueryContext): RoutingDecision {
  // 1. Classify query intent
  const intent = classifyIntent(query);

  // 2. Check local vault coverage
  const localConfidence = await searchVaultConfidence(query);
  if (localConfidence > 0.8) {
    return { isLocal: true, candidatePeers: [] };
  }

  // 3. Score peer candidates
  const peers = await fetchPeersFromRegistry();
  const candidates = peers
    .map(peer => ({
      nodeId: peer.node_id,
      score: calculateRoutingScore(peer, intent, context),
      hasBridge: hasBridgeTo(peer.node_id),
      bridgeId: getBridgeId(peer.node_id),
      bioregionProximity: bioregionDistance(peer.bioregion_codes, context.bioregion),
      thematicOverlap: domainSimilarity(peer.thematic_domain, context.domain)
    }))
    .filter(c => c.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);  // Top 5 candidates

  return { isLocal: false, candidatePeers: candidates };
}
```

### 3.6 Module 6: Schema Bridges

#### 3.6.1 Bridge File Structure

```yaml
# Bridge YAML Schema (JSON Schema reference: bridge-schema.json)

bridge_id: string           # Format: {nodeA_code}-{nodeB_code}
version: semver             # Semantic version
last_updated: ISO8601       # Last modification date

nodes:
  source:
    node_id: UUID
    display_name: string
    schema_version: semver
  target:
    node_id: UUID
    display_name: string
    schema_version: semver

vocabulary:                 # Array of term mappings
  - source_term: string
    target_term: string | null
    confidence: number      # 0.0-1.0
    notes: string?

structure:                  # Directory path mappings
  - source_path: string
    target_path: string

taxonomies:                 # Category system mappings
  - name: string
    mapping: object         # key-value pairs

query_translation:          # Query rewrite patterns
  - source_pattern: string  # With {placeholders}
    target_pattern: string

bidirectional: boolean      # If mappings work both ways

maintainers:
  - github: string
review_schedule: string     # "quarterly" | "monthly" | "annual"
```

#### 3.6.2 Translation Engine

```typescript
class BridgeTranslator {
  private bridges: Map<string, Bridge>;

  constructor(bridgeFiles: string[]) {
    this.bridges = this.loadBridges(bridgeFiles);
  }

  translateQuery(
    query: string,
    sourceNodeId: string,
    targetNodeId: string
  ): TranslatedQuery {
    const bridge = this.findBridge(sourceNodeId, targetNodeId);
    if (!bridge) {
      return { text: query, translations: [], bridgeId: null };
    }

    let translated = query;
    const translations: TermTranslation[] = [];

    // Apply vocabulary mappings
    for (const mapping of bridge.vocabulary) {
      if (translated.includes(mapping.source_term)) {
        if (mapping.target_term) {
          translated = translated.replace(
            new RegExp(mapping.source_term, 'gi'),
            mapping.target_term
          );
        }
        translations.push({
          original: mapping.source_term,
          translated: mapping.target_term,
          confidence: mapping.confidence
        });
      }
    }

    // Apply query translation patterns
    for (const pattern of bridge.query_translation) {
      const regex = this.patternToRegex(pattern.source_pattern);
      const match = translated.match(regex);
      if (match) {
        translated = this.applyPattern(translated, pattern, match);
      }
    }

    return {
      text: translated,
      translations,
      bridgeId: bridge.bridge_id
    };
  }
}
```

### 3.7 Module 7: Index Registry

#### 3.7.1 Repository Structure

```
index-registry/
├── registry.json                    # Master node manifest
├── bridges/
│   ├── NA19-watershed_NA15-water.bridge.yaml
│   ├── PA09-governance_PA12-commons.bridge.yaml
│   └── ...
├── schema/
│   ├── node-schema.json            # JSON Schema for registry.json entries
│   ├── bridge-schema.json          # JSON Schema for bridge files
│   └── federation-schema.json      # JSON Schema for federation protocol
├── data/
│   ├── bioregion-lookup.json       # Bioregion code → metadata
│   └── realm-colors.json           # Realm → color palette
├── .github/
│   └── workflows/
│       ├── validate-node.yaml      # Runs on registry.json changes
│       ├── validate-bridge.yaml    # Runs on bridges/*.yaml changes
│       └── notify-rebuild.yaml     # Triggers Vercel/Netlify rebuild
├── CONTRIBUTING.md
└── README.md
```

#### 3.7.2 CI Validation Pipeline

```yaml
# .github/workflows/validate-node.yaml
name: Validate Node Entry

on:
  pull_request:
    paths:
      - 'registry.json'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate JSON Schema
        uses: dsanders11/json-schema-validate-action@v1
        with:
          files: registry.json
          schema: schema/node-schema.json

      - name: Check bioregion codes
        run: |
          node scripts/validate-bioregions.js

      - name: Check for duplicate node_id
        run: |
          node scripts/check-duplicates.js

      - name: Validate URLs
        run: |
          node scripts/validate-urls.js

      - name: Health check agent endpoints
        run: |
          node scripts/health-check.js
```

---

## 4. Data Schemas & Contracts

### 4.1 Registry Entry Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://opencivics.org/schemas/node-entry.json",
  "title": "Node Registry Entry",
  "type": "object",
  "required": ["node_id", "display_name", "repo_url", "bioregion_codes", "thematic_domain", "created_at", "maintainers"],
  "properties": {
    "node_id": {
      "type": "string",
      "format": "uuid"
    },
    "display_name": {
      "type": "string",
      "minLength": 3,
      "maxLength": 100
    },
    "repo_url": {
      "type": "string",
      "format": "uri",
      "pattern": "^https://github\\.com/"
    },
    "quartz_url": {
      "type": ["string", "null"],
      "format": "uri"
    },
    "bioregion_codes": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^(NA|PA|NT|AT|IM|AU|OC|AN)[0-9]{2}$"
      },
      "minItems": 1
    },
    "thematic_domain": {
      "type": "string",
      "enum": ["watershed-governance", "food-systems", "cultural-heritage", "ecological-restoration", "community-governance", "traditional-knowledge", "climate-resilience", "other"]
    },
    "topic_tags": {
      "type": "array",
      "items": { "type": "string" }
    },
    "agent_endpoint": {
      "type": ["string", "null"],
      "format": "uri"
    },
    "hosting": {
      "type": "string",
      "enum": ["shared", "self-hosted"]
    },
    "federation_version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+$"
    },
    "schema_version": {
      "type": "string"
    },
    "bridges": {
      "type": "array",
      "items": { "type": "string" }
    },
    "interaction_channels": {
      "type": "object",
      "properties": {
        "web_chat": { "type": "boolean" },
        "telegram": { "type": "string" },
        "api": { "type": "string", "format": "uri" }
      }
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "maintainers": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    }
  }
}
```

### 4.2 Agent Memory Schema

```typescript
// PostgreSQL table schema
interface AgentMemory {
  id: string;                    // UUID
  node_id: string;               // FK to node
  memory_type: MemoryType;
  key: string;
  value: JsonObject;
  created_at: Date;
  updated_at: Date;
  expires_at: Date | null;
}

type MemoryType =
  | 'conversation'      // Chat history
  | 'learned_fact'      // Extracted knowledge
  | 'user_preference'   // User-specific settings
  | 'federation_log'    // Cross-node query history
  | 'insight'           // Agent-generated insights
  | 'task'              // Pending tasks
  ;
```

### 4.3 Flow Data Schema

```typescript
// Git flow data (cached from GitHub API)
interface FlowData {
  flows: Flow[];
  generated_at: string;         // ISO8601
  cache_ttl: number;            // Seconds until refresh
}

interface Flow {
  source_node_id: string;
  target_node_id: string;
  flow_type: 'fork' | 'contribution';
  volume: number;               // Contribution count
  last_activity: string;        // ISO8601
  direction: 'unidirectional' | 'bidirectional';
}
```

---

## 5. API Specifications

### 5.1 Globe API (Next.js API Routes)

```typescript
// GET /api/registry
// Returns the full registry for globe rendering
interface RegistryResponse {
  nodes: NodeEntry[];
  meta: {
    count: number;
    last_updated: string;
  };
}

// GET /api/flows
// Returns git flow data for arc rendering
interface FlowsResponse {
  flows: Flow[];
  generated_at: string;
}

// GET /api/bioregion/:code
// Returns bioregion metadata and nodes
interface BioregionResponse {
  code: string;
  name: string;
  realm: string;
  subrealm: string;
  centroid: [number, number];
  nodes: NodeEntry[];
}

// POST /api/search
// Federated search across all nodes
interface SearchRequest {
  query: string;
  filters?: {
    bioregion_codes?: string[];
    thematic_domains?: string[];
  };
}
interface SearchResponse {
  results: SearchResult[];
  responding_nodes: string[];
}
```

### 5.2 Agent API

```typescript
// WebSocket /agent/:nodeId/chat
// Real-time chat with node agent
interface ChatWebSocket {
  // Client → Server
  send(message: UserMessage): void;

  // Server → Client
  onmessage: (response: AgentResponse) => void;
}

interface UserMessage {
  type: 'message';
  content: string;
  session_id?: string;
}

interface AgentResponse {
  type: 'message' | 'typing' | 'sources' | 'error';
  content?: string;
  sources?: SourceCitation[];
  federated_from?: FederatedSource;
}

// GET /agent/:nodeId/health
// Health check endpoint
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  last_query: string | null;
  vector_store: 'connected' | 'disconnected';
  memory_store: 'connected' | 'disconnected';
}
```

### 5.3 Federation API

```typescript
// POST /federation/query
// Receive query from peer agent
interface FederationQueryRequest {
  query_id: string;
  source_node_id: string;
  query_text: string;
  translated_query_text?: string;
  bridge_id?: string;
  context: {
    bioregion_code: string;
    thematic_domain: string;
  };
  max_response_tokens: number;
}

interface FederationQueryResponse {
  query_id: string;
  responding_node_id: string;
  response_text: string;
  confidence: number;
  translation_notes: TranslationNote[];
  source_documents: SourceDocument[];
}

// GET /federation/manifest
// Node capabilities for discovery
interface FederationManifest {
  node_id: string;
  federation_version: string;
  schema_version: string;
  thematic_domain: string;
  topic_tags: string[];
  federation_policy: FederationPolicy;
  bridges: string[];
}
```

---

## 6. Infrastructure Architecture

### 6.1 Shared Server Specification

```yaml
# Railway/Fly.io Configuration

Services:
  agent-orchestrator:
    image: opencivics/agent-orchestrator:latest
    replicas: 1
    cpu: 1
    memory: 2GB
    env:
      - DATABASE_URL
      - REDIS_URL
    healthcheck:
      path: /health
      interval: 30s

  agent-container:
    # Spawned per-node by orchestrator
    image: opencivics/agent-runtime:latest
    cpu: 0.5
    memory: 1GB
    env:
      - CLAUDE_API_KEY (encrypted)
      - NODE_ID
      - VECTOR_STORE_URL
    healthcheck:
      path: /health
      interval: 60s

  postgresql:
    image: pgvector/pgvector:pg16
    storage: 50GB
    cpu: 2
    memory: 4GB
    extensions:
      - pgvector

  redis:
    image: redis:7-alpine
    storage: 1GB
    memory: 512MB
```

### 6.2 Container Orchestration

```
┌─────────────────────────────────────────────────────────────────┐
│                     Agent Orchestrator                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │   Process Manager                                          │  │
│  │   • Watch registry.json for node additions/removals        │  │
│  │   • Spawn/terminate agent containers                       │  │
│  │   • Health monitoring and auto-restart                     │  │
│  │   • API key rotation handling                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Agent-NA19  │  │ Agent-PA09  │  │ Agent-NT14  │  ...         │
│  │ Container   │  │ Container   │  │ Container   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Database Schema

```sql
-- Agent Memory Store
CREATE TABLE agent_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL,
    memory_type VARCHAR(50) NOT NULL,
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(node_id, memory_type, key)
);

CREATE INDEX idx_memories_node ON agent_memories(node_id);
CREATE INDEX idx_memories_type ON agent_memories(memory_type);

-- Vector Store (per-node schema)
CREATE TABLE vault_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),  -- OpenAI embedding dimension
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(node_id, file_path, chunk_index)
);

CREATE INDEX idx_embeddings_node ON vault_embeddings(node_id);
CREATE INDEX idx_embeddings_vector ON vault_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Session State
CREATE TABLE agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL,
    channel VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    messages JSONB[] DEFAULT '{}',
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Security Model

### 7.1 API Key Management

```
┌─────────────────────────────────────────────────────────────────┐
│                     Key Management Flow                          │
│                                                                  │
│  1. Operator provides API key during onboarding                 │
│                        │                                         │
│                        ▼                                         │
│  2. Key encrypted with server-side secret (AES-256-GCM)         │
│                        │                                         │
│                        ▼                                         │
│  3. Encrypted key stored in PostgreSQL                          │
│     (separate table, restricted access)                          │
│                        │                                         │
│                        ▼                                         │
│  4. Agent container decrypts at runtime                         │
│     (key never written to disk, only in memory)                 │
│                        │                                         │
│                        ▼                                         │
│  5. API calls to Claude use decrypted key                       │
│     (HTTPS only, no logging of key)                             │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Authentication Layers

| Layer | Method | Purpose |
|-------|--------|---------|
| GitHub OAuth | OAuth 2.0 | Portal access, repo operations |
| Agent API | Session token | Chat authentication |
| Federation | None (v1) / mTLS (v2) | Agent-to-agent auth |
| CLI | GitHub PAT | Registry operations |
| Admin | API key + IP allowlist | Server management |

### 7.3 Data Protection

```yaml
Data at Rest:
  - PostgreSQL: Encrypted volumes (provider-managed)
  - API keys: AES-256-GCM encryption
  - Backups: Encrypted with separate key

Data in Transit:
  - All external: TLS 1.3
  - Internal services: TLS 1.2+
  - Federation: HTTPS required

Data Retention:
  - Chat sessions: 30 days (configurable per node)
  - Agent memory: Indefinite (owner-controlled)
  - Vector embeddings: Until vault content removed
  - Logs: 7 days
```

---

## 8. Performance Requirements

### 8.1 Response Time Targets

| Operation | P50 | P95 | P99 |
|-----------|-----|-----|-----|
| Globe initial load | 1.5s | 2.5s | 3.0s |
| Node card open | 200ms | 400ms | 600ms |
| Agent response (local) | 1.0s | 2.0s | 3.0s |
| Agent response (federated) | 2.0s | 4.0s | 6.0s |
| Search results | 2.0s | 3.5s | 5.0s |
| Registry CI validation | 30s | 60s | 120s |

### 8.2 Scalability Targets

| Metric | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|
| Active nodes | 5 | 25 | 100 | 500 |
| Concurrent users | 50 | 200 | 1000 | 5000 |
| Agents on shared server | 5 | 20 | 50 | 100* |
| Daily federated queries | 100 | 1000 | 10000 | 50000 |

*Beyond 100 agents: horizontal scaling to multiple servers

### 8.3 Caching Strategy

```
Layer 1: Browser Cache
  • Static assets: 1 year (immutable, hashed)
  • Registry data: 5 minutes
  • Flow data: 1 hour

Layer 2: CDN (Vercel Edge)
  • Globe SSG: Until rebuild
  • Node cards: 5 minutes (ISR)
  • API routes: No cache (dynamic)

Layer 3: Server Cache (Redis)
  • Flow data: 1 hour
  • Bioregion lookups: 24 hours
  • Agent responses: None (real-time)

Layer 4: Database
  • Vector embeddings: Persistent
  • Agent memory: Persistent
  • Sessions: 30 days TTL
```

---

## 9. Integration Patterns

### 9.1 GitHub Integration

```typescript
// GitHub App for enhanced rate limits and webhooks
const githubApp = new GitHubApp({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY,
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET
  }
});

// Webhook handlers
githubApp.webhooks.on('push', async ({ payload }) => {
  // Trigger vault re-indexing
  if (payload.repository.full_name.includes('opencivics-commons')) {
    await reindexVault(payload.repository.full_name);
  }
});

githubApp.webhooks.on('pull_request.merged', async ({ payload }) => {
  // Update flow data cache
  await updateFlowData(payload.repository.full_name);
});
```

### 9.2 Telegram Bot Integration

```typescript
// Telegram Bot setup for node agent
const TelegramBot = require('node-telegram-bot-api');

class TelegramChannel {
  private bot: TelegramBot;
  private agent: Agent;

  constructor(token: string, agent: Agent) {
    this.bot = new TelegramBot(token, { polling: true });
    this.agent = agent;
    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.on('message', async (msg) => {
      const response = await this.agent.process({
        content: msg.text,
        channel: 'telegram',
        userId: msg.from.id.toString()
      });

      await this.bot.sendMessage(msg.chat.id, response.content, {
        parse_mode: 'Markdown'
      });
    });
  }
}
```

### 9.3 Quartz Integration

```typescript
// Quartz site deployment configuration
interface QuartzConfig {
  theme: {
    colors: {
      primary: string;      // From realm color
      secondary: string;
    };
  };
  plugins: {
    agentChat: {
      enabled: true;
      endpoint: string;     // Agent WebSocket URL
    };
    federation: {
      showSources: true;
    };
  };
  layout: {
    sidebar: 'left';
    toc: 'right';
  };
}
```

---

## 10. Technology Stack Details

### 10.1 Frontend Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "three": "0.160.x",
    "@react-three/fiber": "8.x",
    "@react-three/drei": "9.x",
    "maplibre-gl": "4.x",
    "@tanstack/react-query": "5.x",
    "zustand": "4.x",
    "socket.io-client": "4.x"
  },
  "devDependencies": {
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "@types/three": "latest",
    "vitest": "1.x",
    "playwright": "1.x"
  }
}
```

### 10.2 Backend Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "latest",
    "pg": "8.x",
    "pgvector": "0.x",
    "redis": "4.x",
    "@octokit/app": "14.x",
    "socket.io": "4.x",
    "express": "4.x",
    "node-telegram-bot-api": "0.x",
    "yaml": "2.x",
    "ajv": "8.x"
  }
}
```

### 10.3 CLI Dependencies

```json
{
  "name": "@opencivics/commons",
  "bin": {
    "commons": "./bin/commons.js"
  },
  "dependencies": {
    "commander": "11.x",
    "inquirer": "9.x",
    "ora": "7.x",
    "chalk": "5.x",
    "@octokit/rest": "20.x",
    "yaml": "2.x",
    "handlebars": "4.x"
  }
}
```

### 10.4 Infrastructure as Code

```yaml
# docker-compose.yml for local development
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: opencivics
      POSTGRES_USER: opencivics
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  agent-runtime:
    build: ./agent-runtime
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgres://opencivics:${DB_PASSWORD}@postgres:5432/opencivics
      REDIS_URL: redis://redis:6379
    ports:
      - "3001:3001"

  web:
    build: ./web
    depends_on:
      - agent-runtime
    environment:
      NEXT_PUBLIC_AGENT_URL: http://localhost:3001
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

---

## Cross-Reference Index

| Architecture Component | PRD Section | Implementation Phase |
|------------------------|-------------|---------------------|
| Globe Renderer | §4 Module 1 | Phase 1 |
| Bioregion Layer | §4.2 | Phase 1 |
| Flow Arcs | §4.5 | Phase 1 |
| Node Cards | §5 Module 2 | Phase 1-2 |
| Agent Chat Embed | §5.2 | Phase 2 |
| Creation Engine | §6 Module 3 | Phase 2 |
| Configuration Agent | §6.3 | Phase 2 |
| CLI Tools | §6.6 | Phase 3 |
| Agent Runtime | §7 Module 4 | Phase 2 |
| RAG Pipeline | §7.1 | Phase 2 |
| BYOK Management | §7.3 | Phase 2 |
| Federation Protocol | §8 Module 5 | Phase 3 |
| Query Routing | §8.2 | Phase 3 |
| Schema Bridges | §9 Module 6 | Phase 3 |
| Bridge Translation | §9.1-9.2 | Phase 3 |
| Index Registry | §10 Module 7 | Phase 1 |
| CI Validation | §10.3 | Phase 1 |

---

*— End of Technical Architecture Document —*
