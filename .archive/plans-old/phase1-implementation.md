# Phase 1: Idea-to-Project Generator - Implementation Plan

**Status**: Ready for Implementation
**Timeline**: 7-10 days
**Dependencies**: Phase 0 Complete ✅

---

## Overview

Phase 1 implements the core MVP feature: the Idea-to-Project Generator wizard that transforms user inputs into structured Erasmus+ Youth Exchange project concepts using AI.

### What's Already Done (Phase 0)
- ✅ Next.js 14 project with TypeScript and Tailwind
- ✅ Clerk authentication with sign-in/sign-up pages
- ✅ Prisma schema with multi-tenant architecture
- ✅ tRPC with context, routers, and API routes
- ✅ Basic project structure and utilities
- ✅ Environment configuration (Clerk, Supabase, OpenAI)

### What We're Building in Phase 1
1. **Wizard UI** - 5-step form for collecting project idea inputs
2. **AI Integration** - LangChain chains for generating project concepts
3. **Background Jobs** - Inngest for handling long-running AI generation
4. **Project Review UI** - Display and edit generated concepts
5. **Dashboard** - List of user's projects

---

## Task Breakdown

### Task 1: Install Additional Dependencies (30 min)

**Install Shadcn/ui components**:
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog form input label select textarea progress slider radio-group separator badge
```

**Install Inngest for background jobs**:
```bash
npm install inngest
```

**Install additional AI dependencies**:
```bash
npm install @langchain/core zod-to-json-schema
```

**Files to configure**:
- `src/inngest/client.ts` - Inngest client setup
- `src/app/api/inngest/route.ts` - Inngest webhook handler

---

### Task 2: Create Type Definitions & Schemas (1-2 hours)

**File**: `src/lib/schemas/project-wizard.ts`

Define Zod schemas for:
- `UserIdeaInputsSchema` - All wizard form inputs
- `ProjectDNASchema` - Extracted project characteristics
- `ProjectConceptSchema` - Generated project concept structure

**File**: `src/lib/types/project.ts`

TypeScript types for:
- `UserIdeaInputs`
- `ProjectDNA`
- `ProjectConcept`
- `GenerationStatus`

---

### Task 3: Build Wizard UI Components (2-3 days)

#### 3.1 Wizard Container & State Management

**File**: `src/components/project-wizard/ProjectWizard.tsx`
- Multi-step wizard container
- Progress indicator (1/5, 2/5, etc.)
- Navigation (Back, Next, Cancel)
- Form state management with React Hook Form
- Submit handler to trigger AI generation

**File**: `src/hooks/useProjectWizard.ts`
- Zustand store for wizard state
- Step navigation logic
- Form data persistence
- Reset functionality

#### 3.2 Wizard Step Components

**File**: `src/components/project-wizard/steps/BasicsStep.tsx` (Step 1)
- Theme/topic input (text + preset buttons)
- Free-form description textarea

**File**: `src/components/project-wizard/steps/TargetGroupStep.tsx` (Step 2)
- Age group radio buttons (13-17, 18-25, 26-30, mixed)
- Participant count slider (16-60)
- Target group profile radio (general, fewer opportunities, specific needs)
- Specific needs description (conditional)

**File**: `src/components/project-wizard/steps/DurationStep.tsx` (Step 3)
- Duration slider (5-21 days)
- Activity intensity radio (low, medium, high)
- Green ambition radio (basic, moderate, high)

**File**: `src/components/project-wizard/steps/PartnersStep.tsx` (Step 4)
- Partner status radio (confirmed, need suggestions, some confirmed)
- Partner experience level (new, mixed, experienced)
- Preferred countries input (optional)

**File**: `src/components/project-wizard/steps/AdditionalStep.tsx` (Step 5)
- Primary languages input
- Translation/interpretation checkboxes
- Digital comfort level radio
- Budget flexibility radio
- Additional notes textarea

#### 3.3 Generation Progress UI

**File**: `src/components/project-wizard/GenerationProgress.tsx`
- Loading spinner/animation
- Progress steps with checkmarks
- Status messages ("Analyzing inputs...", "Generating concept...", etc.)
- Progress percentage bar
- Cancel button (optional)
- Polling mechanism to check generation status

#### 3.4 Wizard Page

**File**: `src/app/(dashboard)/projects/new/page.tsx`
- Protected route (requires authentication)
- Render `ProjectWizard` component
- Handle redirect after generation completes

---

### Task 4: Backend - AI Generation Service (2-3 days)

#### 4.1 LangChain Chains

**File**: `src/lib/ai/chains/project-dna-extraction.ts`
```typescript
export async function extractProjectDNA(
  userInputs: UserIdeaInputs
): Promise<ProjectDNA>
```
- Uses GPT-4-turbo with temperature 0.3
- Structured output with Zod schema
- Analyzes user inputs and extracts Project DNA
- Returns inclusion complexity, risk level, etc.

**File**: `src/lib/ai/chains/project-concept-generation.ts`
```typescript
export async function generateProjectConcept(
  projectDna: ProjectDNA,
  similarProjects: SimilarProject[]
): Promise<ProjectConcept>
```
- Uses GPT-4-turbo with temperature 0.8 (creative)
- Takes Project DNA + RAG examples
- Generates full project concept (title, objectives, activities, etc.)
- Returns structured output matching Prisma schema

**File**: `src/lib/ai/chains/retrieve-similar-projects.ts`
```typescript
export async function retrieveSimilarProjects(
  projectDna: ProjectDNA
): Promise<SimilarProject[]>
```
- Uses pgvector in Supabase (if available)
- Embeds Project DNA as search query
- Returns 3 most similar successful projects
- **For MVP**: Can return empty array if no vector store yet

#### 4.2 AI Prompts

**File**: `src/lib/ai/prompts/project-dna-extraction.ts`
- Detailed system prompt for DNA extraction
- Includes Erasmus+ requirements
- Explains each Project DNA field
- Provides examples

**File**: `src/lib/ai/prompts/project-concept-generation.ts`
- Comprehensive system prompt for concept generation
- Includes evaluation criteria (Relevance, Design, Management)
- Horizontal dimensions (inclusion, sustainability, digital, democracy)
- Output format specifications

#### 4.3 Project Generation Service

**File**: `src/server/services/project-generator.ts`
```typescript
export async function generateProjectFromIdea(
  userInputs: UserIdeaInputs,
  tenantId: string,
  userId: string
): Promise<{ sessionId: string }>
```
- Orchestrates the full generation flow
- Creates `ProjectGenerationSession` record
- Triggers Inngest background job
- Returns session ID for status polling

---

### Task 5: Background Jobs with Inngest (1-2 days)

#### 5.1 Inngest Setup

**File**: `src/inngest/client.ts`
```typescript
import { Inngest } from 'inngest'

export const inngest = new Inngest({ id: 'open-horizon' })
```

**File**: `src/app/api/inngest/route.ts`
- Inngest webhook handler
- Registers all functions
- Handles incoming events

#### 5.2 Generation Function

**File**: `src/inngest/functions/generate-project.ts`
```typescript
export const generateProjectFromIdea = inngest.createFunction(
  { id: 'project.generate-from-idea' },
  { event: 'project.generate-from-idea' },
  async ({ event, step }) => {
    // Step 1: Load session
    // Step 2: Extract Project DNA
    // Step 3: Retrieve similar projects (RAG)
    // Step 4: Generate concept
    // Step 5: Save project to database
    // Step 6: Update session status
  }
)
```
- Multi-step background job
- Each step is retryable
- Updates session status throughout
- Error handling with status updates

---

### Task 6: tRPC API Routes (1 day)

**File**: `src/server/routers/projects.ts`

Add procedures:

```typescript
export const projectsRouter = router({
  // Existing: list, getById

  generateFromIdea: protectedProcedure
    .input(UserIdeaInputsSchema)
    .mutation(async ({ input, ctx }) => {
      // Trigger generation
      return { sessionId }
    }),

  getGenerationStatus: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Return session status and project if complete
    }),

  updateProject: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.object({ /* partial project fields */ })
    }))
    .mutation(async ({ input, ctx }) => {
      // Update project fields
    }),

  deleteProject: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Soft or hard delete
    })
})
```

Update `src/server/routers/_app.ts` to include projects router.

---

### Task 7: Project Review & Dashboard UI (2 days)

#### 7.1 Project Detail/Review Page

**File**: `src/app/(dashboard)/projects/[id]/page.tsx`
- Fetch project by ID using tRPC
- Loading state while fetching
- 404 if project not found
- Render `ProjectConceptReview` component

**File**: `src/components/project-concept/ProjectConceptReview.tsx`
- Header with title, tagline, status badge
- Overview section (participants, duration, budget estimate)
- Collapsible sections for each part:
  - Objectives
  - Target Group
  - Activity Outline (day-by-day)
  - Learning Outcomes
  - Inclusion Plan
  - Partner Profile
  - Budget Breakdown
  - Sustainability Narrative
  - Impact Narrative
- Action buttons:
  - Edit (toggles edit mode)
  - Regenerate (triggers new AI generation)
  - Save Draft
  - Proceed to Programme Builder (disabled for now)

**File**: `src/components/project-concept/sections/*.tsx`
- One component per section for clean organization
- Each component handles display and edit mode
- Use Shadcn components (Card, Badge, Separator, etc.)

#### 7.2 Projects Dashboard

**File**: `src/app/(dashboard)/projects/page.tsx`
- List all projects for current organization
- Table or card grid layout
- Columns: Title, Status, Participants, Duration, Created Date, Actions
- Search and filter by status
- "Create New Project" button → redirects to wizard
- Empty state with onboarding message

**File**: `src/components/projects/ProjectsList.tsx`
- Fetches projects using tRPC
- Loading skeleton
- Empty state
- Project cards/rows
- Click to view details

---

### Task 8: Dashboard Layout (0.5 days)

**File**: `src/app/(dashboard)/layout.tsx`
- Sidebar navigation (Projects, Settings, etc.)
- Organization selector (Clerk)
- User menu (profile, sign out)
- Protected layout (redirects to sign-in if not authenticated)

**File**: `src/components/layout/Sidebar.tsx`
- Navigation links
- Active link highlighting
- Mobile responsive (hamburger menu)

**File**: `src/components/layout/Header.tsx`
- Organization switcher
- User button (Clerk component)
- Breadcrumbs

---

### Task 9: Error Handling & Edge Cases (0.5 days)

1. **AI Generation Failures**
   - Catch errors in Inngest function
   - Update session status to "FAILED"
   - Display friendly error message to user
   - Allow retry

2. **Form Validation**
   - Client-side with Zod
   - Show inline error messages
   - Prevent submission if invalid

3. **Network Errors**
   - tRPC error handling
   - Retry logic with React Query
   - Toast notifications

4. **Empty States**
   - No projects yet
   - Generation in progress
   - Generation failed

5. **Loading States**
   - Skeleton loaders
   - Optimistic updates
   - Disable buttons during mutation

---

### Task 10: Testing & Polish (1-2 days)

#### 10.1 Manual Testing Scenarios

1. **Happy Path**:
   - Complete wizard with valid inputs
   - Wait for generation
   - Review generated concept
   - Edit and save
   - View in projects list

2. **Edge Cases**:
   - Minimal inputs (required fields only)
   - Maximum inputs (all optional fields)
   - Very short duration (5 days)
   - Very long duration (21 days)
   - Small group (16 participants)
   - Large group (60 participants)

3. **Error Scenarios**:
   - Cancel wizard mid-way
   - AI generation timeout
   - Network error during submission
   - Invalid token (auth failure)

4. **Multi-Tenancy**:
   - Create project in Org A
   - Switch to Org B
   - Verify Org A's project not visible
   - Create project in Org B
   - Switch back to Org A
   - Verify both orgs have independent projects

#### 10.2 AI Prompt Quality Testing

- Generate 5-10 projects with diverse inputs
- Manually review against Erasmus+ criteria
- Refine prompts if quality issues found
- Ensure objectives align with priorities
- Verify activities are age-appropriate
- Check inclusion plans are comprehensive

#### 10.3 UX Polish

- Smooth transitions
- Consistent spacing and typography
- Loading states everywhere
- Success/error toast messages
- Keyboard navigation
- Mobile responsive
- Dark mode support (if time permits)

---

## File Structure Summary

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Dashboard shell
│   │   ├── projects/
│   │   │   ├── page.tsx                  # Projects list
│   │   │   ├── new/
│   │   │   │   └── page.tsx              # Wizard page
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Project detail
│   ├── api/
│   │   ├── inngest/
│   │   │   └── route.ts                  # Inngest webhook
│   │   └── trpc/[trpc]/route.ts         # Existing
│   ├── sign-in/[[...sign-in]]/page.tsx  # Existing
│   ├── sign-up/[[...sign-up]]/page.tsx  # Existing
│   ├── layout.tsx                        # Existing (root)
│   └── page.tsx                          # Landing (update to redirect)
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── OrganizationSwitcher.tsx
│   ├── projects/
│   │   ├── ProjectsList.tsx
│   │   ├── ProjectCard.tsx
│   │   └── EmptyState.tsx
│   ├── project-wizard/
│   │   ├── ProjectWizard.tsx
│   │   ├── WizardProgress.tsx
│   │   ├── GenerationProgress.tsx
│   │   └── steps/
│   │       ├── BasicsStep.tsx
│   │       ├── TargetGroupStep.tsx
│   │       ├── DurationStep.tsx
│   │       ├── PartnersStep.tsx
│   │       └── AdditionalStep.tsx
│   └── project-concept/
│       ├── ProjectConceptReview.tsx
│       └── sections/
│           ├── ObjectivesSection.tsx
│           ├── TargetGroupSection.tsx
│           ├── ActivityOutlineSection.tsx
│           ├── LearningOutcomesSection.tsx
│           ├── InclusionSection.tsx
│           ├── PartnerProfileSection.tsx
│           ├── BudgetSection.tsx
│           ├── SustainabilitySection.tsx
│           └── ImpactSection.tsx
│
├── lib/
│   ├── ai/
│   │   ├── chains/
│   │   │   ├── project-dna-extraction.ts
│   │   │   ├── project-concept-generation.ts
│   │   │   └── retrieve-similar-projects.ts
│   │   └── prompts/
│   │       ├── project-dna-extraction.ts
│   │       └── project-concept-generation.ts
│   ├── schemas/
│   │   ├── project-wizard.ts
│   │   ├── project-dna.ts
│   │   └── project-concept.ts
│   ├── types/
│   │   └── project.ts
│   ├── prisma.ts                         # Existing
│   ├── utils.ts                          # Existing
│   └── trpc/
│       ├── client.ts                     # Existing
│       └── Provider.tsx                  # Existing
│
├── server/
│   ├── context.ts                        # Existing
│   ├── trpc.ts                           # Existing
│   ├── routers/
│   │   ├── _app.ts                       # Existing
│   │   └── projects.ts                   # Expand
│   └── services/
│       └── project-generator.ts          # New
│
├── inngest/
│   ├── client.ts
│   └── functions/
│       └── generate-project.ts
│
├── hooks/
│   ├── useProjectWizard.ts
│   └── useProjectGeneration.ts
│
└── middleware.ts                         # Existing
```

---

## Success Criteria

At the end of Phase 1, we should have:

✅ **Feature Complete**:
- User can complete 5-step wizard
- AI generates structured project concept
- User can review and edit concept
- Concept is saved to database
- Projects list shows all user's projects

✅ **Quality**:
- AI generation works >95% of time
- Generated concepts meet Erasmus+ requirements
- Generation completes in <60 seconds
- UI is intuitive and responsive

✅ **Technical**:
- Multi-tenancy enforced (projects scoped to org)
- Error handling prevents data loss
- Background jobs work reliably
- Type safety throughout

✅ **Ready for Next Phase**:
- Can extend with Programme Builder
- Can add Application Form Builder
- Foundation supports future features

---

## Risks & Mitigation

### Risk 1: AI Generation Too Slow
**Mitigation**:
- Use Inngest for background processing
- Show detailed progress updates
- Allow user to leave page and come back
- Optimize prompts to reduce tokens

### Risk 2: AI Generation Quality Inconsistent
**Mitigation**:
- Use structured output (Zod schemas)
- Provide RAG examples (when available)
- Allow regeneration
- Collect feedback for improvement

### Risk 3: Complexity Overwhelming
**Mitigation**:
- Build incrementally (wizard → AI → review)
- Test each component independently
- Use existing patterns from Phase 0
- Break into smaller PRs

### Risk 4: Cost Overruns (OpenAI)
**Mitigation**:
- Monitor usage in OpenAI dashboard
- Set spending limits
- Estimate ~$0.50-$1.00 per generation
- Use caching where possible

---

## Timeline Estimate

| Task | Duration | Dependencies |
|------|----------|--------------|
| 1. Install dependencies | 0.5 days | Phase 0 complete |
| 2. Type definitions & schemas | 0.5 days | - |
| 3. Wizard UI components | 2-3 days | Task 2 |
| 4. AI generation service | 2-3 days | Task 2 |
| 5. Background jobs (Inngest) | 1-2 days | Task 4 |
| 6. tRPC API routes | 1 day | Task 4, 5 |
| 7. Review & dashboard UI | 2 days | Task 6 |
| 8. Dashboard layout | 0.5 days | Task 7 |
| 9. Error handling | 0.5 days | All above |
| 10. Testing & polish | 1-2 days | All above |

**Total**: 7-10 days (assuming full-time work)

---

## Next Steps After Phase 1

Once Phase 1 is complete and tested, we can proceed to:

1. **Phase 1.5**: Knowledge Crawler (MCP server for Erasmus+ sites)
2. **Phase 2**: Programme & Agenda Builder (day-by-day detailed schedule)
3. **Phase 3**: Application Form Builder (Part B form with AI)
4. **Phase 4**: Budget Calculator & PDF Export

---

## Notes

- **Database already set up**: Prisma schema matches the plan
- **Auth already working**: Clerk with organizations enabled
- **tRPC foundation ready**: Context, routers, API routes all configured
- **Focus**: Build wizard UI, integrate AI, wire everything together
- **MVP mindset**: Get it working end-to-end, polish later
- **Test with real data**: Use actual Erasmus+ examples for validation

---

**Status**: Ready to execute
**Approval**: Awaiting user confirmation to begin implementation
