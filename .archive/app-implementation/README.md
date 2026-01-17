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
   - food-agent.ts (383 lines)
   - accommodation-agent.ts (enhanced with quote generation)
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
GitHub issues #92 (Backend AI Agents) and #93 (Frontend UI Panels) targeted /app directory instead of project-pipeline.
Parallel supervision system (SCAR) executed without questioning which codebase should receive the new features.

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
