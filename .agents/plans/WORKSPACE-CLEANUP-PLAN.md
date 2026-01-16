# Workspace Cleanup & Archival Plan

**Date**: 2026-01-14
**Goal**: Archive all /app implementation artifacts, clean documentation, establish project-pipeline as single source of truth

---

## Current State Analysis

### Active Systems
1. **project-pipeline/** - ✅ PRODUCTION (app.openhorizon.cc)
   - Deployed and working
   - Has Seeds→Project conversion
   - Needs agent UI panels added

2. **landing/** - ✅ PRODUCTION (openhorizon.cc)
   - Marketing landing page
   - Keep as-is

### Legacy Systems to Archive
1. **/app/** - ⚠️ DEVELOPMENT ARTIFACTS
   - Was experimental Next.js implementation
   - Has agent UI panels (to be ported)
   - Has OLD project system (deprecated)
   - Should be archived after porting

---

## Archival Strategy

### Phase 1: Create Archive Directory Structure

```bash
mkdir -p .archive/app-implementation/{components,agents,docs}
```

**Structure**:
```
.archive/
└── app-implementation/
    ├── README.md                    # Why this was archived
    ├── PORTING-COMPLETE.md          # What was ported, what was left
    ├── components/
    │   ├── TravelSearchPanel.tsx
    │   ├── FoodSearchPanel.tsx
    │   └── AccommodationSearchPanel.tsx
    ├── agents/
    │   ├── travel-agent.ts
    │   ├── food-agent.ts
    │   └── accommodation-agent.ts
    └── docs/
        ├── TRAVEL_AGENT_IMPLEMENTATION.md
        ├── BUDGET_CALCULATOR_IMPLEMENTATION.md
        └── IMPLEMENTATION_SUMMARY.md
```

---

### Phase 2: Archive /app Directory Components

**After successful porting**, move these files to archive:

#### Agent UI Components
```bash
# After verifying project-pipeline has working panels
mv app/src/components/pipeline/TravelSearchPanel.tsx \
   .archive/app-implementation/components/

mv app/src/components/pipeline/FoodSearchPanel.tsx \
   .archive/app-implementation/components/

mv app/src/components/pipeline/AccommodationSearchPanel.tsx \
   .archive/app-implementation/components/
```

#### Agent Logic
```bash
mv app/src/lib/ai/agents/travel-agent.ts \
   .archive/app-implementation/agents/

mv app/src/lib/ai/agents/food-agent.ts \
   .archive/app-implementation/agents/

mv app/src/lib/ai/agents/accommodation-agent.ts \
   .archive/app-implementation/agents/
```

**Keep** (not yet ported):
- app/src/lib/ai/agents/activities-agent.ts
- app/src/lib/ai/agents/emergency-agent.ts
- app/src/lib/ai/agents/base-agent.ts
- app/src/lib/ai/agents/registry.ts

---

### Phase 3: Archive Obsolete Documentation

#### Delete Outdated Implementation Docs
```bash
rm TRAVEL_AGENT_IMPLEMENTATION.md        # Obsolete - agents now in project-pipeline
rm BUDGET_CALCULATOR_IMPLEMENTATION.md   # Obsolete - budget tracking in project-pipeline
rm IMPLEMENTATION_SUMMARY.md             # Obsolete - referred to /app
rm START-HERE.md                         # Confusing - outdated navigation
rm CLEANUP-SUMMARY.md                    # Obsolete - old cleanup from Dec 2024
```

**Archive First** (move to .archive/app-implementation/docs/):
```bash
mv TRAVEL_AGENT_IMPLEMENTATION.md .archive/app-implementation/docs/
mv BUDGET_CALCULATOR_IMPLEMENTATION.md .archive/app-implementation/docs/
mv IMPLEMENTATION_SUMMARY.md .archive/app-implementation/docs/
```

---

### Phase 4: Update Remaining Documentation

#### README.md
**Current Issues**:
- References both /app and /landing and project-pipeline
- Confusing structure
- Monorepo language when really it's landing + project-pipeline

**Updated Version**:
```markdown
# Open Horizon

Empowering Youth & Organisations Through Erasmus+

Swedish nonprofit association creating meaningful international opportunities for young people and organisations through Erasmus+ projects.

## 🌍 What We Do

[Keep existing content]

## 🛠️ Tech Stack

- **Landing Page**: Next.js 15 (static marketing site)
- **Application**: Fastify + React/Vite (project management platform)
- **AI**: Anthropic Claude + OpenAI
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Google Cloud Run

## 📦 Project Structure

```
openhorizon.cc/
├── landing/                  # Marketing landing page → openhorizon.cc
│   ├── src/app/             # Landing page routes
│   ├── Dockerfile           # Landing container
│   └── package.json         # Landing dependencies
├── project-pipeline/         # Main application → app.openhorizon.cc
│   ├── backend/             # Fastify API server
│   ├── frontend/            # React/Vite SPA
│   └── README.md            # Full setup guide
└── .archive/                # Historical implementations
    └── app-implementation/  # Next.js prototype (Jan 2026)
```

### Domain Structure

- **openhorizon.cc** → Marketing landing page
- **app.openhorizon.cc** → Project management platform

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL (or Supabase account)

### Quick Start

```bash
# Install dependencies
npm install

# Run landing page (development)
cd landing && npm run dev
# Open http://localhost:3000

# Run application (development)
cd project-pipeline/backend && npm run dev    # Port 4000
cd project-pipeline/frontend && npm run dev   # Port 5173
# Open http://localhost:5173
```

For detailed setup instructions, see `project-pipeline/README.md`

## 🐳 Docker Deployment

See `project-pipeline/DEPLOYMENT-GUIDE.md` for complete deployment instructions.

## ☁️ Cloud Run Deployment

**Automatic Deployment** via Cloud Build triggers:
- Push to `main` → Deploys landing + application

See `DEPLOY_INSTRUCTIONS.md` for manual deployment commands.

[Rest of existing content]
```

---

#### CLAUDE.md
**Changes**:
```markdown
# openhorizon.cc

**Repository:** https://github.com/gpt153/openhorizon.cc.git
**Production URL:** https://app.openhorizon.cc
**Workspace:** /home/samuel/.archon/workspaces/openhorizon.cc

## Project Overview

openhorizon.cc - Erasmus+ Youth Mobility Platform

**Architecture**:
- `landing/` - Marketing landing page (Next.js static)
- `project-pipeline/` - Main application (Fastify + React/Vite)

**Primary Development**: `project-pipeline/` directory

---

## 🎯 YOUR ROLE (SCAR Bot - Implementation Worker)

[Keep existing SCAR role description]

**Working Directory**: Always work in `project-pipeline/` unless explicitly modifying landing page

---

## Development Workflow

[Keep existing workflow content]

**Important**: All new features should be implemented in `project-pipeline/` directory.

The `/app` directory contains archived prototypes and should not be used for new development.

## Project-Specific Notes

**Active Codebase**: project-pipeline/
- Backend: project-pipeline/backend/ (Fastify + TypeScript)
- Frontend: project-pipeline/frontend/ (React + Vite)
- Deployed to: app.openhorizon.cc

**Landing Page**: landing/
- Next.js static site
- Deployed to: openhorizon.cc

**Archived**: .archive/app-implementation/
- Next.js prototype from January 2026
- Contains agent implementations that were ported to project-pipeline
```

---

#### QUICKSTART.md
**Changes**:
```markdown
# OpenHorizon.cc - Quick Start Guide

[Update all paths to reference project-pipeline/ instead of app/]

## Development Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Setup database (see project-pipeline/README.md)
4. Run backend: `cd project-pipeline/backend && npm run dev`
5. Run frontend: `cd project-pipeline/frontend && npm run dev`
6. Open: http://localhost:5173

[Update rest of file with correct paths]
```

---

#### DEPLOY_INSTRUCTIONS.md
**Changes**:
- Update to show project-pipeline deployment only
- Remove /app references
- Keep landing deployment instructions

---

### Phase 5: Create Archive Documentation

**File**: `.archive/app-implementation/README.md`

```markdown
# /app Implementation Archive

**Archived Date**: 2026-01-14
**Reason**: Consolidated into project-pipeline

## What Was Here

This directory originally contained a Next.js 15 + tRPC implementation of the Erasmus+ platform, built in parallel with the project-pipeline implementation.

### Key Components Archived

1. **AI Agent UI Panels** (January 13, 2026)
   - TravelSearchPanel.tsx
   - FoodSearchPanel.tsx
   - AccommodationSearchPanel.tsx
   - **Status**: ✅ Ported to project-pipeline/frontend/src/components/

2. **AI Agent Backend Logic** (January 13, 2026)
   - travel-agent.ts (493 lines)
   - food-agent.ts (380 lines)
   - accommodation-agent.ts (520 lines)
   - **Status**: ✅ Ported to project-pipeline/backend/src/ai/agents/

3. **Implementation Documentation**
   - TRAVEL_AGENT_IMPLEMENTATION.md
   - BUDGET_CALCULATOR_IMPLEMENTATION.md
   - IMPLEMENTATION_SUMMARY.md
   - **Status**: Archived for reference

## Why Two Implementations Existed

**Timeline**:
- Jan 9-11, 2026: project-pipeline deployed to app.openhorizon.cc
- Jan 13, 2026: AI agents built in /app by mistake (wrong codebase)
- Jan 14, 2026: Agents ported to project-pipeline, /app archived

**Root Cause**:
GitHub issues #86, #87, #88 targeted /app directory instead of project-pipeline.
Supervision system executed without questioning which codebase should receive the new features.

## What Was NOT Ported

These components remain in /app and may be ported later if needed:
- OLD project system (/projects routes)
- Activities agent
- Emergency agent
- Budget tracking dashboard UI (exists in project-pipeline differently)

## Accessing This Archive

If you need to reference the original implementation:
```bash
cd .archive/app-implementation/
# Components in components/
# Agents in agents/
# Docs in docs/
```

## Active Codebase

All new development happens in:
- `project-pipeline/backend/` - Fastify API
- `project-pipeline/frontend/` - React/Vite SPA
- Deployed to: https://app.openhorizon.cc
```

---

**File**: `.archive/app-implementation/PORTING-COMPLETE.md`

```markdown
# Porting Completion Report

**Date**: 2026-01-14
**From**: /app directory (Next.js + tRPC)
**To**: project-pipeline (Fastify + React/Vite)

## Successfully Ported

### Backend Agents
- ✅ TravelAgent (493 lines) → project-pipeline/backend/src/ai/agents/travel-agent.ts
- ✅ FoodAgent (380 lines) → project-pipeline/backend/src/ai/agents/food-agent.ts
- ✅ AccommodationAgent (520 lines) → Merged with existing project-pipeline version

**Changes Made**:
- OpenAI → Anthropic Claude
- ES6 imports → CommonJS (.js extensions)
- tRPC context → Fastify request context

### Frontend UI Panels
- ✅ TravelSearchPanel.tsx → project-pipeline/frontend/src/components/TravelSearchPanel.tsx
- ✅ FoodSearchPanel.tsx → project-pipeline/frontend/src/components/FoodSearchPanel.tsx
- ✅ AccommodationSearchPanel.tsx → project-pipeline/frontend/src/components/AccommodationSearchPanel.tsx

**Changes Made**:
- shadcn/ui → Plain Tailwind CSS
- tRPC hooks → Axios + React Query
- Next.js components → React components

### API Endpoints Created
- POST /api/phases/:phaseId/search-travel
- POST /api/phases/:phaseId/search-food
- POST /api/phases/:phaseId/search-accommodation
- POST /api/phases/:phaseId/generate-quotes

### Integration
- ✅ Panels integrated into PhaseDetail page
- ✅ Conditional rendering by phase type
- ✅ Quote generation working
- ✅ SendGrid email integration preserved

## Testing Completed

- [x] Local testing (all 3 agents)
- [x] Production deployment
- [x] End-to-end user journey validation
- [x] Email generation and sending

## Not Ported (Intentional)

### Components Left in /app
- OLD /projects system (deprecated, replaced by project-pipeline Seeds→Project)
- Activities agent (not yet needed)
- Emergency agent (not yet needed)
- Various budget UI components (project-pipeline has its own implementation)

### Reason
These components were either:
1. Deprecated (OLD projects system)
2. Not yet required for Feb 10 deadline
3. Already implemented differently in project-pipeline

## Deployment Status

- ✅ Backend deployed to openhorizon-pipeline
- ✅ Frontend deployed to openhorizon-pipeline-frontend
- ✅ Domain mapped to app.openhorizon.cc
- ✅ All environment variables configured
- ✅ Database migrations applied

## Validation

User journey tested:
1. Login to app.openhorizon.cc ✅
2. Generate seed → Save to garden ✅
3. Convert to project ✅
4. Create TRAVEL phase → Search flights ✅
5. Generate travel quotes ✅
6. Create FOOD phase → Search caterers ✅
7. Generate food quotes ✅
8. Create ACCOMMODATION phase → Search hotels ✅
9. Generate accommodation quotes ✅
10. Verify emails in SendGrid ✅

## Conclusion

Porting complete. All AI agent functionality now unified in project-pipeline and accessible on app.openhorizon.cc.

/app directory archived for reference but no longer in active use.
```

---

## Execution Checklist

### Pre-Archival (Do First)
- [ ] Complete agent porting (AGENT-PORTING-PLAN.md)
- [ ] Test all 3 agents in project-pipeline
- [ ] Deploy to app.openhorizon.cc
- [ ] Validate end-to-end user journey

### Archival (Do After Successful Porting)
- [ ] Create .archive/app-implementation/ directory structure
- [ ] Move agent UI components to archive
- [ ] Move agent logic files to archive
- [ ] Move implementation docs to archive
- [ ] Create archive README.md
- [ ] Create PORTING-COMPLETE.md

### Documentation Updates (Do After Archival)
- [ ] Update README.md (remove /app references)
- [ ] Update CLAUDE.md (mark project-pipeline as primary)
- [ ] Update QUICKSTART.md (correct paths)
- [ ] Update DEPLOY_INSTRUCTIONS.md (remove /app deployment)
- [ ] Delete obsolete root docs (after archiving them)

### Validation (Final Step)
- [ ] New developer can follow README.md successfully
- [ ] All doc links work (no broken references to /app)
- [ ] .archive/ has complete historical record
- [ ] No confusion about which codebase is active

---

## Timeline

**Day 1** (6-8 hours):
- Execute AGENT-PORTING-PLAN.md
- Test and deploy

**Day 2** (1-2 hours):
- Archive files
- Update documentation
- Final validation

**Total**: 7-10 hours spread over 1-2 days

---

## Success Criteria

**Definition of Done**:
- [ ] Single source of truth: project-pipeline
- [ ] No active code in /app (all archived)
- [ ] All documentation references project-pipeline
- [ ] Historical record preserved in .archive/
- [ ] New contributors not confused about which codebase to use

---

**Plan Status**: Ready for Execution ✅
**Dependencies**: Requires AGENT-PORTING-PLAN.md completion first
**Next Action**: User approval + execute porting, then archival
