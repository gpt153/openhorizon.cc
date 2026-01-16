# Agent Porting Plan: /app → project-pipeline

**Date**: 2026-01-14
**Goal**: Consolidate all AI agent functionality into project-pipeline (app.openhorizon.cc)
**Estimated Effort**: 6-8 hours

---

## Executive Summary

**Current State**:
- ✅ project-pipeline deployed to app.openhorizon.cc (working Seeds→Project)
- ❌ AI agents (Travel, Food, Accommodation) built in /app directory (wrong codebase)
- ❌ Dual architecture causing confusion

**Target State**:
- ✅ All agents in project-pipeline
- ✅ Single unified system on app.openhorizon.cc
- ✅ /app directory archived (legacy)

---

## Architecture Comparison

### Project-Pipeline (TARGET)
**Backend**: Fastify + TypeScript
- Location: `project-pipeline/backend/src/`
- Routes: REST API (`/api/...`)
- Database: Prisma (same schema as /app)
- AI: Anthropic Claude via `@anthropic-ai/sdk`

**Frontend**: React 18 + Vite + React Router
- Location: `project-pipeline/frontend/src/`
- State: React Query (Tanstack Query)
- API: Axios HTTP client
- UI: Custom Tailwind components

**Existing Agents**:
- ✅ AccommodationAgent (328 lines) - HAS SCRAPING
- ✅ EmailAgent (406 lines)
- ✅ FormNarrativeAgent (143 lines)
- ✅ BaseAgent (72 lines)

### /app (SOURCE)
**Backend**: Next.js App Router + tRPC
- Location: `app/src/`
- Routes: tRPC procedures
- Database: Prisma (same schema)
- AI: OpenAI via `openai` library

**Frontend**: React Server Components + Client Components
- State: tRPC hooks
- API: tRPC client
- UI: shadcn/ui components

**Agents to Port**:
- 📦 TravelAgent (493 lines) - NEW
- 📦 FoodAgent (380 lines) - NEW
- 📦 AccommodationAgent (520 lines) - ENHANCED VERSION

**UI Panels to Port**:
- 📦 TravelSearchPanel.tsx (17KB)
- 📦 FoodSearchPanel.tsx (15KB)
- 📦 AccommodationSearchPanel.tsx (15KB)

---

## Porting Strategy

### Phase 1: Backend Agents (3-4 hours)

#### Step 1.1: Port TravelAgent (1 hour)
**Source**: `app/src/lib/ai/agents/travel-agent.ts`
**Target**: `project-pipeline/backend/src/ai/agents/travel-agent.ts`

**Changes Needed**:
1. Update imports:
   ```typescript
   // FROM:
   import { BaseAgent, AgentContext } from './base-agent'

   // TO:
   import { BaseAgent, AgentContext } from './base-agent.js'
   ```

2. Switch from OpenAI to Anthropic:
   ```typescript
   // FROM:
   constructor() {
     super('gpt-4-turbo-preview')
   }

   // TO:
   constructor() {
     super('claude-3-5-sonnet-20241022')
   }
   ```

3. Keep all logic: search(), analyzeFlights(), analyzeAgencies(), generateQuoteEmail()

4. Test with existing BaseAgent in project-pipeline

**Files to Create**:
- `project-pipeline/backend/src/ai/agents/travel-agent.ts`

**Validation**:
```bash
cd project-pipeline/backend
npm run build
# Should compile without errors
```

---

#### Step 1.2: Port FoodAgent (1 hour)
**Source**: `app/src/lib/ai/agents/food-agent.ts`
**Target**: `project-pipeline/backend/src/ai/agents/food-agent.ts`

**Changes Needed**:
1. Update imports (add .js extensions)
2. Switch to Anthropic model
3. Keep all logic: research(), analyzeFoodOption(), generateQuoteEmail()

**Files to Create**:
- `project-pipeline/backend/src/ai/agents/food-agent.ts`

---

#### Step 1.3: Merge AccommodationAgent (1 hour)
**Challenge**: Both codebases have accommodation agents with different features

**Decision**: MERGE the best of both
- Keep SCRAPING from project-pipeline version (lines 50-72)
- Add QUOTE GENERATION from /app version
- Add PROS/CONS ANALYSIS from /app version

**Source Files**:
- `project-pipeline/backend/src/ai/agents/accommodation-agent.ts` (base)
- `app/src/lib/ai/agents/accommodation-agent.ts` (enhancements)

**Target**: Enhanced `project-pipeline/backend/src/ai/agents/accommodation-agent.ts`

**Changes**:
1. Add `generateQuoteEmail()` method from /app version
2. Add more detailed AI analysis (pros/cons)
3. Keep existing scraping functionality
4. Ensure both scraped + AI-generated options work

---

#### Step 1.4: Create API Endpoints (1 hour)
**File**: `project-pipeline/backend/src/phases/index.ts`

**Add Routes**:

```typescript
// POST /api/phases/:phaseId/search-travel
fastify.post('/phases/:phaseId/search-travel', async (request, reply) => {
  const { phaseId } = request.params
  const { origin, destination, date, passengers } = request.body

  // Load phase and project context
  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    include: { project: true }
  })

  const travelAgent = new TravelAgent()
  const results = await travelAgent.search(
    { origin, destination, date: new Date(date), passengers },
    { phase, project: phase.project, userId: request.user.id }
  )

  return { success: true, data: results }
})

// POST /api/phases/:phaseId/search-food
fastify.post('/phases/:phaseId/search-food', async (request, reply) => {
  const { phaseId } = request.params

  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    include: { project: true }
  })

  const foodAgent = new FoodAgent()
  const results = await foodAgent.research({
    phase,
    project: phase.project,
    userId: request.user.id
  })

  return { success: true, data: results }
})

// POST /api/phases/:phaseId/search-accommodation
fastify.post('/phases/:phaseId/search-accommodation', async (request, reply) => {
  const { phaseId } = request.params

  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    include: { project: true }
  })

  const accommodationAgent = new AccommodationAgent()
  const results = await accommodationAgent.research({
    phase,
    project: phase.project,
    userId: request.user.id
  })

  return { success: true, data: results }
})

// POST /api/phases/:phaseId/generate-quotes
fastify.post('/phases/:phaseId/generate-quotes', async (request, reply) => {
  const { phaseId } = request.params
  const { type, selectedItems } = request.body // type: 'travel' | 'food' | 'accommodation'

  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    include: { project: true }
  })

  let agent
  switch (type) {
    case 'travel':
      agent = new TravelAgent()
      break
    case 'food':
      agent = new FoodAgent()
      break
    case 'accommodation':
      agent = new AccommodationAgent()
      break
    default:
      return reply.status(400).send({ error: 'Invalid agent type' })
  }

  const emails = await Promise.all(
    selectedItems.map(item => agent.generateQuoteEmail(item, {
      phase,
      project: phase.project,
      userId: request.user.id
    }))
  )

  return { success: true, data: emails }
})
```

**Validation**:
```bash
curl -X POST http://localhost:4000/api/phases/{phaseId}/search-travel \
  -H "Content-Type: application/json" \
  -d '{"origin": "Stockholm", "destination": "Barcelona", "date": "2026-06-01", "passengers": 30}'
```

---

### Phase 2: Frontend UI Panels (3-4 hours)

#### Step 2.1: Port TravelSearchPanel (1.5 hours)
**Source**: `app/src/components/pipeline/TravelSearchPanel.tsx` (17KB)
**Target**: `project-pipeline/frontend/src/components/TravelSearchPanel.tsx`

**Changes Needed**:

1. **Replace shadcn/ui with project-pipeline UI components**:
   ```typescript
   // FROM:
   import { Card, CardContent } from '@/components/ui/card'
   import { Button } from '@/components/ui/button'
   import { Badge } from '@/components/ui/badge'

   // TO:
   // Use project-pipeline's Tailwind classes directly
   // OR create minimal UI components if needed
   ```

2. **Replace tRPC with Axios API calls**:
   ```typescript
   // FROM:
   const searchMutation = trpc.phases.searchTravel.useMutation()

   // TO:
   import api from '../services/api'
   const handleSearch = async () => {
     const { data } = await api.post(`/phases/${phaseId}/search-travel`, {
       origin, destination, date, passengers
     })
     setSearchResults(data.data)
   }
   ```

3. **Update state management**:
   ```typescript
   // Replace tRPC hooks with React Query
   import { useMutation } from '@tanstack/react-query'

   const searchMutation = useMutation({
     mutationFn: async (params) => {
       const { data } = await api.post(`/phases/${phaseId}/search-travel`, params)
       return data.data
     },
     onSuccess: (data) => {
       setSearchResults(data)
     }
   })
   ```

4. **Simplify UI components**:
   - Replace Dialog with basic modal (or port Dialog component)
   - Replace Skeleton with simple loading div
   - Keep all functionality, simplify styling

**Files to Create**:
- `project-pipeline/frontend/src/components/TravelSearchPanel.tsx`

**Optional Files** (if needed):
- `project-pipeline/frontend/src/components/ui/Dialog.tsx` (minimal modal)
- `project-pipeline/frontend/src/components/ui/Badge.tsx` (minimal badge)

---

#### Step 2.2: Port FoodSearchPanel (1.5 hours)
**Source**: `app/src/components/pipeline/FoodSearchPanel.tsx` (15KB)
**Target**: `project-pipeline/frontend/src/components/FoodSearchPanel.tsx`

**Same Changes as Step 2.1**:
1. Replace shadcn/ui components
2. Replace tRPC with Axios
3. Use React Query for mutations
4. Simplify UI

**Files to Create**:
- `project-pipeline/frontend/src/components/FoodSearchPanel.tsx`

---

#### Step 2.3: Port AccommodationSearchPanel (1.5 hours)
**Source**: `app/src/components/pipeline/AccommodationSearchPanel.tsx` (15KB)
**Target**: `project-pipeline/frontend/src/components/AccommodationSearchPanel.tsx`

**Same Changes**:
1. Replace shadcn/ui
2. Replace tRPC with Axios
3. Use React Query
4. Simplify UI

**Files to Create**:
- `project-pipeline/frontend/src/components/AccommodationSearchPanel.tsx`

---

#### Step 2.4: Integrate into PhaseDetail Page (0.5 hours)
**File**: `project-pipeline/frontend/src/pages/PhaseDetail.tsx`

**Changes**:

```typescript
import TravelSearchPanel from '../components/TravelSearchPanel'
import FoodSearchPanel from '../components/FoodSearchPanel'
import AccommodationSearchPanel from '../components/AccommodationSearchPanel'

// Inside PhaseDetail component, add after agent chat section:

{/* AI-Powered Search Panels */}
{phase.type === 'TRAVEL' && (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-4">Travel Research</h3>
    <TravelSearchPanel
      phaseId={phase.id}
      defaultOrigin={phase.project.origin_country || 'Sweden'}
      defaultDestination={phase.project.host_country || phase.project.location}
      defaultPassengers={phase.project.participants_count}
    />
  </div>
)}

{phase.type === 'FOOD' && (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-4">Food & Catering Research</h3>
    <FoodSearchPanel phaseId={phase.id} />
  </div>
)}

{phase.type === 'ACCOMMODATION' && (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-4">Accommodation Research</h3>
    <AccommodationSearchPanel phaseId={phase.id} />
  </div>
)}
```

**Notes**:
- PhaseDetail page already has agent chat (PhaseAgentChat component)
- Add search panels BELOW the chat for structured research
- Conditional rendering based on phase.type

---

### Phase 3: Testing & Deployment (1 hour)

#### Step 3.1: Local Testing (30 min)
```bash
# Terminal 1 - Backend
cd project-pipeline/backend
npm run dev

# Terminal 2 - Frontend
cd project-pipeline/frontend
npm run dev

# Open: http://localhost:5173
# Create TRAVEL phase → Search for flights → Generate quotes
# Create FOOD phase → Search for caterers → Generate quotes
# Create ACCOMMODATION phase → Search hotels → Generate quotes
```

**Test Checklist**:
- [ ] Travel search returns 5-7 flights + agencies
- [ ] Food search returns 5-7 caterers/restaurants
- [ ] Accommodation search returns 5-7 hotels (with scraping!)
- [ ] AI analysis shows pros/cons for each option
- [ ] Selection checkboxes work
- [ ] Quote generation creates email previews
- [ ] Emails have proper subject/body

---

#### Step 3.2: Deploy to Production (30 min)
```bash
# Deploy backend
gcloud builds submit \
  --config=cloudbuild-pipeline.yaml \
  --substitutions=_SERVICE_NAME=openhorizon-pipeline

# Deploy frontend
gcloud builds submit \
  --config=cloudbuild-pipeline-frontend.yaml \
  --substitutions=_SERVICE_NAME=openhorizon-pipeline-frontend

# Verify
curl https://app.openhorizon.cc
# Should show updated UI with agent panels
```

**Validation**:
- [ ] app.openhorizon.cc loads correctly
- [ ] Login works
- [ ] Create project from seed
- [ ] Create TRAVEL/FOOD/ACCOMMODATION phases
- [ ] Test all 3 agent panels in production
- [ ] Generate quotes and verify SendGrid integration

---

## Files to Archive

After successful porting, archive these /app files:

### /app/src/components/pipeline/ (Agent UI)
```
app/src/components/pipeline/TravelSearchPanel.tsx → ARCHIVED
app/src/components/pipeline/FoodSearchPanel.tsx → ARCHIVED
app/src/components/pipeline/AccommodationSearchPanel.tsx → ARCHIVED
```

### /app/src/lib/ai/agents/ (Agent Logic)
```
app/src/lib/ai/agents/travel-agent.ts → ARCHIVED
app/src/lib/ai/agents/food-agent.ts → ARCHIVED
app/src/lib/ai/agents/accommodation-agent.ts → ARCHIVED (merged with project-pipeline version)
app/src/lib/ai/agents/activities-agent.ts → KEEP (not ported yet)
app/src/lib/ai/agents/emergency-agent.ts → KEEP (not ported yet)
```

### Documentation Files (Root)
```
TRAVEL_AGENT_IMPLEMENTATION.md → DELETE (outdated)
BUDGET_CALCULATOR_IMPLEMENTATION.md → DELETE (outdated)
IMPLEMENTATION_SUMMARY.md → UPDATE (remove /app references)
START-HERE.md → DELETE (confusing)
CLEANUP-SUMMARY.md → DELETE (outdated)
```

**Keep these docs**:
- ✅ README.md (update to reference project-pipeline only)
- ✅ CLAUDE.md (update to reference project-pipeline)
- ✅ DEPLOY_INSTRUCTIONS.md (keep both deployments documented)
- ✅ QUICKSTART.md (update paths)

---

## Risk Mitigation

### Risk 1: UI Component Differences
**Problem**: shadcn/ui → plain Tailwind conversion might break layouts
**Mitigation**:
- Port Dialog, Badge, Button components as minimal versions
- Test thoroughly before deploying
- Keep original functionality, simplify styling

### Risk 2: API Endpoint Compatibility
**Problem**: tRPC → REST API might have different error handling
**Mitigation**:
- Use same Prisma queries as /app
- Copy error handling patterns from existing project-pipeline endpoints
- Test error cases (phase not found, invalid input, etc.)

### Risk 3: AccommodationAgent Merge Conflicts
**Problem**: Two different implementations of same agent
**Mitigation**:
- Use project-pipeline version as base (has scraping)
- Cherry-pick enhancements from /app version
- Test both scraped + AI-generated modes
- Keep fallback to AI-only if scraping fails

### Risk 4: Environment Variables
**Problem**: /app uses different env var names than project-pipeline
**Mitigation**:
- Review env-pipeline.yaml vs app .env.local
- Ensure ANTHROPIC_API_KEY, OPENAI_API_KEY both set
- Document any new env vars needed

---

## Success Criteria

**Definition of Done**:
- [ ] All 3 agents (Travel, Food, Accommodation) working in project-pipeline
- [ ] UI panels accessible from PhaseDetail page
- [ ] Search functionality returns AI-analyzed results
- [ ] Quote generation creates email drafts
- [ ] SendGrid integration sends emails
- [ ] Deployed to app.openhorizon.cc
- [ ] /app agent code archived
- [ ] Documentation updated

**User Journey Validated**:
```
1. Login to app.openhorizon.cc
2. Generate seed → Save to garden
3. Convert seed to project
4. View project → Gantt chart shows phases
5. Click TRAVEL phase → See TravelSearchPanel
6. Search flights → See 5-7 options with AI pros/cons
7. Select 2 options → Generate quotes
8. Review email previews → Send via SendGrid
9. Repeat for FOOD and ACCOMMODATION phases
10. View all communications tracked in database
```

---

## Execution Options

### Option A: Manual Implementation (6-8 hours)
- Implement each step sequentially
- Test after each phase
- Full control over quality

### Option B: SCAR Parallel Execution (3-4 hours)
- Create 3 GitHub issues:
  - Issue 1: Port backend agents (Steps 1.1-1.4)
  - Issue 2: Port frontend panels (Steps 2.1-2.4)
  - Issue 3: Testing and deployment (Step 3)
- Run SCAR agents in parallel for Issues 1-2
- Sequential for Issue 3 (depends on 1-2)
- Faster but requires supervision

### Option C: Hybrid Approach (5-6 hours)
- Manual backend porting (higher risk, need precision)
- SCAR for frontend porting (more straightforward)
- Manual testing and deployment

**Recommendation**: Option A (Manual)
- Higher complexity warrants hands-on control
- Testing is critical
- 6-8 hours is acceptable for this consolidation

---

## Next Steps

After user approval of this plan:

1. **Confirm approach**: Manual vs SCAR vs Hybrid?
2. **Set timeline**: All at once? Spread over 2-3 days?
3. **Begin execution**: Start with Phase 1 (backend agents)
4. **Progress tracking**: Use TodoWrite for each step
5. **Validation**: Test locally before deploying
6. **Deploy**: Push to app.openhorizon.cc
7. **Archive**: Move /app files to .archive/app-implementation/
8. **Update docs**: Single source of truth (project-pipeline)

---

**Plan Status**: Ready for Execution ✅
**Estimated Completion**: 6-8 hours (1-2 days of focused work)
**Next Action**: User approval + execution start
