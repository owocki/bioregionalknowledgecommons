# Knowledge Commons Onboarding Session Template

**Duration:** 60-90 minutes
**Participants:** Community lead(s) + OpenCivics facilitator
**Mode:** Video call (Zoom/Meet/Jitsi)

---

## Pre-Session Checklist

Before the call, the facilitator should:

- [ ] Review intake form submission
- [ ] Check if bioregion has existing nodes (potential federation partners)
- [ ] Prepare example queries for their thematic domain
- [ ] Create draft vault structure based on their knowledge description
- [ ] Have GitHub OAuth ready in browser

---

## Session Agenda

### 1. Welcome & Context (10 min)

**Goal:** Establish rapport and clarify expectations

- Introduce yourself and OpenCivics
- Ask: "What drew you to the Knowledge Commons?"
- Briefly explain the network (show globe with existing nodes)
- Set expectations for today's session

**Facilitator Notes:**
```
Key points to cover:
- Decentralized network of knowledge stewards
- Your node = your community's knowledge, your governance
- Agent = AI assistant grounded in YOUR documents
- Federation = optional sharing with other bioregions
```

### 2. Knowledge Audit (15 min)

**Goal:** Understand what knowledge exists and in what form

Walk through their existing resources:

| Question | Notes |
|----------|-------|
| What's your most valuable document/resource? | |
| How is knowledge currently organized? | |
| Who are the main contributors? | |
| What's the governance for decisions? | |
| What's currently inaccessible that should be shared? | |

**Document Types Checklist:**
- [ ] Research/Reports
- [ ] Maps/GIS data
- [ ] Meeting minutes/Governance docs
- [ ] Restoration protocols
- [ ] Traditional/Indigenous knowledge (sensitivity!)
- [ ] Media (photos, videos, audio)
- [ ] Community agreements

### 3. Vault Structure Design (15 min)

**Goal:** Co-create initial folder structure

Based on their knowledge, propose structure:

```
vault/
├── governance/
│   ├── decision-protocols.md
│   ├── stakeholder-map.md
│   └── community-agreements/
├── ecology/
│   ├── species-inventory.md
│   ├── watershed-map.md
│   └── restoration-projects/
├── practice/
│   ├── monitoring-protocols.md
│   └── traditional-practices/
└── community/
    ├── partners.md
    ├── events/
    └── stories/
```

**Ask:**
- "Does this structure make sense for your community?"
- "What categories are missing?"
- "Which folder would have the most content immediately?"

### 4. Agent Persona Definition (10 min)

**Goal:** Define how the AI agent should behave

Fill out together:

```yaml
persona:
  name: [Community-chosen name, e.g., "Rio Guide"]
  voice: [Helpful, formal, casual, elder, scientific]
  priorities:
    - [e.g., "Always cite sources"]
    - [e.g., "Defer to Indigenous knowledge keepers"]
    - [e.g., "Encourage community participation"]
  boundaries:
    - [e.g., "Never share unpublished research"]
    - [e.g., "Redirect legal questions to counsel"]
```

**Common Persona Patterns:**
- **Librarian:** Neutral, citation-heavy, encyclopedic
- **Guide:** Welcoming, contextual, narrative-driven
- **Elder:** Respectful, traditional, cautionary
- **Scientist:** Precise, data-driven, methodology-focused

### 5. Technical Setup (20 min)

**Goal:** Configure GitHub, start vault, deploy agent

#### 5a. GitHub Setup

If they have GitHub:
- [ ] Fork template repository
- [ ] Add them as collaborators

If they need GitHub:
- [ ] Create account (screen share if needed)
- [ ] Walk through GitHub basics
- [ ] Fork template repository

#### 5b. API Key Provisioning

- [ ] Open Anthropic Console (https://console.anthropic.com)
- [ ] Create new API key for their organization
- [ ] Set monthly spend limit (suggest: $20-50 for small orgs)
- [ ] Copy key securely (they should store in password manager)

#### 5c. Initial Deployment

- [ ] Run Config Agent to provision node
- [ ] Verify health endpoint returns 200
- [ ] Test first query ("What is in this knowledge base?")

### 6. First Content Upload (10 min)

**Goal:** Get real content into the vault

- Have them share 1-2 foundational documents
- Upload to appropriate vault folder
- Wait for reindexing
- Test query about uploaded content
- Celebrate first successful response!

### 7. Next Steps & Handoff (10 min)

**Goal:** Set them up for independence

**Immediate Actions (This Week):**
- [ ] Upload 5-10 more documents to vault
- [ ] Invite 1-2 other team members to GitHub
- [ ] Share embed link with test users
- [ ] Note questions/issues for follow-up

**First Month Goals:**
- [ ] Complete initial vault structure (50+ documents)
- [ ] Define at least one schema bridge opportunity
- [ ] Submit node to public registry (once ready)
- [ ] Schedule 30-min check-in call

**Resources to Share:**
- Link to docs site
- Link to Discord/Slack community
- Direct email for support

---

## Post-Session Checklist

After the call, the facilitator should:

- [ ] Send summary email with action items
- [ ] Add node to internal onboarding tracker
- [ ] Log any friction points encountered
- [ ] Schedule follow-up (2 weeks)
- [ ] Update registry if node is public

---

## Friction Point Log

Record any issues for future automation:

| Step | Friction Point | Severity | Potential Automation |
|------|----------------|----------|---------------------|
| | | | |

Severity: Low / Medium / High / Blocker

---

## Sample Email Templates

### Welcome Email (Pre-Call)

```
Subject: Getting Ready for Your Knowledge Commons Onboarding

Hi [Name],

Looking forward to our onboarding session on [Date/Time]!

To prepare:
1. Think about which documents you'd like to upload first
2. Consider what you'd want to name your AI agent
3. If you have a GitHub account, have those credentials ready

Here's the call link: [Link]

See you soon,
[Facilitator]
```

### Summary Email (Post-Call)

```
Subject: Welcome to the Bioregional Knowledge Commons! 🌍

Hi [Name],

Great session today! Here's a summary of what we accomplished:

✅ Created your vault at: [GitHub URL]
✅ Deployed your agent at: [Agent URL]
✅ Uploaded initial documents: [List]

Your next steps:
1. [ ] Upload 5-10 more documents this week
2. [ ] Invite [Person] to the GitHub repo
3. [ ] Share the embed link with test users

Resources:
- Vault editing guide: [Link]
- Agent customization docs: [Link]
- Community Discord: [Link]

I'll check in next [Day] to see how things are going!

Best,
[Facilitator]
```

---

*Template Version: 1.0 | Last Updated: 2026-02*
