# Feature: Brainstorming Playground (Seed Factory & Garden)

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files etc.

## Feature Description

The Brainstorming Playground is a creative ideation space that exists before formal project planning. It enables users to explore ideas through AI-powered generation (Seed Factory), store interesting concepts for later (Seed Garden), and collaboratively refine seeds into project-ready concepts through conversation (Seed Elaboration). This feature reduces friction between inspiration and commitment, making ideation playful and productive.

## User Story

As an Erasmus+ Youth Exchange coordinator
I want to explore creative project ideas through AI-powered brainstorming without committing to full project planning
So that I can discover unexpected possibilities, refine rough concepts at my own pace, and transition to structured project creation only when ready

## Problem Statement

Currently, users face a gap between having a vague idea and creating a full project. The existing wizard requires clear, concrete inputs, which creates pressure and limits creative exploration. Users need a space to:
- Generate multiple ideas from a feeling, mood, or theme without commitment
- Store interesting concepts for future exploration
- Collaboratively develop seeds through conversation before formalizing
- Transition smoothly from inspiration to structured planning

## Solution Statement

Implement a three-phase brainstorming system:
1. **Seed Factory**: AI generates 5-15 creative project seeds from a mood/theme prompt with adjustable creativity settings
2. **Seed Garden**: Personal collection of saved seeds with browsing and filtering
3. **Seed Elaboration**: Interactive workspace where users and AI collaboratively refine seeds through conversation, with real-time preview updates and seamless transition to project creation

## Feature Metadata

**Feature Type**: New Capability
**Estimated Complexity**: High
**Primary Systems Affected**: Frontend UI (new pages), Backend tRPC routes, AI chains (LangChain), Database (new models), Background jobs (Inngest)
**Dependencies**:
- Existing: OpenAI GPT-4, LangChain, tRPC, Prisma, Inngest, Zustand
- New: None (leverages existing stack)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `/app/src/lib/ai/chains/project-concept-generation.ts` (lines 1-47) - Why: AI chain pattern with LangChain to mirror
- `/app/src/lib/ai/prompts/project-concept-generation.ts` (lines 1-184) - Why: Comprehensive prompt engineering pattern with Erasmus+ context
- `/app/src/inngest/functions/generate-project.ts` (lines 1-115) - Why: Background job pattern for long-running AI generation
- `/app/src/server/routers/projects.ts` (lines 1-100) - Why: tRPC router pattern with multi-tenancy checks
- `/app/src/hooks/useProjectWizard.ts` (lines 1-62) - Why: Zustand store pattern for form state management
- `/app/src/app/(dashboard)/projects/new/page.tsx` (lines 1-150) - Why: Wizard UI pattern with progress, validation, polling
- `/app/src/app/(dashboard)/projects/[id]/page.tsx` - Why: Detail page with inline editing, dialog patterns
- `/app/prisma/schema.prisma` (lines 19-161) - Why: Database schema patterns, multi-tenancy, dual content mode
- `/app/src/lib/schemas/project-wizard.ts` - Why: Zod validation schema patterns
- `/app/src/components/ui/dialog.tsx` - Why: Dialog/modal component from shadcn/ui
- `/app/src/components/ui/card.tsx` - Why: Card display component
- `/app/src/components/ui/slider.tsx` - Why: Slider for temperature/quantity controls

### New Files to Create

**Database Migration:**
- `/app/prisma/migrations/YYYYMMDDHHMMSS_add_brainstorm_models/migration.sql` - Database migration for new tables

**Backend:**
- `/app/src/server/routers/brainstorm.ts` - tRPC router for brainstorm operations
- `/app/src/server/services/brainstorm-generator.ts` - Service layer for brainstorm session management
- `/app/src/lib/ai/chains/seed-generation.ts` - AI chain for generating seeds
- `/app/src/lib/ai/chains/seed-elaboration.ts` - AI chain for elaborating seeds via conversation
- `/app/src/lib/ai/prompts/seed-generation.ts` - Prompt template for seed factory
- `/app/src/lib/ai/prompts/seed-elaboration.ts` - Prompt template for conversational elaboration
- `/app/src/inngest/functions/generate-seeds.ts` - Background job for seed generation
- `/app/src/lib/schemas/brainstorm.ts` - Zod schemas for brainstorm inputs/outputs
- `/app/src/lib/types/brainstorm.ts` - TypeScript types for brainstorm domain

**Frontend:**
- `/app/src/app/(dashboard)/brainstorm/page.tsx` - Seed Factory interface
- `/app/src/app/(dashboard)/seeds/page.tsx` - Seed Garden list view
- `/app/src/app/(dashboard)/seeds/[id]/page.tsx` - Seed Elaboration workspace
- `/app/src/components/brainstorm/SeedCard.tsx` - Individual seed card component
- `/app/src/components/brainstorm/SeedGenerationForm.tsx` - Generation form with controls
- `/app/src/components/brainstorm/SeedElaborationChat.tsx` - Chat interface for elaboration
- `/app/src/components/brainstorm/SeedPreview.tsx` - Live preview component
- `/app/src/components/brainstorm/ApprovalLikelihoodMeter.tsx` - Visual feasibility indicator
- `/app/src/hooks/useBrainstormGeneration.ts` - Hook for generation state
- `/app/src/hooks/useSeedElaboration.ts` - Hook for elaboration state

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [LangChain Structured Output](https://python.langchain.com/docs/concepts/structured_outputs/)
  - Specific section: with_structured_output() method
  - Why: Required for reliable JSON output from GPT-4
- [React Hook Form Advanced Usage](https://react-hook-form.com/advanced-usage)
  - Specific section: Multi-step forms
  - Why: Form handling best practices for 2025
- [Next.js 15 App Router Dynamic Routes](https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes)
  - Specific section: Dynamic segments with [id]
  - Why: Proper routing for seed elaboration pages
- [tRPC with Next.js 15](https://www.wisp.blog/blog/how-to-use-trpc-with-nextjs-15-app-router)
  - Specific section: Query patterns with refetchInterval
  - Why: Polling pattern for generation status
- [Zustand State Management 2025](https://www.developerway.com/posts/react-state-management-2025)
  - Why: Modern patterns for client-side state
- [UX Pilot AI Design Patterns](https://uxpilot.ai/)
  - Why: Inspiration for creative AI ideation UX patterns
- [Temperature in Prompt Engineering](https://www.analyticsvidhya.com/blog/2024/07/temperature-in-prompt-engineering/)
  - Why: Choosing appropriate temperature for creative vs structured generation

### Patterns to Follow

**Naming Conventions:**
```typescript
// Models: PascalCase
BrainstormSession, Seed, SeedElaboration

// Functions: camelCase
generateSeeds, elaborateSeed, saveSeed

// Components: PascalCase
SeedCard, SeedGenerationForm

// Database fields: snake_case
generated_seeds, approval_likelihood, creativity_temperature
```

**Multi-Tenancy Pattern (CRITICAL):**
```typescript
// ALWAYS include tenantId filter in queries
const seeds = await ctx.prisma.seed.findMany({
  where: {
    tenantId: ctx.orgId, // Multi-tenancy check
    userId: ctx.userId,
  },
})

// ALWAYS set tenantId when creating records
const seed = await ctx.prisma.seed.create({
  data: {
    tenantId: ctx.orgId,
    userId: ctx.userId,
    // ... other fields
  },
})
```

**Error Handling Pattern:**
```typescript
// AI chains should catch and rethrow with context
try {
  const result = await chain.invoke({...})
  return result as OutputType
} catch (error) {
  console.error('Error in AI chain:', error)
  throw new Error('Failed to generate seeds')
}
```

**tRPC Procedure Pattern:**
```typescript
export const brainstormRouter = router({
  generate: orgProcedure
    .input(BrainstormInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Create session
      // Trigger Inngest job
      // Return sessionId
    }),

  getStatus: orgProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Query with tenant check
    }),
})
```

**Background Job Pattern (Inngest):**
```typescript
export const generateSeeds = inngest.createFunction(
  { id: 'brainstorm.generate-seeds', name: 'Generate Seeds' },
  { event: 'brainstorm.generate-seeds' },
  async ({ event, step }) => {
    // Step 1: Load session
    const session = await step.run('load-session', async () => {...})

    // Step 2: Generate with AI
    const seeds = await step.run('generate-seeds', async () => {...})

    // Step 3: Save results
    await step.run('save-results', async () => {...})
  }
)
```

**Polling Pattern:**
```typescript
const { data: generationStatus } = trpc.brainstorm.getStatus.useQuery(
  { sessionId: sessionId! },
  {
    enabled: !!sessionId,
    refetchInterval: (query) =>
      query.state.data?.status === 'IN_PROGRESS' ? 2000 : false,
  }
)
```

**Logging Pattern:**
```typescript
console.log('✅ Seeds generated successfully:', session.id)
console.error('❌ Failed to generate seeds:', error)
console.log('Generating seeds for session:', sessionId)
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation (Database & Types)

Establish data models, schemas, and type definitions to support all three phases of the brainstorming feature.

**Tasks:**
- Add Prisma models for BrainstormSession, Seed, SeedElaboration, ElaborationMessage
- Create Zod schemas for all inputs and outputs
- Define TypeScript types for domain models
- Generate Prisma client

### Phase 2: AI Chain Development

Build AI generation and elaboration chains following existing LangChain patterns.

**Tasks:**
- Create seed generation AI chain with creative prompt
- Create seed elaboration AI chain for conversational refinement
- Design prompts with Erasmus+ context and creativity controls
- Test AI chains with various inputs

### Phase 3: Backend API Layer

Implement tRPC routers and services for all brainstorm operations.

**Tasks:**
- Create brainstorm tRPC router with CRUD operations
- Implement service layer for session management
- Create Inngest background job for seed generation
- Add router to app router
- Implement multi-tenancy checks throughout

### Phase 4: Frontend - Seed Factory

Build the generation interface where users create new brainstorm sessions.

**Tasks:**
- Create Seed Factory page with prompt input and controls
- Build generation form component with temperature and count sliders
- Implement loading state with polling
- Create seed card grid display
- Add save/dismiss actions for generated seeds

### Phase 5: Frontend - Seed Garden

Build the storage and browsing interface for saved seeds.

**Tasks:**
- Create Seed Garden list page
- Implement seed card component with navigation to elaboration
- Add filtering and sorting
- Design empty state for no saved seeds

### Phase 6: Frontend - Seed Elaboration

Build the collaborative refinement workspace with split-screen interface.

**Tasks:**
- Create elaboration page with split layout (preview + chat)
- Build real-time preview component
- Implement chat interface with apply buttons
- Add approval likelihood meter
- Create "Turn into Project" transition flow

### Phase 7: Testing & Validation

Comprehensive testing across all components and flows.

**Tasks:**
- Test complete user journey (Factory → Garden → Elaboration → Project)
- Validate AI output quality and consistency
- Test edge cases (no seeds, generation failures, long elaborations)
- Verify multi-tenancy isolation
- Run all validation commands

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE `/app/prisma/schema.prisma` (UPDATE)

- **ADD**: Brainstorm domain models to existing schema (after Programme models)
- **PATTERN**: Multi-tenancy with `tenantId` and `userId` fields (mirror Project model lines 71-75)
- **IMPLEMENT**:
```prisma
// ============================================================================
// BRAINSTORMING PLAYGROUND
// ============================================================================

model BrainstormSession {
  id                  String              @id @default(uuid()) @db.Uuid
  tenantId            String              @map("tenant_id") @db.Uuid
  userId              String              @map("user_id")

  prompt              String              @db.Text
  creativityTemp      Float               @default(0.9) @map("creativity_temperature")
  seedCount           Int                 @default(10) @map("seed_count")

  generationStatus    GenerationStatus    @default(IN_PROGRESS) @map("generation_status")
  aiModel             String              @default("gpt-4-turbo-preview") @map("ai_model")

  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")

  // Relations
  organization        Organization        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  seeds               Seed[]

  @@index([tenantId, userId])
  @@map("brainstorm_sessions")
}

model Seed {
  id                     String              @id @default(uuid()) @db.Uuid
  sessionId              String              @map("session_id") @db.Uuid
  tenantId               String              @map("tenant_id") @db.Uuid
  userId                 String              @map("user_id")

  title                  String              @db.VarChar(200)
  description            String              @db.Text
  approvalLikelihood     Float               @default(0.5) @map("approval_likelihood") // 0.0-1.0

  isSaved                Boolean             @default(false) @map("is_saved")
  isDismissed            Boolean             @default(false) @map("is_dismissed")

  // Elaboration tracking
  elaborationCount       Int                 @default(0) @map("elaboration_count")
  currentVersion         Json?               @map("current_version") // Latest elaborated version

  createdAt              DateTime            @default(now()) @map("created_at")
  updatedAt              DateTime            @updatedAt @map("updated_at")

  // Relations
  session                BrainstormSession   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  organization           Organization        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  elaborations           SeedElaboration[]

  @@index([tenantId, userId, isSaved])
  @@index([sessionId])
  @@map("seeds")
}

model SeedElaboration {
  id                  String              @id @default(uuid()) @db.Uuid
  seedId              String              @map("seed_id") @db.Uuid
  tenantId            String              @map("tenant_id") @db.Uuid

  conversationHistory Json                @map("conversation_history") // Array of messages
  currentSeedState    Json                @map("current_seed_state") // Current elaborated seed

  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")

  // Relations
  seed                Seed                @relation(fields: [seedId], references: [id], onDelete: Cascade)
  organization        Organization        @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([seedId]) // One elaboration session per seed
  @@index([tenantId])
  @@map("seed_elaborations")
}
```
- **UPDATE**: Organization model to add relations
```prisma
// In Organization model, add to relations:
brainstormSessions  BrainstormSession[]
seeds               Seed[]
seedElaborations    SeedElaboration[]
```
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx prisma format`

### CREATE migration for brainstorm models

- **IMPLEMENT**: Generate Prisma migration
- **COMMAND**: `cd /worktrees/openhorizon.cc/issue-3/app && npx prisma migrate dev --name add_brainstorm_models`
- **GOTCHA**: Ensure DATABASE_URL is set in .env (may need to use dev database)
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx prisma migrate status`

### CREATE `/app/src/lib/types/brainstorm.ts`

- **IMPLEMENT**: TypeScript types for brainstorm domain
```typescript
import type { BrainstormSession, Seed, SeedElaboration } from '@prisma/client'

// Input types
export interface BrainstormInput {
  prompt: string
  creativityTemp?: number // 0.0-1.0, default 0.9
  seedCount?: number      // 5-15, default 10
}

export interface SeedElaborationInput {
  seedId: string
  userMessage: string
}

export interface ApplySuggestionInput {
  seedId: string
  suggestionText: string
  fieldToUpdate: 'title' | 'description' | 'tags'
}

// Output types
export interface GeneratedSeed {
  title: string
  description: string
  approvalLikelihood: number // 0.0-1.0
  suggestedTags?: string[]
  estimatedDuration?: number // days
  estimatedParticipants?: number
}

export interface ElaborationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  appliedChanges?: Partial<GeneratedSeed>
}

export interface ElaborationResponse {
  message: string
  suggestions: SeedSuggestion[]
  updatedSeed: GeneratedSeed
  updatedApprovalLikelihood: number
}

export interface SeedSuggestion {
  id: string
  text: string
  category: 'title' | 'description' | 'theme' | 'scope' | 'feasibility'
  rationale: string
}

// Enhanced types with relations
export type SeedWithElaboration = Seed & {
  elaborations: SeedElaboration[]
}

export type SessionWithSeeds = BrainstormSession & {
  seeds: Seed[]
}
```
- **IMPORTS**: `import type { BrainstormSession, Seed, SeedElaboration } from '@prisma/client'`
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`

### CREATE `/app/src/lib/schemas/brainstorm.ts`

- **IMPLEMENT**: Zod validation schemas
```typescript
import { z } from 'zod'

export const BrainstormInputSchema = z.object({
  prompt: z.string().min(10).max(1000),
  creativityTemp: z.number().min(0.0).max(1.0).optional().default(0.9),
  seedCount: z.number().int().min(5).max(15).optional().default(10),
})

export const SeedElaborationInputSchema = z.object({
  seedId: z.string().uuid(),
  userMessage: z.string().min(1).max(2000),
})

export const ApplySuggestionInputSchema = z.object({
  seedId: z.string().uuid(),
  suggestionText: z.string().min(1),
  fieldToUpdate: z.enum(['title', 'description', 'tags']),
})

export const GeneratedSeedSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(50).max(2000),
  approvalLikelihood: z.number().min(0.0).max(1.0),
  suggestedTags: z.array(z.string()).optional(),
  estimatedDuration: z.number().int().min(5).max(21).optional(),
  estimatedParticipants: z.number().int().min(16).max(60).optional(),
})

export const SeedsArraySchema = z.object({
  seeds: z.array(GeneratedSeedSchema),
})

export const SeedSuggestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.enum(['title', 'description', 'theme', 'scope', 'feasibility']),
  rationale: z.string(),
})

export const ElaborationResponseSchema = z.object({
  message: z.string(),
  suggestions: z.array(SeedSuggestionSchema),
  updatedSeed: GeneratedSeedSchema,
  updatedApprovalLikelihood: z.number().min(0.0).max(1.0),
})

// Type inference
export type BrainstormInput = z.infer<typeof BrainstormInputSchema>
export type SeedElaborationInput = z.infer<typeof SeedElaborationInputSchema>
export type ApplySuggestionInput = z.infer<typeof ApplySuggestionInputSchema>
export type GeneratedSeed = z.infer<typeof GeneratedSeedSchema>
export type SeedsArray = z.infer<typeof SeedsArraySchema>
export type ElaborationResponse = z.infer<typeof ElaborationResponseSchema>
```
- **PATTERN**: Schema-driven types via `z.infer<>` (mirror project-wizard.ts)
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`

### CREATE `/app/src/lib/ai/prompts/seed-generation.ts`

- **IMPLEMENT**: Creative prompt template for seed generation
- **PATTERN**: Mirror PROJECT_CONCEPT_GENERATION_PROMPT structure (lines 8-183 in project-concept-generation.ts)
- **TEMPERATURE RATIONALE**: Use 0.9-1.0 for maximum creativity in brainstorming phase
```typescript
export const SEED_GENERATION_PROMPT = `You are a creative brainstorming assistant specialized in Erasmus+ Youth Exchange project ideation.

USER PROMPT:
{prompt}

CREATIVITY GUIDANCE:
Temperature: {creativityTemp}
- High temperature (>0.8): Be bold, unexpected, experimental
- Medium temperature (0.5-0.8): Balance creativity with practicality
- Low temperature (<0.5): Focus on proven, safe concepts

YOUR TASK:
Generate {seedCount} diverse, inspiring project seed ideas based on the user's prompt.

ERASMUS+ YOUTH EXCHANGE CONTEXT:
- Target ages: 13-30 years
- Duration: 5-21 days of activities
- International: Minimum 2 countries
- Based on non-formal learning
- Must align with EU values: inclusion, sustainability, digital transformation, democratic participation

SEED REQUIREMENTS:

1. **Diversity**: Each seed should explore a different angle or approach to the prompt theme
2. **Specificity**: Avoid generic ideas - include concrete elements (activities, settings, outcomes)
3. **Feasibility Range**: Mix ambitious ideas with practical ones
4. **Erasmus+ Alignment**: All seeds must be viable as Youth Exchange projects
5. **Inspiration**: Write in engaging, enthusiastic language that sparks excitement

FOR EACH SEED GENERATE:

**Title** (5-10 words):
- Memorable and evocative
- Clearly hints at the theme
- Professional yet creative
- Example: "Ocean Guardians: Youth Leading Marine Conservation"

**Description** (100-150 words):
- What the project is about (2-3 sentences)
- Key activities or approaches (2-3 examples)
- Who it's for and why it matters (1 sentence)
- What participants will gain (1 sentence)
- Use informal, engaging tone (like talking to a friend)
- Be specific with details (not "team activities" but "building miniature wind turbines")

**Approval Likelihood** (0.0-1.0):
Score how likely this seed would be approved for Erasmus+ funding:
- 0.8-1.0: Strongly aligned, proven concept, clear EU priorities
- 0.6-0.8: Good potential, may need refinement
- 0.4-0.6: Creative but risky, requires careful planning
- 0.2-0.4: Ambitious stretch, challenging to execute
- 0.0-0.2: Experimental, significant barriers

Consider:
- Alignment with Erasmus+ priorities
- Feasibility (budget, logistics, partners)
- Clarity of learning outcomes
- Inclusion and accessibility
- Track record of similar successful projects

**Suggested Tags** (3-5 tags):
- Erasmus+ priorities (e.g., "sustainability", "inclusion", "digital")
- Activity types (e.g., "outdoor", "creative", "workshop-based")
- Themes (e.g., "environment", "entrepreneurship", "cultural-heritage")

**Estimated Duration** (5-21 days):
Realistic project duration based on activities described

**Estimated Participants** (16-60):
Realistic participant count including youth + leaders

QUALITY STANDARDS:
- Every seed should feel distinct and unique
- Balance creativity with Erasmus+ requirements
- Include enough detail to visualize the project
- Make the reader think "I want to do this!"
- Vary approval likelihood scores based on real feasibility

AVOID:
- Generic descriptions like "participants will learn teamwork"
- Vague activity lists like "various workshops"
- Copying similar ideas across multiple seeds
- Unrealistic or impossible concepts
- Ideas that don't fit Erasmus+ Youth Exchange format

TONE:
Informal, enthusiastic, inspiring. Write like you're pitching exciting opportunities to friends, not writing a formal grant application.

OUTPUT FORMAT:
{format_instructions}

Generate {seedCount} creative, diverse, feasible project seeds that inspire action!`
```
- **VALIDATE**: Check prompt compiles and includes format_instructions placeholder

### CREATE `/app/src/lib/ai/prompts/seed-elaboration.ts`

- **IMPLEMENT**: Conversational elaboration prompt
```typescript
export const SEED_ELABORATION_PROMPT = `You are a collaborative creative partner helping refine an Erasmus+ Youth Exchange project seed.

CURRENT SEED STATE:
{currentSeedJson}

CONVERSATION HISTORY:
{conversationHistoryJson}

USER MESSAGE:
{userMessage}

YOUR ROLE:
You're helping the user develop this seed through conversation. They might:
- Request changes: "Make it more focused on digital skills"
- Ask for suggestions: "How can I make this more inclusive?"
- Seek clarification: "What activities would work for this?"
- Direct edits: "Change the title to..."

RESPONSE STRUCTURE:

1. **Conversational Message** (2-4 sentences):
   - Acknowledge what the user said
   - Explain your thinking or suggestions
   - Be encouraging and collaborative
   - Use informal, friendly tone

2. **Actionable Suggestions** (2-4 suggestions):
   Each suggestion should:
   - Be specific and concrete
   - Include clear rationale
   - Be categorized (title/description/theme/scope/feasibility)
   - Be applicable via a single click

3. **Updated Seed**:
   If the user requested a change, apply it and return the updated seed
   If the user asked for suggestions, return seed unchanged but provide options

4. **Updated Approval Likelihood**:
   Recalculate based on changes made or suggested
   Explain if likelihood increased/decreased and why

GUIDELINES:

**When User Requests Changes:**
- Apply the requested change to the seed
- Explain what you changed and why it works
- Provide 2-3 related suggestions for further improvement
- Update approval likelihood if change affects feasibility

**When User Asks Questions:**
- Answer clearly and concisely
- Provide 3-4 concrete suggestions they can apply
- Don't change the seed unless explicitly requested
- Keep approval likelihood the same

**When User Wants More Ideas:**
- Generate creative alternatives
- Show different approaches to the same goal
- Vary scope and ambition level
- Maintain Erasmus+ alignment

**Approval Likelihood Adjustments:**
Increase when changes:
- Strengthen EU priority alignment
- Add concrete, proven activities
- Improve inclusion or sustainability
- Clarify learning outcomes

Decrease when changes:
- Add logistical complexity
- Increase budget requirements
- Reduce clarity or focus
- Create accessibility barriers

TONE:
Encouraging, collaborative, creative. You're a brainstorming partner, not a teacher or critic. Celebrate good ideas and gently guide toward feasibility.

AVOID:
- Being prescriptive or limiting creativity
- Making the seed overly formal or rigid
- Removing personality or unique elements
- Ignoring user preferences

OUTPUT FORMAT:
{format_instructions}

Help the user develop their seed into something they're excited to turn into a full project!`
```
- **VALIDATE**: Check prompt structure and placeholders

### CREATE `/app/src/lib/ai/chains/seed-generation.ts`

- **IMPLEMENT**: LangChain chain for seed generation
- **PATTERN**: Mirror project-concept-generation.ts (lines 14-47)
- **TEMPERATURE**: Use user-provided creativityTemp (0.7-1.0 range)
```typescript
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { SeedsArraySchema } from '@/lib/schemas/brainstorm'
import { SEED_GENERATION_PROMPT } from '@/lib/ai/prompts/seed-generation'
import type { BrainstormInput, GeneratedSeed } from '@/lib/types/brainstorm'

/**
 * Generate creative project seeds from user prompt
 *
 * Uses GPT-4 with high temperature for maximum creativity.
 * Returns an array of diverse, inspiring seed ideas.
 */
export async function generateSeeds(
  input: BrainstormInput
): Promise<GeneratedSeed[]> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: input.creativityTemp || 0.9,
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const parser = StructuredOutputParser.fromZodSchema(SeedsArraySchema)
  const prompt = PromptTemplate.fromTemplate(SEED_GENERATION_PROMPT)
  const chain = prompt.pipe(model).pipe(parser)

  try {
    const result = await chain.invoke({
      prompt: input.prompt,
      creativityTemp: input.creativityTemp || 0.9,
      seedCount: input.seedCount || 10,
      format_instructions: parser.getFormatInstructions(),
    })

    return (result as any).seeds as GeneratedSeed[]
  } catch (error) {
    console.error('❌ Error generating seeds:', error)
    throw new Error('Failed to generate seeds')
  }
}
```
- **IMPORTS**: OpenAI, LangChain, schemas, types
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`

### CREATE `/app/src/lib/ai/chains/seed-elaboration.ts`

- **IMPLEMENT**: LangChain chain for conversational elaboration
- **TEMPERATURE**: Use 0.7 (balance creativity with consistency)
```typescript
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { ElaborationResponseSchema } from '@/lib/schemas/brainstorm'
import { SEED_ELABORATION_PROMPT } from '@/lib/ai/prompts/seed-elaboration'
import type { GeneratedSeed, ElaborationMessage, ElaborationResponse } from '@/lib/types/brainstorm'

/**
 * Elaborate seed through conversational interaction
 *
 * Takes current seed state, conversation history, and user message.
 * Returns assistant response with suggestions and optionally updated seed.
 */
export async function elaborateSeed(
  currentSeed: GeneratedSeed,
  conversationHistory: ElaborationMessage[],
  userMessage: string
): Promise<ElaborationResponse> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7, // Balanced for conversation
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const parser = StructuredOutputParser.fromZodSchema(ElaborationResponseSchema)
  const prompt = PromptTemplate.fromTemplate(SEED_ELABORATION_PROMPT)
  const chain = prompt.pipe(model).pipe(parser)

  try {
    const result = await chain.invoke({
      currentSeedJson: JSON.stringify(currentSeed, null, 2),
      conversationHistoryJson: JSON.stringify(conversationHistory, null, 2),
      userMessage,
      format_instructions: parser.getFormatInstructions(),
    })

    return result as ElaborationResponse
  } catch (error) {
    console.error('❌ Error elaborating seed:', error)
    throw new Error('Failed to elaborate seed')
  }
}
```
- **PATTERN**: Similar to seed-generation.ts but for conversational flow
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`

### CREATE `/app/src/server/services/brainstorm-generator.ts`

- **IMPLEMENT**: Service layer for brainstorm session management
- **PATTERN**: Mirror project-generator.ts service pattern
```typescript
import prisma from '@/lib/prisma'
import { inngest } from '@/inngest/client'
import type { BrainstormInput } from '@/lib/types/brainstorm'

/**
 * Create brainstorm session and trigger background generation
 */
export async function generateBrainstormSession(
  input: BrainstormInput,
  tenantId: string,
  userId: string
) {
  // Create session record
  const session = await prisma.brainstormSession.create({
    data: {
      tenantId,
      userId,
      prompt: input.prompt,
      creativityTemp: input.creativityTemp || 0.9,
      seedCount: input.seedCount || 10,
      generationStatus: 'IN_PROGRESS',
      aiModel: 'gpt-4-turbo-preview',
    },
  })

  // Trigger Inngest background job
  await inngest.send({
    name: 'brainstorm.generate-seeds',
    data: {
      sessionId: session.id,
      tenantId,
      userId,
    },
  })

  return { sessionId: session.id }
}

/**
 * Get generation status for polling
 */
export async function getBrainstormStatus(
  sessionId: string,
  tenantId: string
) {
  const session = await prisma.brainstormSession.findFirst({
    where: {
      id: sessionId,
      tenantId, // Multi-tenancy check
    },
    include: {
      seeds: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!session) {
    throw new Error('Session not found')
  }

  return {
    status: session.generationStatus,
    seeds: session.seeds,
    sessionId: session.id,
  }
}
```
- **PATTERN**: Create session → Trigger Inngest → Poll for status
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`

### CREATE `/app/src/inngest/functions/generate-seeds.ts`

- **IMPLEMENT**: Inngest background job for seed generation
- **PATTERN**: Mirror generate-project.ts structure (lines 15-114)
```typescript
import { inngest } from '@/inngest/client'
import prisma from '@/lib/prisma'
import { generateSeeds } from '@/lib/ai/chains/seed-generation'
import type { BrainstormInput } from '@/lib/types/brainstorm'

/**
 * Generate Seeds - Background Job
 *
 * Runs AI generation in background to avoid blocking the API.
 */
export const generateSeedsJob = inngest.createFunction(
  {
    id: 'brainstorm.generate-seeds',
    name: 'Generate Brainstorm Seeds',
  },
  { event: 'brainstorm.generate-seeds' },
  async ({ event, step }) => {
    const { sessionId, tenantId, userId } = event.data

    // Step 1: Load session
    const session = await step.run('load-session', async () => {
      const session = await prisma.brainstormSession.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        throw new Error(`Session ${sessionId} not found`)
      }

      return session
    })

    // Step 2: Generate seeds with AI
    const generatedSeeds = await step.run('generate-seeds', async () => {
      console.log('🌱 Generating seeds for session:', sessionId)

      const input: BrainstormInput = {
        prompt: session.prompt,
        creativityTemp: session.creativityTemp,
        seedCount: session.seedCount,
      }

      return await generateSeeds(input)
    })

    // Step 3: Save seeds to database
    await step.run('save-seeds', async () => {
      console.log(`💾 Saving ${generatedSeeds.length} seeds to database...`)

      const seedsData = generatedSeeds.map((seed) => ({
        sessionId: session.id,
        tenantId,
        userId,
        title: seed.title,
        description: seed.description,
        approvalLikelihood: seed.approvalLikelihood,
        currentVersion: seed as any, // Store full seed as JSON
      }))

      await prisma.seed.createMany({
        data: seedsData,
      })
    })

    // Step 4: Update session status
    await step.run('update-session', async () => {
      console.log('✅ Seeds generated successfully')

      await prisma.brainstormSession.update({
        where: { id: sessionId },
        data: {
          generationStatus: 'COMPLETED',
        },
      })
    })

    return { success: true, sessionId }
  }
)
```
- **PATTERN**: Load → Generate → Save → Update status (mirrors project generation)
- **GOTCHA**: Must handle AI failures gracefully (Inngest retries automatically)
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`

### CREATE `/app/src/server/routers/brainstorm.ts`

- **IMPLEMENT**: tRPC router for brainstorm operations
- **PATTERN**: Mirror projects.ts router structure (lines 1-100)
```typescript
import { router, orgProcedure } from '../trpc'
import { z } from 'zod'
import { BrainstormInputSchema, SeedElaborationInputSchema } from '@/lib/schemas/brainstorm'
import { generateBrainstormSession, getBrainstormStatus } from '../services/brainstorm-generator'
import { elaborateSeed } from '@/lib/ai/chains/seed-elaboration'
import type { ElaborationMessage } from '@/lib/types/brainstorm'

export const brainstormRouter = router({
  // Generate new brainstorm session
  generate: orgProcedure
    .input(BrainstormInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { sessionId } = await generateBrainstormSession(
        input,
        ctx.orgId,
        ctx.userId
      )

      return { sessionId }
    }),

  // Get generation status (for polling)
  getStatus: orgProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await getBrainstormStatus(input.sessionId, ctx.orgId)
    }),

  // List all saved seeds
  listSavedSeeds: orgProcedure.query(async ({ ctx }) => {
    const seeds = await ctx.prisma.seed.findMany({
      where: {
        tenantId: ctx.orgId,
        userId: ctx.userId,
        isSaved: true,
        isDismissed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return seeds
  }),

  // Get single seed by ID
  getSeedById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const seed = await ctx.prisma.seed.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          elaborations: true,
        },
      })

      if (!seed) {
        throw new Error('Seed not found')
      }

      return seed
    }),

  // Save a seed
  saveSeed: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.seed.updateMany({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        data: {
          isSaved: true,
        },
      })

      if (updated.count === 0) {
        throw new Error('Seed not found or unauthorized')
      }

      return { success: true }
    }),

  // Dismiss a seed
  dismissSeed: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.seed.updateMany({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        data: {
          isDismissed: true,
        },
      })

      if (updated.count === 0) {
        throw new Error('Seed not found or unauthorized')
      }

      return { success: true }
    }),

  // Elaborate seed with conversation
  elaborate: orgProcedure
    .input(SeedElaborationInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Load seed
      const seed = await ctx.prisma.seed.findFirst({
        where: {
          id: input.seedId,
          tenantId: ctx.orgId,
        },
        include: {
          elaborations: true,
        },
      })

      if (!seed) {
        throw new Error('Seed not found')
      }

      // Get or create elaboration
      let elaboration = seed.elaborations[0]
      if (!elaboration) {
        elaboration = await ctx.prisma.seedElaboration.create({
          data: {
            seedId: seed.id,
            tenantId: ctx.orgId,
            conversationHistory: [],
            currentSeedState: seed.currentVersion || {
              title: seed.title,
              description: seed.description,
              approvalLikelihood: seed.approvalLikelihood,
            },
          },
        })
      }

      // Run AI elaboration
      const currentSeed = elaboration.currentSeedState as any
      const history = elaboration.conversationHistory as ElaborationMessage[]

      const response = await elaborateSeed(
        currentSeed,
        history,
        input.userMessage
      )

      // Update conversation history
      const updatedHistory = [
        ...history,
        {
          role: 'user' as const,
          content: input.userMessage,
          timestamp: new Date(),
        },
        {
          role: 'assistant' as const,
          content: response.message,
          timestamp: new Date(),
          appliedChanges: response.updatedSeed,
        },
      ]

      // Save updated elaboration
      await ctx.prisma.seedElaboration.update({
        where: { id: elaboration.id },
        data: {
          conversationHistory: updatedHistory as any,
          currentSeedState: response.updatedSeed as any,
        },
      })

      // Update seed
      await ctx.prisma.seed.update({
        where: { id: seed.id },
        data: {
          currentVersion: response.updatedSeed as any,
          approvalLikelihood: response.updatedApprovalLikelihood,
          elaborationCount: { increment: 1 },
        },
      })

      return response
    }),

  // Delete a seed
  deleteSeed: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.prisma.seed.deleteMany({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (deleted.count === 0) {
        throw new Error('Seed not found or unauthorized')
      }

      return { success: true }
    }),
})
```
- **PATTERN**: All procedures use orgProcedure for multi-tenancy
- **GOTCHA**: elaborations relation is unique (one per seed), check existence before creating
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`

### UPDATE `/app/src/server/routers/_app.ts`

- **ADD**: Import and register brainstorm router
- **PATTERN**: Add to existing router (preserve import order - use `# ruff: noqa: I001` comment if needed)
- **IMPLEMENT**:
```typescript
import { brainstormRouter } from './brainstorm'

export const appRouter = router({
  projects: projectsRouter,
  programmes: programmesRouter,
  brainstorm: brainstormRouter, // Add this line
})
```
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`

### UPDATE `/app/src/inngest/client.ts`

- **ADD**: Register new Inngest function
- **PATTERN**: Import and include in functions array
- **IMPLEMENT**:
```typescript
import { generateSeedsJob } from './functions/generate-seeds'

// Add to functions array
export const functions = [
  generateProjectFromIdea,
  generateProgramme,
  generateSeedsJob, // Add this
]
```
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`

### CREATE `/app/src/app/(dashboard)/brainstorm/page.tsx`

- **IMPLEMENT**: Seed Factory main interface
- **PATTERN**: Mirror projects/new/page.tsx wizard pattern (lines 1-150)
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { trpc } from '@/lib/trpc/client'
import { Sparkles, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'
import SeedCard from '@/components/brainstorm/SeedCard'

export default function BrainstormPage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [creativityTemp, setCreativityTemp] = useState(0.9)
  const [seedCount, setSeedCount] = useState(10)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const generateMutation = trpc.brainstorm.generate.useMutation()
  const { data: generationStatus } = trpc.brainstorm.getStatus.useQuery(
    { sessionId: sessionId! },
    {
      enabled: !!sessionId,
      refetchInterval: (query) =>
        query.state.data?.status === 'IN_PROGRESS' ? 2000 : false,
    }
  )

  const saveSeedMutation = trpc.brainstorm.saveSeed.useMutation()
  const dismissSeedMutation = trpc.brainstorm.dismissSeed.useMutation()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    try {
      toast.info('Starting seed generation...')
      const result = await generateMutation.mutateAsync({
        prompt,
        creativityTemp,
        seedCount,
      })
      setSessionId(result.sessionId)
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error('Failed to generate seeds. Please try again.')
    }
  }

  const handleSaveSeed = async (seedId: string) => {
    try {
      await saveSeedMutation.mutateAsync({ id: seedId })
      toast.success('Seed saved to your garden!')
    } catch (error) {
      toast.error('Failed to save seed')
    }
  }

  const handleDismissSeed = async (seedId: string) => {
    try {
      await dismissSeedMutation.mutateAsync({ id: seedId })
      toast.success('Seed dismissed')
    } catch (error) {
      toast.error('Failed to dismiss seed')
    }
  }

  const isGenerating = sessionId && generationStatus?.status === 'IN_PROGRESS'
  const isCompleted = sessionId && generationStatus?.status === 'COMPLETED'

  if (isGenerating) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold">Cooking Up Creative Ideas...</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Our AI is brainstorming {seedCount} unique project seeds. This may take 15-30 seconds.
          </p>
          <Progress value={60} className="mt-6 h-2" />
        </Card>
      </div>
    )
  }

  if (isCompleted && generationStatus?.seeds) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Seeds Are Ready!</h1>
            <p className="mt-2 text-zinc-600">
              Found {generationStatus.seeds.length} creative ideas. Save the ones that spark your interest.
            </p>
          </div>
          <Button variant="outline" onClick={() => setSessionId(null)}>
            Generate More
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {generationStatus.seeds.map((seed) => (
            <SeedCard
              key={seed.id}
              seed={seed}
              onSave={() => handleSaveSeed(seed.id)}
              onDismiss={() => handleDismissSeed(seed.id)}
              onElaborate={() => router.push(`/seeds/${seed.id}`)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-8">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle className="text-2xl">AI Brainstorming Playground</CardTitle>
              <CardDescription className="mt-2">
                Describe a feeling, mood, or theme, and we'll generate creative project seeds for you to explore
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-0">
          <div>
            <Label htmlFor="prompt">What are you in the mood for?</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'something warm and adventurous with lots of movement' or 'a project about rediscovering childhood wonder' or 'minimal, zen, focused on breath'"
              className="mt-2 min-h-[120px]"
            />
            <p className="mt-2 text-sm text-zinc-500">
              Be as vague or specific as you like. The more creative the prompt, the more surprising the results!
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="seed-count">Number of Seeds</Label>
              <span className="text-sm font-medium text-zinc-700">{seedCount}</span>
            </div>
            <Slider
              id="seed-count"
              value={[seedCount]}
              onValueChange={(values) => setSeedCount(values[0])}
              min={5}
              max={15}
              step={1}
              className="mt-2"
            />
            <p className="mt-2 text-sm text-zinc-500">
              How many ideas should we generate? More seeds = more variety.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="creativity">Creativity Level</Label>
              <span className="text-sm font-medium text-zinc-700">
                {creativityTemp < 0.5 ? 'Safe' : creativityTemp < 0.8 ? 'Balanced' : 'Wild'}
              </span>
            </div>
            <Slider
              id="creativity"
              value={[creativityTemp]}
              onValueChange={(values) => setCreativityTemp(values[0])}
              min={0.3}
              max={1.0}
              step={0.1}
              className="mt-2"
            />
            <p className="mt-2 text-sm text-zinc-500">
              Lower = proven concepts. Higher = experimental and unexpected ideas.
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 shrink-0 text-blue-600" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">How this works:</p>
                <p className="mt-1">
                  We'll generate {seedCount} unique project seeds based on your prompt. Each seed includes a title,
                  description, and feasibility score. Save the ones you like to your Seed Garden, or elaborate on
                  them right away.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || generateMutation.isPending}
            size="lg"
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Seeds
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```
- **PATTERN**: Form → Generate → Loading → Results grid (mirrors project wizard)
- **GOTCHA**: Use `'use client'` directive for hooks and state
- **VALIDATE**: Check page compiles and imports resolve

### CREATE `/app/src/components/brainstorm/SeedCard.tsx`

- **IMPLEMENT**: Seed display card component
- **PATTERN**: Mirror ProjectCard component structure
```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Trash2, MessageSquare } from 'lucide-react'
import type { Seed } from '@prisma/client'
import ApprovalLikelihoodMeter from './ApprovalLikelihoodMeter'

interface SeedCardProps {
  seed: Seed
  onSave: () => void
  onDismiss: () => void
  onElaborate: () => void
  showActions?: boolean
}

export default function SeedCard({
  seed,
  onSave,
  onDismiss,
  onElaborate,
  showActions = true,
}: SeedCardProps) {
  const currentVersion = seed.currentVersion as any

  return (
    <Card className="group relative flex flex-col transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg leading-tight">{seed.title}</CardTitle>
          <ApprovalLikelihoodMeter value={seed.approvalLikelihood} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <CardDescription className="line-clamp-4 text-sm leading-relaxed">
          {seed.description}
        </CardDescription>

        {currentVersion?.suggestedTags && currentVersion.suggestedTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {currentVersion.suggestedTags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {seed.elaborationCount > 0 && (
          <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
            <MessageSquare className="h-3 w-3" />
            <span>{seed.elaborationCount} elaborations</span>
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="gap-2 pt-4">
          <Button variant="outline" size="sm" onClick={onDismiss} className="flex-1">
            <Trash2 className="mr-2 h-4 w-4" />
            Pass
          </Button>
          <Button variant="default" size="sm" onClick={onSave} className="flex-1">
            <Heart className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="secondary" size="sm" onClick={onElaborate} className="flex-1">
            <MessageSquare className="mr-2 h-4 w-4" />
            Elaborate
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
```
- **IMPORTS**: shadcn/ui components, icons from lucide-react
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`

### CREATE `/app/src/components/brainstorm/ApprovalLikelihoodMeter.tsx`

- **IMPLEMENT**: Visual feasibility indicator
```typescript
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ApprovalLikelihoodMeterProps {
  value: number // 0.0-1.0
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function ApprovalLikelihoodMeter({
  value,
  size = 'md',
  showLabel = false,
}: ApprovalLikelihoodMeterProps) {
  const percentage = Math.round(value * 100)

  const getColor = () => {
    if (value >= 0.8) return 'bg-green-500'
    if (value >= 0.6) return 'bg-blue-500'
    if (value >= 0.4) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getLabel = () => {
    if (value >= 0.8) return 'Highly Likely'
    if (value >= 0.6) return 'Good Potential'
    if (value >= 0.4) return 'Needs Work'
    return 'Ambitious'
  }

  const sizeClasses = {
    sm: 'h-2 w-16',
    md: 'h-3 w-24',
    lg: 'h-4 w-32',
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {showLabel && (
        <span className="text-xs font-medium text-zinc-600">{getLabel()}</span>
      )}
      <div className={cn('overflow-hidden rounded-full bg-zinc-200', sizeClasses[size])}>
        <div
          className={cn('h-full transition-all', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500">{percentage}%</span>
    </div>
  )
}
```
- **PATTERN**: Color-coded meter showing feasibility
- **VALIDATE**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`

### CREATE `/app/src/app/(dashboard)/seeds/page.tsx`

- **IMPLEMENT**: Seed Garden list view
- **PATTERN**: Mirror projects/page.tsx list pattern
```typescript
'use client'

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { trpc } from '@/lib/trpc/client'
import { Loader2, Sprout, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import SeedCard from '@/components/brainstorm/SeedCard'

export default function SeedGardenPage() {
  const router = useRouter()
  const { data: seeds, isLoading } = trpc.brainstorm.listSavedSeeds.useQuery()

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!seeds || seeds.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-12 text-center">
          <Sprout className="mx-auto h-16 w-16 text-zinc-300" />
          <h2 className="mt-4 text-2xl font-semibold">Your Seed Garden is Empty</h2>
          <p className="mt-2 text-zinc-600">
            Start brainstorming to grow some creative project seeds. Save the ones you like and elaborate on them
            whenever inspiration strikes.
          </p>
          <Button onClick={() => router.push('/brainstorm')} className="mt-6">
            <Plus className="mr-2 h-5 w-5" />
            Generate Your First Seeds
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Seed Garden</h1>
          <p className="mt-2 text-zinc-600">
            {seeds.length} saved {seeds.length === 1 ? 'seed' : 'seeds'} waiting to be cultivated
          </p>
        </div>
        <Button onClick={() => router.push('/brainstorm')}>
          <Plus className="mr-2 h-5 w-5" />
          Generate More Seeds
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {seeds.map((seed) => (
          <SeedCard
            key={seed.id}
            seed={seed}
            onSave={() => {}}
            onDismiss={() => {}}
            onElaborate={() => router.push(`/seeds/${seed.id}`)}
            showActions={false}
          />
        ))}
      </div>
    </div>
  )
}
```
- **PATTERN**: Loading → Empty state → Grid display
- **VALIDATE**: Check imports and routing

### CREATE `/app/src/app/(dashboard)/seeds/[id]/page.tsx`

- **IMPLEMENT**: Seed Elaboration workspace
- **PATTERN**: Split-screen layout (preview + chat)
```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/lib/trpc/client'
import { Loader2, Send, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import ApprovalLikelihoodMeter from '@/components/brainstorm/ApprovalLikelihoodMeter'
import type { ElaborationMessage } from '@/lib/types/brainstorm'

export default function SeedElaborationPage() {
  const router = useRouter()
  const params = useParams()
  const seedId = params.id as string

  const [userMessage, setUserMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: seed, isLoading } = trpc.brainstorm.getSeedById.useQuery({ id: seedId })
  const elaborateMutation = trpc.brainstorm.elaborate.useMutation({
    onSuccess: () => {
      setUserMessage('')
      // Refetch seed to get updated data
      trpc.brainstorm.getSeedById.useQuery.invalidate({ id: seedId })
    },
  })

  const currentVersion = seed?.currentVersion as any
  const conversationHistory = (seed?.elaborations?.[0]?.conversationHistory || []) as ElaborationMessage[]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationHistory])

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return

    try {
      await elaborateMutation.mutateAsync({
        seedId,
        userMessage,
      })
    } catch (error) {
      toast.error('Failed to elaborate seed')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!seed) {
    return <div>Seed not found</div>
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Elaborate Seed</h1>
        <Button onClick={() => router.push('/projects/new')} variant="default">
          <ArrowRight className="mr-2 h-5 w-5" />
          Turn into Project
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview Panel */}
        <Card className="lg:sticky lg:top-6 lg:h-fit">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl">Live Preview</CardTitle>
              <ApprovalLikelihoodMeter value={seed.approvalLikelihood} size="md" showLabel />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">Title</label>
              <p className="mt-1 text-lg font-semibold">{currentVersion?.title || seed.title}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">Description</label>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                {currentVersion?.description || seed.description}
              </p>
            </div>

            {currentVersion?.suggestedTags && (
              <div>
                <label className="text-sm font-medium text-zinc-700">Tags</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {currentVersion.suggestedTags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card className="flex flex-col" style={{ height: '600px' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Collaborate with AI
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col">
            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto pb-4">
              {conversationHistory.length === 0 && (
                <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                  <p className="font-medium">Start refining your seed!</p>
                  <p className="mt-1">
                    Try: "Make it more focused on digital skills" or "Add a sustainability angle" or "What activities
                    would work for this?"
                  </p>
                </div>
              )}

              {conversationHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'ml-8 bg-blue-100 text-blue-900'
                      : 'mr-8 bg-zinc-100 text-zinc-900'
                  }`}
                >
                  <p className="text-sm font-medium">{msg.role === 'user' ? 'You' : 'AI Assistant'}</p>
                  <p className="mt-1 text-sm">{msg.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 border-t pt-4">
              <Textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Ask for changes, suggestions, or ideas..."
                className="min-h-[80px] resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!userMessage.trim() || elaborateMutation.isPending}
                size="lg"
                className="self-end"
              >
                {elaborateMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```
- **PATTERN**: Split layout with sticky preview, scrolling chat
- **GOTCHA**: Use `useParams()` for dynamic route ID, not `useRouter().query`
- **VALIDATE**: Check component compiles and routing works

### UPDATE `/app/src/components/layout/Sidebar.tsx`

- **ADD**: Navigation links for Brainstorm and Seeds
- **PATTERN**: Add to existing navigation array
```typescript
const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Brainstorm', href: '/brainstorm', icon: Sparkles }, // Add
  { name: 'Seed Garden', href: '/seeds', icon: Sprout },        // Add
  { name: 'Settings', href: '/settings', icon: Settings },
]
```
- **IMPORTS**: `import { Sparkles, Sprout } from 'lucide-react'`
- **VALIDATE**: Check sidebar renders with new links

### CREATE validation test script

- **IMPLEMENT**: Test imports and type checking
- **COMMAND**: `cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit`
- **VALIDATE**: Zero TypeScript errors

### RUN database migration

- **COMMAND**: `cd /worktrees/openhorizon.cc/issue-3/app && npx prisma migrate deploy`
- **GOTCHA**: Ensure DATABASE_URL points to correct database
- **VALIDATE**: Check migration applied successfully

### TEST complete user flow manually

- **VALIDATE STEPS**:
  1. Navigate to /brainstorm
  2. Enter a creative prompt (e.g., "projects about ocean conservation with lots of hands-on activities")
  3. Adjust creativity and count sliders
  4. Click "Generate Seeds"
  5. Wait for generation (should take 15-30s)
  6. Review generated seeds
  7. Click "Save" on 2-3 seeds
  8. Navigate to /seeds (Seed Garden)
  9. Verify saved seeds appear
  10. Click "Elaborate" on one seed
  11. Send a message: "Make it more focused on youth leadership"
  12. Verify AI responds with suggestions
  13. Check preview updates with changes
  14. Send another message: "Add a digital component"
  15. Verify conversation continues
  16. Check approval likelihood meter updates
  17. Click "Turn into Project" button
  18. Verify redirects to project creation wizard

---

## TESTING STRATEGY

### Unit Tests (Optional for MVP)

**Scope**: AI chains, service layer functions, utility functions

**Example Test**:
```typescript
// tests/lib/ai/chains/seed-generation.test.ts
import { generateSeeds } from '@/lib/ai/chains/seed-generation'

describe('generateSeeds', () => {
  it('generates seeds with valid structure', async () => {
    const input = {
      prompt: 'environmental projects',
      creativityTemp: 0.9,
      seedCount: 5,
    }

    const seeds = await generateSeeds(input)

    expect(seeds).toHaveLength(5)
    expect(seeds[0]).toHaveProperty('title')
    expect(seeds[0]).toHaveProperty('description')
    expect(seeds[0].approvalLikelihood).toBeGreaterThanOrEqual(0)
    expect(seeds[0].approvalLikelihood).toBeLessThanOrEqual(1)
  })
})
```

### Integration Tests

**Scope**: End-to-end flows through tRPC API

**Test Cases**:
1. Generate brainstorm session → Poll status → Retrieve seeds
2. Save seed → List saved seeds → Verify presence
3. Elaborate seed → Send message → Verify response structure
4. Dismiss seed → List saved seeds → Verify absence

### Edge Cases

**Test Scenarios**:
1. **Empty prompt**: Should show validation error
2. **Very long prompt** (>1000 chars): Should truncate or reject
3. **Generation failure**: Should update session status to FAILED
4. **Concurrent elaborations**: Should handle race conditions
5. **Deleted seed elaboration**: Should handle gracefully
6. **No AI response**: Should timeout and show error

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Import Validation (CRITICAL)

**Verify all imports resolve before running tests:**

```bash
cd /worktrees/openhorizon.cc/issue-3/app && npx tsc --noEmit
```

**Expected:** Zero TypeScript errors

**Why:** Catches incorrect imports, missing types, and compilation errors immediately.

### Level 2: Syntax & Style

**Run linting:**

```bash
cd /worktrees/openhorizon.cc/issue-3/app && npm run lint
```

**Expected:** Zero linting errors (warnings acceptable)

### Level 3: Database Schema Validation

**Check Prisma schema:**

```bash
cd /worktrees/openhorizon.cc/issue-3/app && npx prisma validate
```

**Expected:** "The schema is valid"

**Check migrations:**

```bash
cd /worktrees/openhorizon.cc/issue-3/app && npx prisma migrate status
```

**Expected:** All migrations applied

### Level 4: Build Validation

**Test production build:**

```bash
cd /worktrees/openhorizon.cc/issue-3/app && npm run build
```

**Expected:** Build completes successfully with zero errors

### Level 5: Manual Validation

**Start development server:**

```bash
cd /worktrees/openhorizon.cc/issue-3/app && npm run dev
```

**Test complete flow:**
1. Open http://localhost:3000/brainstorm
2. Generate seeds with various prompts and settings
3. Save/dismiss seeds
4. Navigate to /seeds
5. Elaborate on seeds via chat
6. Verify preview updates in real-time
7. Check approval likelihood changes
8. Test "Turn into Project" transition

**API Validation:**

Use browser DevTools Network tab to verify:
- tRPC calls succeed (200 status)
- Polling works correctly (2s interval during IN_PROGRESS)
- Session IDs are valid UUIDs
- Multi-tenancy filters work (check query params)

---

## ACCEPTANCE CRITERIA

- [x] Users can generate 5-15 creative seeds from a mood/theme prompt
- [x] Creativity temperature control (0.3-1.0) affects AI output variety
- [x] Seeds display title, description, approval likelihood meter
- [x] Users can save seeds to personal Seed Garden
- [x] Users can dismiss seeds they don't like
- [x] Seed Garden shows all saved seeds in grid layout
- [x] Users can elaborate seeds through conversational AI chat
- [x] Elaboration workspace has split-screen preview + chat layout
- [x] Preview updates in real-time as seed is refined
- [x] Approval likelihood adjusts based on changes
- [x] Conversation history persists across sessions
- [x] Users can transition from elaborated seed to project creation
- [x] All operations respect multi-tenancy (org-scoped)
- [x] Background generation completes in 15-30 seconds
- [x] Polling updates UI smoothly without blocking
- [x] TypeScript compilation succeeds with zero errors
- [x] Build process completes successfully
- [x] Database migrations apply cleanly

---

## COMPLETION CHECKLIST

- [ ] All Prisma models created and migrated
- [ ] All Zod schemas defined with proper validation
- [ ] AI chains implemented with appropriate temperatures
- [ ] Prompts engineered with Erasmus+ context
- [ ] Inngest background job registered and working
- [ ] tRPC router created with all CRUD operations
- [ ] Multi-tenancy checks in every database query
- [ ] Seed Factory page functional with generation
- [ ] Seed Garden page displays saved seeds
- [ ] Seed Elaboration page enables chat-based refinement
- [ ] SeedCard component renders with actions
- [ ] ApprovalLikelihoodMeter displays color-coded feasibility
- [ ] Navigation links added to sidebar
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] Database schema validates
- [ ] Production build succeeds
- [ ] Manual testing confirms complete flow works
- [ ] Edge cases handled gracefully
- [ ] Error states display helpful messages
- [ ] Loading states provide feedback during AI generation

---

## NOTES

### Design Decisions

**Why Background Jobs (Inngest)?**
AI generation takes 15-30 seconds, which exceeds acceptable API response times. Inngest provides:
- Automatic retries on failure
- Step-based execution for reliability
- Progress tracking
- Scalability for concurrent sessions

**Why Dual Storage (Seed + Elaboration)?**
Separating base seed data from elaboration history allows:
- Multiple elaboration sessions per seed (future enhancement)
- Efficient querying of saved seeds without loading conversation history
- Version tracking of seed evolution
- Cleaner data model

**Why High Temperature for Seed Generation?**
Brainstorming phase prioritizes creativity and variety over precision. Temperature 0.9-1.0 produces:
- Unexpected combinations and ideas
- Diverse approaches to the same theme
- Serendipitous discoveries
- Playful, inspiring outputs

**Why Lower Temperature for Elaboration?**
Conversational refinement requires consistency and coherence. Temperature 0.7 balances:
- Creative suggestions
- Logical responses to user requests
- Stable conversation flow
- Reliable structured output

### Implementation Trade-offs

**Chosen**: Single elaboration per seed (unique constraint)
**Alternative**: Multiple elaboration sessions per seed
**Rationale**: Simpler UX for MVP, can be enhanced later

**Chosen**: Store full seed as JSON in `currentVersion`
**Alternative**: Individual columns for each seed field
**Rationale**: Flexibility for future seed schema evolution, easier to extend

**Chosen**: Inline approval likelihood meter
**Alternative**: Separate detailed feasibility breakdown
**Rationale**: Quick visual feedback is sufficient for ideation phase

### Future Enhancements (Out of Scope)

- **Seed Sharing**: Share seeds with team members or community
- **Seed Templates**: Pre-built seed templates for common themes
- **Collaborative Elaboration**: Multiple users refining the same seed
- **Elaboration Branching**: Try different refinement paths in parallel
- **Auto-Save to Garden**: Automatically save high-likelihood seeds
- **Export Seeds**: Export seeds as PDF or markdown
- **Seed Analytics**: Track which seeds become successful projects
- **AI Suggestions Voting**: Rate AI suggestions to improve quality
- **Seed Merging**: Combine elements from multiple seeds

### External Resources Referenced

Research conducted on 2025-12-20:

**Form & State Management:**
- [React Hook Form Multi-Step Forms](https://react-hook-form.com/advanced-usage)
- [Managing State in Multi-Step Forms](https://birdeatsbug.com/blog/managing-state-in-a-multi-step-form)
- [Zustand Multi-Step Form Discussion](https://github.com/orgs/react-hook-form/discussions/6382)

**AI & Creative Tools:**
- [UX Pilot AI Design Assistant](https://uxpilot.ai/)
- [Visual Electric Creative Ideation](https://www.uxpin.com/studio/blog/ai-tools-for-designers/)
- [Google Stitch Experimental AI](https://www.unite.ai/best-ai-ux-ui-design-tools/)

**Technical Patterns:**
- [tRPC with Next.js 15 App Router](https://www.wisp.blog/blog/how-to-use-trpc-with-nextjs-15-app-router)
- [LangChain Structured Output](https://python.langchain.com/docs/concepts/structured_outputs/)
- [Temperature in Prompt Engineering](https://www.analyticsvidhya.com/blog/2024/07/temperature-in-prompt-engineering/)
- [Next.js Dynamic Routes](https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes)

---

**Total Estimated Lines of Code**: ~2,800 lines
**Estimated Implementation Time**: 8-12 hours for experienced developer
**Confidence Score**: 8.5/10 for one-pass implementation success

This plan provides all necessary context, patterns, and step-by-step instructions to implement the Brainstorming Playground feature successfully. The comprehensive prompts, clear AI chain patterns, and detailed task breakdown should enable smooth execution.
