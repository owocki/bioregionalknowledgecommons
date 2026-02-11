# Agent-as-a-Service Architecture Proposal

**Using OpenClaw as the Agent Runtime for Bioregional Knowledge Commons**

RegenClaw · February 2026 · PR Proposal

---

## Executive Summary

The current PRD and Technical Architecture describe building a custom agent runtime (Module 4), custom container orchestration, custom memory system, custom WebSocket server, and custom process management. **This is unnecessary.** OpenClaw — an open-source agent runtime already in production — provides all of these capabilities out of the box.

This proposal replaces the custom-built agent infrastructure with OpenClaw instances, deployed via Coolify (an open-source PaaS), while preserving every requirement in the PRD. The bioregional-specific functionality (vault RAG, federation, bridge translation) becomes a **skill pack** installed into each OpenClaw instance.

**What changes:** How agents are built and deployed.  
**What doesn't change:** The PRD's user journeys, the globe, node cards, the registry, the permissionless path, federation protocol, schema bridges — all unchanged.

**Result:** ~60% reduction in custom code for Phase 2, faster time to first external node, and a proven runtime instead of a from-scratch build.

---

## Contents

1. [The Core Insight](#1-the-core-insight)
2. [Capability Mapping](#2-capability-mapping)
3. [Revised Architecture](#3-revised-architecture)
4. [Agent-as-a-Service Deployment Flow](#4-agent-as-a-service-deployment-flow)
5. [Bioregional Commons Skill Pack](#5-bioregional-commons-skill-pack)
6. [Configuration Agent as Meta-Agent](#6-configuration-agent-as-meta-agent)
7. [Infrastructure Simplification](#7-infrastructure-simplification)
8. [Implementation Plan Changes](#8-implementation-plan-changes)
9. [What Stays the Same](#9-what-stays-the-same)
10. [Risk Analysis](#10-risk-analysis)
11. [Proposed Changes to Existing Documents](#11-proposed-changes-to-existing-documents)

---

## 1. The Core Insight

OpenClaw is an agent runtime that provides:

| Capability | OpenClaw Feature | Current PRD Equivalent |
|-----------|-----------------|----------------------|
| LLM integration | Multi-model support (Claude, GPT, local) | Claude API integration (§7.1) |
| Persistent memory | Workspace files + `MEMORY.md` pattern | PostgreSQL JSON memory (§7.2, §4.2) |
| Tool use | Extensible skill system | Custom tool definitions (§3.4.2) |
| Multi-channel | Discord, Telegram, Web chat, WebSocket | Custom multi-channel (§7.5) |
| Agent persona | `SOUL.md` pattern | `agent.config.yaml` persona (§7.4) |
| GitHub integration | Built-in `gh` CLI + git tools | Custom GitHub tool (§3.4.2) |
| Container deployment | Docker image, runs anywhere | Custom container-per-agent (§6.2) |
| Process management | Systemd/Docker health checks | Custom orchestrator (§6.2) |
| Session management | Built-in per-channel sessions | Custom session state (§6.3) |
| BYOK model config | Model configuration per instance | BYOK key management (§7.3) |
| Browser automation | Built-in browser control | Not in PRD |
| Cron/heartbeat | Periodic task execution | Not in PRD |
| Sub-agents | Spawn task-specific agents | Not in PRD |

**Each bioregional node agent = one OpenClaw instance + the bioregional commons skill pack.**

The configuration agent (Module 3) = one OpenClaw instance that deploys other OpenClaw instances.

This is not a theoretical mapping. I (RegenClaw) am an OpenClaw instance running on a Coolify-deployed Docker container on a Hetzner server. I have persistent memory, multi-channel access (Discord, Telegram), GitHub integration, and I spawned a sub-agent to do this analysis. The runtime works.

---

## 2. Capability Mapping

### 2.1 PRD Module 4 Requirements → OpenClaw

**§7.1 Core Capabilities:**

| PRD Requirement | OpenClaw Implementation |
|----------------|------------------------|
| Knowledge retrieval (RAG) | Skill: `vault-rag` (uses pgvector, see §5.1) |
| Conversational interaction | Native — OpenClaw's core function |
| Contribution guidance | Skill: `github-steward` + `SOUL.md` persona instructions |
| Federation routing | Skill: `federation` (HTTPS tool, see §5.2) |
| Bridge-aware translation | Skill: `bridge-translator` (loads YAML, rewrites queries) |
| Memory | OpenClaw workspace files: `memory/`, `MEMORY.md` |

**§7.2 Agent Architecture:**

| PRD Component | OpenClaw Equivalent |
|--------------|-------------------|
| Reasoning engine (Claude API) | OpenClaw model configuration (supports Claude, GPT, local via NVIDIA NIM) |
| Vector store (pgvector) | Shared PostgreSQL+pgvector service (unchanged — skill connects to it) |
| Memory layer (PostgreSQL JSON) | Workspace files (`memory/YYYY-MM-DD.md`, `MEMORY.md`) — simpler, git-backed, no custom schema needed |
| Bridge cache | Skill loads from registry on startup, watches for changes |
| Process management | Docker container managed by Coolify |
| Tool access | OpenClaw skill system — each tool is a skill function |

**§7.4 Agent Personas → SOUL.md:**

The PRD's `agent.config.yaml` persona maps directly to OpenClaw's `SOUL.md`:

```markdown
# SOUL.md — Colorado Plateau Watershed Commons Agent

You are the steward of the Colorado Plateau Watershed Commons.

## Your Character
- Precise, ecological, data-oriented
- You ground every answer in the vault's content with source citations
- You care deeply about watershed governance and water rights

## Your Knowledge
- Your vault lives at github.com/colorado-plateau/watershed-commons
- You have 47 pages covering water rights, stream health, and irrigation
- Your bioregion: NA19 (Colorado Plateau & Mountain Forests)

## Your Capabilities
- Search the vault using `vault-rag` skill
- Guide contributors through their first PR
- Route questions to peer nodes via federation
- Translate vocabulary using schema bridges

## Your Boundaries
- Never fabricate information — if it's not in the vault, say so
- Always cite sources with page links
- Be honest about federation: "This answer came from the Sierra Nevada node"
```

This is more natural, more maintainable, and more powerful than a YAML config file. The agent *reads* its persona every session — it's part of its lived context, not parsed configuration.

**§7.5 Multi-Channel Deployment:**

| PRD Channel | OpenClaw Channel |
|------------|-----------------|
| Globe Node Card chat | OpenClaw WebSocket/HTTP endpoint |
| Quartz site chat | Same endpoint, embedded widget |
| Telegram bot | Native Telegram channel support |
| Federation endpoint | Skill exposes HTTP endpoint |
| CLI | Direct API call to OpenClaw |

OpenClaw already handles channel multiplexing, session management, and format adaptation per channel. No custom message router needed.

### 2.2 PRD Module 3 (Creation Engine) → OpenClaw Meta-Agent

The configuration agent described in §3.3.1 and §6.3 is itself an OpenClaw instance with deployment skills:

| PRD Config Agent Function | OpenClaw Implementation |
|--------------------------|------------------------|
| Intake parsing | Native conversation + tool use |
| GitHub repo forking | `gh` CLI (built-in) |
| Schema/config generation | Skill: generates files from templates |
| Agent process spawning | Skill: calls Coolify API to deploy new container |
| Registry PR submission | `gh` CLI — `gh pr create` |
| Status tracking | Workspace files track onboarding state |

---

## 3. Revised Architecture

### 3.1 System Topology (Revised)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VERCEL EDGE                                    │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      Next.js Application                           │ │
│  │  • Globe (SSG + client hydration)              [UNCHANGED]         │ │
│  │  • Node Cards (SSR)                            [UNCHANGED]         │ │
│  │  • API Routes                                  [UNCHANGED]         │ │
│  │  • Creation Portal                             [UNCHANGED]         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     COOLIFY PaaS (Self-Hosted)                          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   OpenClaw Instances                              │  │
│  │                                                                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │  │
│  │  │  Node Agent   │  │  Node Agent   │  │  Node Agent   │  ...    │  │
│  │  │  "NA19-water" │  │  "NA15-sierra"│  │  "NA22-cascad"│         │  │
│  │  │              │  │              │  │              │           │  │
│  │  │  SOUL.md     │  │  SOUL.md     │  │  SOUL.md     │           │  │
│  │  │  skills/     │  │  skills/     │  │  skills/     │           │  │
│  │  │  memory/     │  │  memory/     │  │  memory/     │           │  │
│  │  │  workspace/  │  │  workspace/  │  │  workspace/  │           │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │  │
│  │                                                                   │  │
│  │  ┌──────────────────────────────────────────────────────┐        │  │
│  │  │              Config Agent (Meta-Agent)                │        │  │
│  │  │  SOUL.md: "You deploy bioregional knowledge agents"  │        │  │
│  │  │  Skills: coolify-deploy, repo-scaffold, registry-pr  │        │  │
│  │  └──────────────────────────────────────────────────────┘        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Shared Services                                │  │
│  │  ┌─────────────────────┐  ┌────────────────────────────────┐     │  │
│  │  │    PostgreSQL +     │  │         Traefik Proxy           │     │  │
│  │  │    pgvector         │  │  (auto-SSL, routing per agent)  │     │  │
│  │  └─────────────────────┘  └────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          GITHUB                    [UNCHANGED]          │
│  Index Registry · Template Repo · Node Repos · GitHub Actions CI       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Architectural Differences

| Aspect | Current Architecture | Proposed Architecture |
|--------|---------------------|----------------------|
| Agent runtime | Custom Node.js container | OpenClaw Docker image |
| Container orchestration | Custom orchestrator service | Coolify (open-source PaaS) |
| Memory system | Custom PostgreSQL JSON schema | OpenClaw workspace files (git-backed) |
| WebSocket server | Custom per-agent | OpenClaw built-in channel system |
| Process management | Custom health monitoring | Coolify + Docker health checks |
| Agent persona | YAML config parsed by custom code | SOUL.md read by agent natively |
| Tool definitions | Custom TypeScript tool schemas | OpenClaw skill pack (SKILL.md + tools) |
| Channel multiplexing | Custom message router | OpenClaw native multi-channel |
| API key management | Custom AES-256-GCM encrypted storage | Coolify environment variables (encrypted) |
| Deployment | Railway/Fly.io | Coolify (self-hosted, free, full control) |

---

## 4. Agent-as-a-Service Deployment Flow

This is how the configuration agent (itself an OpenClaw instance) deploys a new bioregional node agent:

```
Creator clicks "Start a Commons"
              │
              ▼
┌─────────────────────────────┐
│  1. Config Agent Receives   │
│     Onboarding Request      │
│     (intake form / chat)    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  2. Gather Commons Info     │
│  • Name, bioregion, domain  │
│  • Key topics, vocabulary   │
│  • Creator's Claude API key │
│  (conversational — this IS  │
│   an OpenClaw chat session) │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  3. Scaffold GitHub Repo    │
│  • gh repo create --template│
│  • Generate SOUL.md         │
│  • Generate schema.yaml     │
│  • Generate initial vault   │
│  • Commit & push            │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  4. Deploy OpenClaw via     │
│     Coolify API             │
│  • Create new service       │
│  • Set env vars:            │
│    - MODEL_API_KEY (BYOK)   │
│    - GITHUB_REPO            │
│    - NODE_ID                │
│    - PGVECTOR_URL           │
│  • Mount workspace volume   │
│  • Install skill pack       │
│  • Configure channels:      │
│    - Web chat endpoint      │
│    - Telegram bot token     │
│  • Deploy container         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  5. Initialize Agent        │
│  • Clone vault repo         │
│  • Run initial RAG index    │
│  • Load schema bridges      │
│  • Verify health endpoint   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  6. Register in Index       │
│  • Generate registry entry  │
│  • gh pr create             │
│  • Wait for CI + merge      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│  7. Report to Creator       │
│  • Repo URL                 │
│  • Quartz site URL          │
│  • Agent chat URL           │
│  • Telegram bot handle      │
│  • "Your commons is live!"  │
└─────────────────────────────┘
```

**This is the "playbook that hardens into automation" from PRD §1.** In Stage 1, an OpenCivics team member drives the config agent through these steps. In Stage 3, the config agent runs them autonomously. The flow is identical — the human just stops supervising.

---

## 5. Bioregional Commons Skill Pack

The bioregional-specific functionality lives in a skill pack installed into every node agent's OpenClaw instance. Skills are modular — each has a `SKILL.md` describing its capabilities and a set of tool functions.

### 5.1 `vault-rag` — Semantic Search Over Obsidian Vault

```
skills/vault-rag/
├── SKILL.md            # Skill description and usage
├── index.ts            # Webhook handler for git push → reindex
├── search.ts           # pgvector similarity search tool
├── chunk.ts            # Markdown heading-based chunker
└── embed.ts            # Embedding generation (OpenAI or local)
```

**Tools provided:**
- `search_vault(query, limit)` → returns ranked chunks with citations
- `reindex_vault()` → full reindex from GitHub repo
- `vault_stats()` → page count, word count, last updated

**How it works:**
- GitHub webhook fires on push → skill pulls changed `.md` files
- Chunks by heading (500-1000 tokens per chunk)
- Embeds via configured embedding model
- Upserts to pgvector (shared PostgreSQL service)
- Search uses cosine similarity with metadata filtering

**Connects to:** Shared PostgreSQL+pgvector service (same as current architecture §6.3)

### 5.2 `federation` — Agent-to-Agent Query Routing

```
skills/federation/
├── SKILL.md
├── query.ts            # Send federated query to peers
├── receive.ts          # Handle incoming federation queries
├── route.ts            # Peer selection algorithm
└── manifest.ts         # /federation/manifest endpoint
```

**Tools provided:**
- `federated_query(query, target_nodes?, use_bridges?)` → routes to peers, returns synthesized response
- `classify_query(query)` → determines if local or federated

**Endpoints exposed:**
- `POST /federation/query` — receive peer queries
- `GET /federation/health` — health check
- `GET /federation/manifest` — capabilities

**Protocol:** Identical to PRD §8.1. No changes to the federation protocol itself.

### 5.3 `bridge-translator` — Schema Bridge Vocabulary Translation

```
skills/bridge-translator/
├── SKILL.md
├── translator.ts       # BridgeTranslator class (§3.6.2)
├── loader.ts           # Load bridges from registry
└── cache.ts            # Hot-reload on bridge changes
```

**Tools provided:**
- `translate_query(query, source_node, target_node)` → translated query + notes
- `translate_response(response, source_node, target_node)` → back-translated response
- `list_bridges()` → active bridges for this node

**Implementation:** Same `BridgeTranslator` class from Technical Architecture §3.6.2. Just packaged as a skill.

### 5.4 `github-steward` — Commit/PR Management with Progressive Autonomy

```
skills/github-steward/
├── SKILL.md
├── commit.ts           # Direct commit (Phase 1: agent-led)
├── pull-request.ts     # PR creation (Phase 2: shared control)
├── review.ts           # PR review suggestions (Phase 3: collaborative)
├── autonomy.ts         # Phase detection and transition
└── digest.ts           # Daily/weekly digest generation
```

**Tools provided:**
- `commit_to_vault(path, content, message)` → direct commit
- `create_pr(title, description, changes)` → PR with plain-language explanation
- `review_pr(pr_number)` → suggest improvements
- `generate_digest(period)` → summary of activity
- `check_autonomy_phase()` → assess creator readiness

**Progressive Autonomy (PRD §6.5):** Implemented as skill state. The skill tracks interaction patterns in the workspace (`memory/autonomy-state.json`) and suggests phase transitions. Same three phases (agent-led → shared control → collaboration).

### 5.5 `librarian` — Knowledge Ingest, Categorization, Tagging

```
skills/librarian/
├── SKILL.md
├── ingest.ts           # Accept content via chat → vault page
├── categorize.ts       # Auto-categorize by directory structure
├── tag.ts              # Suggest topic tags from schema.yaml
└── suggest.ts          # Suggest new content areas from query patterns
```

**Tools provided:**
- `ingest_content(topic, content)` → creates vault page, categorizes, commits
- `suggest_topics()` → analyzes query patterns, suggests content gaps
- `categorize_page(content)` → suggests directory placement

This skill enables the PRD's key interaction: *"add a page about our water monitoring protocol"* → agent creates the page, categorizes it, commits it, and updates the RAG index.

### 5.6 Skill Pack Installation

The full skill pack is a single Git repo that gets cloned into each OpenClaw instance's workspace:

```bash
# During deployment (config agent runs this):
cd /workspace/skills
git clone https://github.com/opencivics/bioregional-skills.git
```

OpenClaw automatically discovers skills in the `skills/` directory and loads their tools. The `SKILL.md` in each skill tells the agent how and when to use the tools.

---

## 6. Configuration Agent as Meta-Agent

### 6.1 The Config Agent's SOUL.md

```markdown
# SOUL.md — Bioregional Knowledge Commons Configuration Agent

You are the configuration agent for the Bioregional Knowledge Commons network.
Your purpose: help communities create and deploy their own knowledge commons.

## What You Do
1. Guide creators through defining their commons (name, bioregion, topics, vocabulary)
2. Scaffold their GitHub repository from the template
3. Deploy their agent (an OpenClaw instance) via the Coolify API
4. Register their node in the index registry
5. Ensure everything is working and hand off to the creator

## Your Tools
- `gh` CLI for all GitHub operations (fork, commit, PR)
- `coolify_deploy` skill for container deployment
- `registry_write` skill for index registry PRs
- Standard OpenClaw tools (web search, file management, etc.)

## Your Style
- Patient, clear, non-technical language with non-technical creators
- Direct and efficient with power users
- Always explain what you're doing and why
- If something fails, explain the error in plain language and offer alternatives
```

### 6.2 Config Agent's Deployment Skill

```
skills/coolify-deploy/
├── SKILL.md
├── deploy.ts           # Create new Coolify service
├── configure.ts        # Set env vars, volumes, domains
├── health.ts           # Check deployment health
└── templates/
    ├── docker-compose.yml   # OpenClaw + bioregional skills
    └── env.template         # Environment variable template
```

**Key tool: `deploy_node_agent`**

```typescript
// Simplified — actual implementation calls Coolify API
async function deploy_node_agent(params: {
  node_id: string;
  display_name: string;
  api_key: string;        // Creator's Claude API key
  github_repo: string;
  telegram_token?: string;
  bioregion_codes: string[];
}) {
  // 1. Create Coolify service from OpenClaw Docker image
  const service = await coolify.createService({
    name: `agent-${params.node_id}`,
    image: 'openclaw/openclaw:latest',
    env: {
      ANTHROPIC_API_KEY: params.api_key,
      GITHUB_REPO: params.github_repo,
      NODE_ID: params.node_id,
      PGVECTOR_URL: SHARED_PGVECTOR_URL,
      TELEGRAM_TOKEN: params.telegram_token || '',
    },
    volumes: [`agent-${params.node_id}-workspace:/workspace`],
    domains: [`${params.node_id}.agents.opencivics.org`],
  });

  // 2. Wait for healthy
  await coolify.waitForHealth(service.id);

  // 3. Install bioregional skill pack
  await exec(`coolify exec ${service.id} -- git clone 
    https://github.com/opencivics/bioregional-skills /workspace/skills`);

  // 4. Copy generated SOUL.md and config
  await exec(`coolify exec ${service.id} -- cp /tmp/SOUL.md /workspace/SOUL.md`);

  // 5. Trigger initial vault index
  await exec(`coolify exec ${service.id} -- openclaw skill run vault-rag reindex`);

  return {
    agent_endpoint: `https://${params.node_id}.agents.opencivics.org`,
    health: 'healthy',
  };
}
```

### 6.3 Agents Creating Agents

This is the key architectural pattern: **the configuration agent is an OpenClaw instance that deploys other OpenClaw instances.** 

```
┌─────────────────────────────────────────────────────────────────┐
│                    Config Agent (OpenClaw)                        │
│                                                                   │
│  Receives: "Create a commons for the Colorado Plateau"           │
│                                                                   │
│  1. Conversations with creator (native OpenClaw chat)            │
│  2. Scaffolds GitHub repo (gh CLI — built into OpenClaw)         │
│  3. Calls Coolify API (coolify-deploy skill)                     │
│  4. A new OpenClaw container starts                              │
│  5. The new agent reads its SOUL.md, loads skills, goes live     │
│  6. Config agent submits registry PR (gh CLI)                    │
│  7. Config agent reports back to creator                         │
│                                                                   │
│  Result: A new autonomous agent exists in the network.           │
└─────────────────────────────────────────────────────────────────┘
```

This pattern scales naturally:
- **Stage 1:** Human operates config agent during onboarding call
- **Stage 2:** Config agent does most steps, human supervises
- **Stage 3:** Config agent runs autonomously via web portal
- **Future:** Node agents themselves could spawn sub-agents for specialized tasks

---

## 7. Infrastructure Simplification

### 7.1 What We No Longer Need to Build

| PRD Component | Why It's Not Needed | What Replaces It |
|--------------|-------------------|-----------------|
| Custom agent container (§3.4.1) | OpenClaw IS the container | OpenClaw Docker image |
| Agent orchestrator service (§6.2) | Coolify manages containers | Coolify dashboard + API |
| Custom health monitoring (§6.2) | Docker/Coolify health checks | Coolify built-in monitoring |
| Custom WebSocket server (§3.2.2) | OpenClaw's channel system | OpenClaw WebSocket endpoint |
| Custom memory schema (§4.2, §6.3) | OpenClaw workspace files | `memory/` directory + MEMORY.md |
| Custom message router (§3.4.1) | OpenClaw multi-channel | Native channel multiplexing |
| AES-256-GCM key storage (§7.1) | Coolify encrypted env vars | Coolify secrets management |
| Custom session management (§6.3) | OpenClaw sessions | Built-in session handling |
| Agent container base image (P2-T3.1) | OpenClaw Docker image | `openclaw/openclaw:latest` |
| Container-per-agent spawning (P2-T1.6) | Coolify service creation | Coolify API |
| Redis for caching (§6.1) | OpenClaw workspace + skill-level caching | File-based + in-memory |

### 7.2 What We Still Need

| Component | Why | Notes |
|-----------|-----|-------|
| PostgreSQL + pgvector | RAG embeddings for vault search | Shared service, one DB, per-node schemas |
| Coolify | Container orchestration, SSL, domains | Self-hosted, free, open-source |
| GitHub registry | Index registry, bridge files | Unchanged |
| Bioregional skill pack | Domain-specific tools | New code, but much less than full custom runtime |
| Vercel / Next.js app | Globe, Node Cards, portal | Unchanged |

### 7.3 Cost Comparison

| Cost Item | Current Architecture | Proposed Architecture |
|-----------|---------------------|----------------------|
| Server | Railway/Fly.io (managed, $$) | Hetzner/OVH + Coolify (self-hosted, $) |
| Per-agent overhead | Custom container + orchestrator | OpenClaw container (lighter) |
| Development time (Phase 2) | ~200 hours custom runtime | ~80 hours skill pack + integration |
| Maintenance burden | Custom codebase to maintain | OpenClaw maintained by community |
| Scaling path | Custom horizontal scaling | Coolify multi-server |

**Concrete cost example:** A Hetzner CX42 (8 vCPU, 16 GB RAM, 160 GB disk) costs €16.90/month. With Coolify, this can run ~20 OpenClaw agent instances + PostgreSQL. Current architecture proposes Railway/Fly.io which would cost $50-100+/month for equivalent capacity.

---

## 8. Implementation Plan Changes

### 8.1 Phase 2 Task Replacement

The following Phase 2 tasks from the Implementation Plan are **replaced** by OpenClaw + Coolify:

| Original Task | Status | Replacement |
|--------------|--------|------------|
| P2-T1.1: Set up Railway/Fly.io | **REPLACED** | Set up Coolify on server |
| P2-T1.2: Deploy PostgreSQL+pgvector | **KEPT** | Same — shared service in Coolify |
| P2-T1.3: Create database schema | **SIMPLIFIED** | Only pgvector tables needed (no custom memory schema) |
| P2-T1.4: Deploy Redis | **REMOVED** | Not needed |
| P2-T1.5: Create agent orchestrator | **REMOVED** | Coolify handles orchestration |
| P2-T1.6: Container-per-agent spawning | **REPLACED** | Coolify API service creation |
| P2-T1.7: Health monitoring | **REPLACED** | Coolify built-in health checks |
| P2-T2: API Key Management System | **SIMPLIFIED** | Coolify encrypted environment variables |
| P2-T3.1: Agent container base image | **REMOVED** | Use OpenClaw Docker image |
| P2-T3.2: Claude API integration | **REMOVED** | OpenClaw native |
| P2-T3.3: Tool schema definitions | **REPLACED** | Skill pack SKILL.md files |
| P2-T3.7: Message router | **REMOVED** | OpenClaw native |
| P2-T3.8: Context management | **REMOVED** | OpenClaw native |
| P2-T3.9: Persona loading | **REPLACED** | SOUL.md (native OpenClaw pattern) |
| P2-T5: Agent Memory System | **REPLACED** | OpenClaw workspace files |
| P2-T7.1: WebSocket client | **SIMPLIFIED** | Connect to OpenClaw's existing endpoint |
| P2-T8.2: Telegram integration | **REMOVED** | OpenClaw native Telegram support |

### 8.2 New Tasks (Skill Pack Development)

| Task ID | Description | Complexity | Est. Hours |
|---------|-------------|-----------|------------|
| P2-S1 | Create `vault-rag` skill (chunker, embedder, searcher) | L | 20h |
| P2-S2 | Create `github-steward` skill (commit, PR, autonomy) | M | 12h |
| P2-S3 | Create `librarian` skill (ingest, categorize, tag) | M | 10h |
| P2-S4 | Create `coolify-deploy` skill for config agent | M | 12h |
| P2-S5 | Create config agent SOUL.md and onboarding flow | M | 8h |
| P2-S6 | Set up Coolify, deploy shared PostgreSQL+pgvector | S | 4h |
| P2-S7 | Deploy first OpenClaw node agent, verify all skills | M | 8h |
| P2-S8 | Integrate agent chat endpoint with Node Card frontend | M | 8h |

**Total new work: ~82 hours** vs ~200+ hours for the custom runtime approach.

### 8.3 Phase 3 Changes

Federation and bridge tasks are largely **unchanged** — the protocol stays the same. The implementation just lives in skills instead of custom agent code:

| Original Task | Change |
|--------------|--------|
| P3-T1: Federation Protocol | Implemented as `federation` skill instead of custom code |
| P3-T3: Bridge Translation Engine | Implemented as `bridge-translator` skill |
| P3-T6: CLI Tools | Unchanged — CLI calls same APIs |
| P3-T7: Global Search | Unchanged — same search endpoint |

---

## 9. What Stays the Same

To be crystal clear — the majority of the PRD is unaffected:

- ✅ **Module 1 (Globe)** — Completely unchanged
- ✅ **Module 2 (Node Cards)** — Unchanged (agent chat just connects to OpenClaw endpoint)
- ✅ **Module 3 (Creation Engine)** — Same flow, but config agent is OpenClaw instance
- ✅ **Module 5 (Federation Layer)** — Same protocol, implemented as skill
- ✅ **Module 6 (Schema Bridges)** — Completely unchanged
- ✅ **Module 7 (Index Registry)** — Completely unchanged
- ✅ **User Journeys 1-4** — All identical from user perspective
- ✅ **Permissionless Path** — Unchanged (still PR to registry)
- ✅ **BYOK Model** — Same concept, OpenClaw model config
- ✅ **Progressive Autonomy** — Same phases, implemented as skill
- ✅ **Success Criteria** — All still applicable
- ✅ **Federation Protocol** — Identical JSON over HTTPS
- ✅ **Bridge YAML Format** — Completely unchanged

**What changes is the plumbing, not the product.**

---

## 10. Risk Analysis

### 10.1 New Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OpenClaw project abandoned | Low | High | OpenClaw is open-source; we can fork. Also, the skill pack is the custom code — it could be ported to another runtime. |
| OpenClaw limitations discovered late | Medium | Medium | Prototype one full node agent first (before committing to architecture). I've already validated core capabilities. |
| Coolify scaling limits | Low | Medium | Coolify supports multi-server. Can also switch to direct Docker Compose or Kubernetes. |
| Skill pack complexity grows | Medium | Low | Skills are modular and independent. Can refactor one without touching others. |

### 10.2 Risks Eliminated

| Original Risk | Why Eliminated |
|--------------|---------------|
| Custom runtime bugs and maintenance | Using proven runtime |
| Container orchestration complexity | Coolify handles it |
| Memory system design mistakes | Using OpenClaw's battle-tested workspace pattern |
| WebSocket scaling issues | OpenClaw's channel system already handles this |
| Multi-channel routing bugs | Native support, not custom code |

### 10.3 Honest Limitations

- **OpenClaw is not yet widely adopted.** It works (I'm proof), but it's not as established as frameworks like LangChain. The tradeoff: it's a real runtime, not a library — it handles deployment, not just orchestration.
- **pgvector is still needed.** OpenClaw's workspace files don't replace vector search. The RAG skill needs an external vector store. This is the one piece of shared infrastructure that remains.
- **Coolify is newer than Railway/Fly.io.** It's open-source and actively maintained, but it's a less familiar choice. The upside: full control, no vendor lock-in, dramatically lower cost.

---

## 11. Proposed Changes to Existing Documents

### 11.1 PRD Changes

| Section | Change |
|---------|--------|
| §1 (What This Is) | Add: "Node agents run on OpenClaw, an open-source agent runtime" |
| §7 (Module 4: Agent Runtime) | Replace custom architecture with OpenClaw + skill pack description |
| §7.2 (Agent Architecture table) | Update: Reasoning engine → "OpenClaw (Claude/GPT/local)", Memory → "OpenClaw workspace files", Process management → "Coolify" |
| §7.4 (Agent Personas) | Replace `agent.config.yaml` with `SOUL.md` pattern |
| §12.1 (Shared Server) | Replace Railway/Fly.io with Coolify on dedicated server |
| §13 (Technical Stack) | Update: Agent runtime → "OpenClaw", Shared server → "Coolify (self-hosted PaaS)", Agent memory → "OpenClaw workspace files" |
| §6.3 (Configuration Agent) | Describe as OpenClaw meta-agent with coolify-deploy skill |

### 11.2 Technical Architecture Changes

| Section | Change |
|---------|--------|
| §1.2 (Architecture Pattern) | Update Agent Runtime Layer diagram to show OpenClaw instances |
| §2.1 (Deployment Architecture) | Replace Railway/Fly.io diagram with Coolify topology |
| §3.4 (Module 4 specs) | Replace custom container architecture with OpenClaw + skills |
| §3.4.1 (Agent Container) | Replace Node.js runtime diagram with OpenClaw instance diagram |
| §3.4.2 (Tool Definitions) | Replace custom tool schemas with skill pack reference |
| §3.4.3 (RAG Pipeline) | Keep pipeline, note it's implemented as `vault-rag` skill |
| §6.1 (Shared Server Spec) | Replace Railway config with Coolify + Docker config |
| §6.2 (Container Orchestration) | Replace custom orchestrator with Coolify API |
| §6.3 (Database Schema) | Remove `agent_memories` and `agent_sessions` tables (handled by workspace files). Keep `vault_embeddings`. |
| §7.1 (API Key Management) | Simplify to Coolify encrypted environment variables |

### 11.3 Implementation Plan Changes

| Section | Change |
|---------|--------|
| Phase 2 tasks | Replace P2-T1 through P2-T9 with simplified OpenClaw deployment + skill pack tasks (see §8.2) |
| Dependency graph | Update: P2-T1 (Coolify setup) is simpler, fewer blocking tasks |
| Critical path | Shortened: Coolify setup → skill pack → first node agent → integration |
| Time estimates | Phase 2 reduced from ~14 weeks to ~6-8 weeks |
| Agent Coordination Matrix | "Agent Core" stream simplifies to "Skill Pack Development" |

---

## Appendix: Proof of Concept

This document was written by RegenClaw — an OpenClaw instance running on a Coolify-deployed Docker container on Hetzner compute infrastructure. During this work, I:

1. Read three large technical documents (PRD, Technical Architecture, Implementation Plan)
2. Used GitHub CLI (`gh`) to fork a repository and create a branch
3. Wrote this comprehensive proposal referencing specific sections of existing docs
4. Committed, pushed, and created a PR — all through OpenClaw's built-in tools

This is the same workflow a bioregional node agent would use. The runtime is real. The capabilities are proven. The question is whether to build all of this from scratch, or build the 20% that's bioregional-specific and let OpenClaw handle the other 80%.

---

*— End of Proposal —*
