# System Architecture Analysis: oh.153.se vs app.openhorizon.cc
**Date:** 2026-01-14 (Stockholm time)
**Purpose:** Research why Seeds system and Pipeline are disconnected

---

## Executive Summary

### The Problem
**oh.153.se** (dev server) currently has THREE separate systems running side-by-side:

1. **Seeds System** (`/seeds`, `/brainstorm`) - Project idea generation ✅ Working
2. **OLD Project Planner** (`/projects`) - Legacy application builder ⚠️ Deprecated
3. **NEW Pipeline System** (`/pipeline/projects`) - Modern logistics & AI agents ✅ Active Development

The Seeds system's "Turn into Project" button navigates to the OLD `/projects` system instead of the NEW `/pipeline/projects` system, creating confusion and fragmenting the user experience.

**app.openhorizon.cc** appears to be a separate deployment (possibly older or different branch) with a different architecture that has better Seeds integration.

### Root Cause
The repository contains TWO complete project management systems built at different times:

- **OLD: `Project` model** - Application-focused (objectives, learning outcomes, programme builder)
- **NEW: `PipelineProject` model** - Logistics-focused (budget tracking, vendor management, AI agents)

Both systems are fully functional but serve different purposes and have no integration between them.

---

## Detailed Findings

### 1. Database Schema Analysis

#### OLD System (Project Model)
**Location:** Lines 78-124 in `schema.prisma`

```prisma
model Project {
  id              String @id @default(uuid())
  title           String
  status          ProjectStatus @default(DRAFT)
  projectDna      Json // Project characteristics

  // Application-focused fields
  objectives              Json?
  targetGroupDescription  String?
  learningOutcomes        Json?
  inclusionPlanOverview   String?
  partnerProfile          String?

  // Formal mode variants (application-ready language)
  targetGroupDescriptionFormal  String?
  inclusionPlanOverviewFormal   String?

  erasmusAction    String
  durationDays     Int
  participantCount Int

  // Relations
  programmes Programme[]
}
```

**Features:**
- Erasmus+ application focus
- Formal/Informal mode switching
- Programme builder (daily schedules, sessions)
- Connected to Seeds generation
- Used by `/projects` routes

#### NEW System (PipelineProject Model)
**Location:** Lines 377-417 in `schema.prisma`

```prisma
model PipelineProject {
  id              String @id @default(uuid())
  name            String
  type            ProjectType
  status          PipelineProjectStatus @default(PLANNING)

  // Logistics-focused fields
  budgetTotal      Decimal
  budgetSpent      Decimal
  participantCount Int
  location         String
  startDate        DateTime
  endDate          DateTime

  // Erasmus+ specific
  erasmusGrantCalculated Decimal?
  profitMargin           Decimal?

  // Relations
  phases          PipelinePhase[]  // Travel, Accommodation, Food
  communications  Communication[]  // Email tracking
  expenses        Expense[]        // Budget tracking
  aiConversations AIConversation[] // AI agent chats
  vendors         Vendor[]         // Hotel/restaurant tracking
}
```

**Features:**
- Budget tracking & alerts
- Vendor management
- AI agents (Food, Accommodation, Travel)
- Quote generation & email tracking
- Phase-based workflow
- SendGrid integration
- Used by `/pipeline/projects` routes

### 2. Navigation Structure Comparison

#### oh.153.se (Current Dev Server)
```
Main Nav:
├── Dashboard       → /
├── Projects        → /projects (OLD system)
├── Brainstorm      → /brainstorm (Seeds generation)
├── Seed Garden     → /seeds (Saved seeds)
└── Settings        → /settings

Hidden from nav:
└── Pipeline        → /pipeline/projects (NEW system - accessed via root redirect)
```

#### app.openhorizon.cc (Production?)
```
Main Nav:
├── Dashboard       → /dashboard
├── Budget          → /budget
├── AI Chat         → /chat
└── Seeds           → /seeds
```

**Key Difference:** app.openhorizon.cc has a completely different navigation structure and appears to be a different deployment architecture.

### 3. Seeds System Integration

#### Current Flow (oh.153.se)
```
User Journey:
1. /brainstorm → Generate 10 seed ideas
2. Save interesting seeds to database
3. /seeds → View saved seeds (6 seeds found)
4. /seeds/{id} → Elaborate seed with AI chat
5. Click "Turn into Project" button
6. → Navigates to /projects/new (OLD wizard)
7. → Creates OLD Project model (not connected to Pipeline)
```

**Code Evidence:**
`app/src/app/(dashboard)/seeds/[id]/page.tsx:85-88`
```tsx
<Button onClick={() => router.push('/projects/new')} variant="default">
  <ArrowRight className="mr-2 h-5 w-5" />
  Turn into Project
</Button>
```

**Problem:** No data is passed from Seed to Project creation. It's just a navigation link.

### 4. Git History Analysis

**Key Commits:**
```
d2777c0 - feat: Port Seeds Brainstorming System to Pipeline (#55)
          Date: 2026-01-10
          Note: Added Seeds to "project-pipeline" directory (doesn't exist now)

393cea5 - feat: Implement Accommodation Agent Enhancement + UI Integration (Issue #87)
e0e4915 - feat: Implement Food Agent UI Integration (Issue #86)
2c9c0bd - feat: implement Food Research Agent with AI-powered analysis
1237ab2 - feat: Implement Budget Auto-Calculator with Erasmus+ 2024-2027 unit costs
```

**Observation:** Recent development (Jan 10-14) focused entirely on Pipeline features (AI agents, budget tracking). No work on integrating Seeds with Pipeline.

### 5. Why Two Systems Exist

**Hypothesis based on code analysis:**

1. **OLD System (`/projects`)** was built first for Erasmus+ application writing:
   - Focus: Generate application text (objectives, learning outcomes)
   - Output: Application-ready documents
   - Features: Programme builder, formal/informal mode
   - Status: Fully functional but no longer actively developed

2. **NEW System (`/pipeline/projects`)** was built for logistics management:
   - Focus: Budget, vendors, communications, logistics
   - Output: Vendor quotes, budget tracking, AI assistance
   - Features: AI agents, SendGrid integration, expense tracking
   - Status: Active development, Week 1 Sprint just completed

3. **Seeds System** was built as ideation tool:
   - Focus: Generate creative project ideas
   - Output: Refined project concepts
   - Integration: Connected to OLD system only

### 6. Missing Integration: Seed → Pipeline

**What should exist but doesn't:**
```typescript
// This function does NOT exist anywhere in the codebase:
async function createPipelineProjectFromSeed(seedId: string) {
  const seed = await prisma.seed.findUnique({ where: { id: seedId }})

  const pipelineProject = await prisma.pipelineProject.create({
    data: {
      name: seed.title,
      description: seed.description,
      // ... map seed fields to pipeline fields
      type: 'CUSTOM',
      status: 'PLANNING',
      // Generate default phases (Travel, Accommodation, Food)
    }
  })

  return pipelineProject
}
```

**Searches performed:**
- ✅ `fromSeed` - Not found
- ✅ `convertSeed` - Not found
- ✅ `seedToProject` - Not found
- ✅ `createFromSeed` - Not found

**Conclusion:** Zero integration code exists between Seeds and Pipeline.

---

## Comparison with app.openhorizon.cc

### What We Know About app.openhorizon.cc

**From browser inspection:**
1. Different navigation (Dashboard, Budget, AI Chat, Seeds)
2. Has Seeds system with 35 seeds
3. Has phase-based project management (5 phases per project)
4. Timeline/Gantt chart view
5. Different UI/UX from oh.153.se

**What We DON'T Know:**
- Is it deployed from this git repo or a different codebase?
- Does it have the Pipeline AI agents (Food, Accommodation, Travel)?
- Does it have Seeds → Pipeline integration?
- What database does it use?

**Hypothesis:** app.openhorizon.cc may be deployed from an older branch or separate repo before Pipeline was fully developed. The user mentioned it has "seed generation, seed garden, and seed to project conversion" which suggests it might have the integration we're missing.

---

## Why This Occurred: Timeline Reconstruction

**Best guess based on evidence:**

1. **Phase 1: OLD System** (Before Jan 2026)
   - Built `/projects` with wizard-based project creation
   - Added Seeds brainstorming (`/brainstorm`, `/seeds`)
   - Deployed to app.openhorizon.cc

2. **Phase 2: Pipeline Development** (Jan 2026)
   - Built entirely new `PipelineProject` system
   - Added AI agents (Food, Accommodation, Travel)
   - Added budget tracking, vendor management
   - Deployed to oh.153.se for testing
   - Week 1 Sprint: Issues #86, #87, #88 implemented

3. **Phase 3: Current State** (Jan 14, 2026)
   - oh.153.se has both OLD and NEW systems
   - Seeds still connected to OLD system
   - app.openhorizon.cc remains on older deployment
   - User notices the disconnection and requests merge

**Why it happened:** New Pipeline system was built as complete rewrite rather than evolution of old system. Integration with Seeds was not prioritized during initial development.

---

## Files Requiring Attention

### OLD Project System (To Be Archived)
```
app/src/app/(dashboard)/projects/
├── page.tsx                    # Project list (OLD)
├── new/page.tsx                # Project wizard (OLD)
├── [id]/page.tsx               # Project detail (OLD)
└── [id]/programme/page.tsx     # Programme builder (OLD)

app/src/server/routers/projects.ts    # OLD project tRPC routes
app/src/components/project/           # OLD project components
```

### Seeds System (To Be Updated)
```
app/src/app/(dashboard)/seeds/
├── page.tsx                    # Seed garden ✅
└── [id]/page.tsx               # Seed elaboration - UPDATE LINE 85

app/src/app/(dashboard)/brainstorm/page.tsx  # Seed generation ✅

app/src/server/routers/brainstorm.ts         # Seeds tRPC routes
app/src/components/brainstorm/               # Seed components
```

### Pipeline System (Current, Keep & Enhance)
```
app/src/app/(dashboard)/pipeline/
├── projects/page.tsx                # Pipeline project list ✅
├── projects/[id]/page.tsx           # Project detail ✅
└── projects/[id]/phases/[phaseId]/page.tsx  # Phase detail with AI agents ✅

app/src/server/routers/pipeline/
├── projects.ts                      # Pipeline project routes ✅
└── phases.ts                        # AI agent routes ✅

app/src/components/pipeline/
├── FoodSearchPanel.tsx              # Food Agent UI ✅
├── AccommodationSearchPanel.tsx     # Accommodation Agent UI ✅
└── TravelSearchPanel.tsx            # Travel Agent UI ✅
```

---

## Implementation Work Required

### High-Level Tasks

1. **Create Seed → Pipeline Integration**
   - Build `createPipelineProjectFromSeed()` function
   - Map seed fields to pipeline project fields
   - Generate default phases (Travel, Accommodation, Food)
   - Update "Turn into Project" button

2. **Archive OLD Project System**
   - Move `/projects` routes to `/projects-legacy`
   - Update navigation to remove "Projects" link
   - Add deprecation notice
   - Archive documentation

3. **Unify Navigation**
   - Remove "Projects" (old) from nav
   - Keep "Pipeline Projects" as main system
   - Keep "Brainstorm" and "Seed Garden"
   - Update root redirect (already done)

4. **Database Migration** (Optional)
   - Migrate existing OLD Projects to Pipeline format
   - Or leave as read-only archive

5. **Documentation**
   - Update CLAUDE.md to remove OLD system references
   - Document Seeds → Pipeline flow
   - Create migration guide

---

## Estimated Complexity

### Integration Work
**Task:** Seed → Pipeline Project Creation
**Complexity:** Medium (3-4 hours)
**Files:** 5-7 files
- New tRPC route: `pipeline.projects.createFromSeed`
- Update Seeds detail page button
- Create field mapping logic
- Generate default phases
- Add tests

### Archival Work
**Task:** Archive OLD Project System
**Complexity:** Low (1-2 hours)
**Files:** 10-15 files
- Rename routes to `projects-legacy`
- Update navigation
- Add deprecation notices
- Move documentation

### Testing
**Task:** End-to-end Seeds → Pipeline Flow
**Complexity:** Medium (2-3 hours)
- Generate seed
- Elaborate seed
- Convert to pipeline project
- Test AI agents on phases
- Verify budget tracking

**Total Estimated Time:** 6-9 hours

---

## Recommended Approach

### Option 1: Incremental Migration (RECOMMENDED)

1. **Step 1:** Create Seed → Pipeline integration (this sprint)
2. **Step 2:** Update Seeds UI to use Pipeline (this sprint)
3. **Step 3:** Add read-only access to OLD projects (next sprint)
4. **Step 4:** Full archival after user confirmation (next sprint)

**Benefits:**
- Quick win: Get Seeds working with Pipeline
- Low risk: OLD system remains accessible
- User can test before full migration

### Option 2: Complete Rewrite

1. Port app.openhorizon.cc codebase to oh.153.se
2. Add all Pipeline features (AI agents) to that codebase
3. Deploy as new main system

**Drawbacks:**
- High risk: Completely different codebase
- Unknown differences in app.openhorizon.cc
- May lose recent Pipeline development work

### Option 3: Database Merge

1. Keep both systems running
2. Create shared database views
3. Build adapter layer

**Drawbacks:**
- Technical debt increases
- Complexity remains
- No clear long-term path

---

## Next Steps

1. **User Confirmation:**
   - Confirm app.openhorizon.cc is from different/older codebase
   - Confirm preferred approach (Option 1 recommended)
   - Confirm OLD system can be archived

2. **Implementation Planning:**
   - Create detailed technical plan
   - Define field mappings (Seed → PipelineProject)
   - Plan default phase generation logic

3. **Begin Development:**
   - Create GitHub issue for Seed → Pipeline integration
   - Implement tRPC routes
   - Update UI components
   - Write tests

---

## Questions for User

1. Is app.openhorizon.cc deployed from this git repository or a different codebase?
2. Does app.openhorizon.cc have the new AI agents (Food, Accommodation, Travel)?
3. Can we archive the OLD `/projects` system completely, or do you need migration?
4. Are there any active projects in the OLD system that need to be preserved?
5. Should we proceed with Option 1 (Incremental Migration)?

---

**Report compiled by:** Claude Code SCAR Bot
**Stockholm time:** 2026-01-14
