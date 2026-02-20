# Bioregional Knowledge Commons

An interactive globe/map visualization for exploring bioregions, watersheds, indigenous territories, and knowledge commons nodes. Live at [knowledgecommons.earth](https://knowledgecommons.earth).

## Repository Structure

```
web/             Next.js frontend (globe, map, list views)
skills/          Agent skills (bridge-translator, federation, librarian, vault-rag, github-steward)
agent-runtime/   OpenClaw agent configuration
infra/           Docker Compose + Coolify deployment configs
docs/            Onboarding documentation
registry/        Federation bridge registry
```

## Prerequisites

- **Node.js** >= 20
- **npm** (comes with Node)
- **Docker** + **Docker Compose** (only needed for the full agent stack)

## Quick Start (Web Frontend Only)

```bash
# Clone the repo
git clone https://github.com/OpenCivics/bioregionalknowledgecommons.git
cd bioregionalknowledgecommons

# Install dependencies
cd web
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The page hot-reloads as you edit files in `web/src/`.

## Available Scripts (web/)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build static export to `web/out/` |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Full Stack (Web + Agent + Database)

To run the complete stack with the OpenClaw agent and PostgreSQL/pgvector:

```bash
# Copy the env file and add your keys
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY (required)

# Start all services
docker-compose -f infra/docker-compose.dev.yml up
```

This starts:

| Service | URL | Description |
|---------|-----|-------------|
| Web | [localhost:3000](http://localhost:3000) | Next.js frontend |
| Agent | [localhost:3001](http://localhost:3001) | OpenClaw agent (HTTP/WebSocket) |
| PostgreSQL | localhost:5432 | pgvector database |
| Adminer | [localhost:8080](http://localhost:8080) | Database admin UI |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API key for the agent | Yes (full stack only) |
| `GITHUB_REPO` | Vault repository URL | Optional |
| `GITHUB_PAGES` | Set to `true` for GitHub Pages basePath | CI only |

## Tech Stack

- **Framework:** Next.js 16 (static export)
- **3D Globe:** React Three Fiber + Three.js
- **2D Map:** MapLibre GL
- **Styling:** Tailwind CSS 4
- **State:** Zustand
- **Data Fetching:** TanStack React Query
- **Animation:** Framer Motion
- **Geo:** Turf.js, Natural Earth data, GRDC watersheds, Native Land Digital API

## Deployment

Production deploys automatically to GitHub Pages on push to `main` via the workflow in `.github/workflows/deploy.yml`. The site is served at [knowledgecommons.earth](https://knowledgecommons.earth) via a custom CNAME.

For self-hosted infrastructure (agents + database), see [`infra/README.md`](infra/README.md).
