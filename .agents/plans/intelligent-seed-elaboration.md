# Feature: Intelligent Seed Elaboration System - AI-Driven Project Planning

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Transform the seed elaboration process from a manual, blank-canvas experience into an **intelligent, AI-driven requirements-gathering conversation** that automatically generates complete project skeletons with phases, timeline, budget allocation, and pre-filled checklists.

Currently, seeds are minimal and seed elaboration is limited to conversational refinement. This feature will extend the elaboration process to:
1. Gather rich metadata through progressive AI questioning
2. Validate against Erasmus+ requirements
3. Auto-generate complete PipelineProject with phases
4. Calculate timeline based on duration/dates
5. Allocate budget intelligently across phases
6. Pre-populate checklists (visas, permits, insurance)
7. Integrate phase-specific AI agents with context

## User Story

As a **project coordinator**
I want to **convert a project seed into a complete project structure through an AI-guided conversation**
So that **I can go from idea to execution-ready project in under 15 minutes without manual setup**

## Problem Statement

**Current Pain Points:**
- Seeds have minimal information (just title + description)
- Seed elaboration provides conversational refinement but doesn't gather structured metadata
- Converting seed → PipelineProject creates empty structure
- Users must manually create each phase
- No guidance on timeline, budget distribution, or requirements
- High friction leads to abandoned projects
- No automatic requirements detection (visas, insurance, etc.)

**Impact:**
- Low seed-to-project conversion rate
- Time-consuming manual setup
- Incomplete project planning
- Missed Erasmus+ compliance requirements

## Solution Statement

Build an **AI-powered project consultant** that:
1. Conducts progressive requirements-gathering conversation
2. Collects rich metadata (participants, budget, destination, requirements)
3. Validates against Erasmus+ rules
4. Auto-generates complete PipelineProject with:
   - Calculated timeline with phases
   - Intelligent budget allocation (30% travel, 25% accommodation, etc.)
   - Pre-generated phases (Travel, Accommodation, Food, Activities, Emergency)
   - Auto-populated checklists
   - Phase-specific AI agents pre-seeded with project context
5. Reduces time-to-first-project from hours to <15 minutes

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: High
**Primary Systems Affected**:
- Seed elaboration (existing)
- PipelineProject generation (new)
- AI agents (integration enhancement)
- Database schema (additions)

**Dependencies**:
- @langchain/openai (existing)
- Prisma ORM (existing)
- Existing seed elaboration infrastructure
- Existing AI agents (Travel, Food, Accommodation, Activities, Emergency)

**GitHub Workflow:**
- **Branch Name**: `feature/intelligent-seed-elaboration` (already on issue-96)
- **PR Title**: `feat: Add intelligent seed elaboration with auto-project generation`
- **Linked Issue**: #96

---

## CONTEXT REFERENCES

### Relevant Codebase Files - IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

**Existing Seed Elaboration:**
- `app/src/lib/ai/chains/seed-elaboration.ts` - Current elaboration chain
- `app/src/lib/ai/prompts/seed-elaboration.ts` - Existing prompt template
- `app/src/server/routers/brainstorm.ts` (lines 110-180) - Elaborate endpoint
- `app/src/lib/types/brainstorm.ts` - Seed types
- `app/src/lib/schemas/brainstorm.ts` - Zod schemas

**AI Agents:**
- `app/src/lib/ai/agents/base-agent.ts` - Base agent class structure
- `app/src/lib/ai/agents/travel-agent.ts` - Travel agent pattern
- `app/src/lib/ai/agents/food-agent.ts` - Food agent pattern
- `app/src/lib/ai/agents/accommodation-agent.ts` - Accommodation agent pattern
- `app/src/lib/ai/agents/activities-agent.ts` - Activities agent pattern
- `app/src/lib/ai/agents/emergency-agent.ts` - Emergency agent pattern
- `app/src/lib/ai/agents/registry.ts` - Agent registration

**Pipeline Project:**
- `app/src/server/routers/pipeline/projects.ts` (lines 64-98) - Project creation pattern
- `app/src/server/routers/pipeline/phases.ts` - Phase management
- `app/prisma/schema.prisma` (lines 377-427) - PipelineProject model
- `app/prisma/schema.prisma` (lines 419-460) - PipelinePhase model
- `app/prisma/schema.prisma` (lines 317-352) - Seed model
- `app/prisma/schema.prisma` (lines 353-371) - SeedElaboration model

**Erasmus+ Calculations:**
- `app/src/lib/erasmus/budget-calculator.ts` - Budget calculation logic
- `app/src/lib/erasmus/income-calculator.ts` - Grant calculations
- `app/src/lib/erasmus/distance-calculator.ts` - Travel distance
- `app/src/lib/erasmus/geocoding.ts` - Location services
- `app/src/lib/erasmus/unit-costs.ts` - EU unit costs

### New Files to Create

**Backend Services:**
- `app/src/server/services/intelligent-seed-elaborator.ts` - Main orchestrator for enhanced elaboration
- `app/src/server/services/project-auto-generator.ts` - Auto-generate projects from elaborated seeds
- `app/src/server/services/timeline-generator.ts` - Calculate phase timeline
- `app/src/server/services/budget-allocator.ts` - Distribute budget across phases
- `app/src/server/services/requirements-analyzer.ts` - Detect visas, permits, insurance needs

**AI Prompts:**
- `app/src/lib/ai/prompts/intelligent-elaboration.ts` - Enhanced prompt for metadata gathering
- `app/src/lib/ai/prompts/project-generation.ts` - Prompt for project structure generation

**Types & Schemas:**
- `app/src/lib/types/intelligent-elaboration.ts` - Enhanced types for rich metadata
- `app/src/lib/schemas/intelligent-elaboration.ts` - Zod validation schemas

**Tests:**
- `app/src/__tests__/services/project-auto-generator.test.ts` - Unit tests for generator
- `app/src/__tests__/services/timeline-generator.test.ts` - Timeline calculation tests
- `app/src/__tests__/services/budget-allocator.test.ts` - Budget allocation tests

### Relevant Documentation - YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [LangChain Structured Outputs](https://js.langchain.com/docs/modules/model_io/output_parsers/types/structured)
  - Section: StructuredOutputParser with Zod
  - Why: Used for extracting structured metadata from conversations

- [Prisma Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
  - Section: Interactive transactions
  - Why: Project generation requires atomic multi-model creation

- [Prisma JSONB Queries](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json)
  - Section: Working with JSON fields
  - Why: Metadata and checklist storage

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
  - Section: Structured outputs
  - Why: Alternative approach for metadata extraction

### Patterns to Follow

**Naming Conventions:**
From existing codebase (snake_case for DB, camelCase for TypeScript):
```typescript
// Database columns (from schema.prisma)
participant_count, start_date, end_date, budget_total

// TypeScript variables
participantCount, startDate, endDate, budgetTotal
```

**Error Handling:**
From `app/src/lib/ai/chains/seed-elaboration.ts`:
```typescript
try {
  const result = await chain.invoke({...})
  return result as ElaborationResponse
} catch (error) {
  console.error('❌ Error elaborating seed:', error)
  throw new Error('Failed to elaborate seed')
}
```

**Logging Pattern:**
From AI agents:
```typescript
console.log('✅ [Service] Action completed', { context })
console.error('❌ [Service] Action failed', { error, context })
```

**TRPC Procedure Pattern:**
From `app/src/server/routers/brainstorm.ts`:
```typescript
elaborate: orgProcedure
  .input(SeedElaborationInputSchema)
  .mutation(async ({ ctx, input }) => {
    // 1. Validate access
    // 2. Load data
    // 3. Process with AI
    // 4. Update database
    // 5. Return result
  })
```

**Prisma Transaction Pattern:**
From existing patterns:
```typescript
await ctx.prisma.$transaction(async (tx) => {
  const project = await tx.pipelineProject.create({...})
  const phases = await tx.pipelinePhase.createMany({...})
  return { project, phases }
})
```

**AI Chain Pattern:**
From `app/src/lib/ai/chains/seed-elaboration.ts`:
```typescript
const model = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
})

const parser = StructuredOutputParser.fromZodSchema(Schema)
const prompt = PromptTemplate.fromTemplate(PROMPT_TEMPLATE)
const chain = prompt.pipe(model).pipe(parser)

const result = await chain.invoke({ variables })
```

**Agent Integration Pattern:**
From `app/src/lib/ai/agents/registry.ts`:
```typescript
export function getAgentForPhase(phaseType: PhaseType): BaseAgent {
  switch (phaseType) {
    case 'TRAVEL': return new TravelAgent()
    case 'ACCOMMODATION': return new AccommodationAgent()
    // ...
  }
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Database Schema Extensions

Add metadata support to Seed model and project generation tracking.

**Tasks:**
- Add `metadata` JSONB column to `seed` table
- Add `checklist` JSONB column to `pipeline_phase` table
- Add `auto_generated` boolean to `pipeline_phase` table
- Add `generated_from_seed_id` UUID to `pipeline_project` table
- Create migration file

### Phase 2: Enhanced Elaboration Logic

Extend existing seed elaboration to gather rich metadata through progressive questioning.

**Tasks:**
- Create intelligent elaboration prompt with metadata focus
- Implement metadata extraction with structured outputs
- Add validation against Erasmus+ requirements
- Create requirements analyzer service
- Extend elaboration response types

### Phase 3: Project Auto-Generation Engine

Core logic to transform elaborated seed into complete PipelineProject.

**Tasks:**
- Implement project auto-generator service
- Create timeline generator (phase dates calculation)
- Create budget allocator (intelligent distribution)
- Generate default phases (Travel, Accommodation, Food, Activities, Emergency)
- Auto-populate phase checklists based on requirements

### Phase 4: Integration & API

Connect elaboration to project generation and expose via TRPC.

**Tasks:**
- Add TRPC endpoint: `generateProjectFromSeed`
- Integrate with existing elaboration flow
- Add agent pre-seeding with project context
- Update brainstorm router

### Phase 5: Testing & Validation

Comprehensive testing of the end-to-end flow.

**Tasks:**
- Unit tests for each service
- Integration tests for seed → project flow
- Test Erasmus+ validation logic
- Test budget allocation algorithms
- Manual E2E testing

---

## STEP-BY-STEP TASKS

### Task 1: CREATE database migration for metadata support

- **IMPLEMENT**: Add Prisma schema changes for metadata tracking
- **PATTERN**: Follow existing migration pattern in `app/prisma/migrations/`
- **CHANGES**:
  ```prisma
  model Seed {
    // ... existing fields ...
    metadata Json? // Rich metadata from elaboration
  }

  model PipelinePhase {
    // ... existing fields ...
    checklist Json? // Auto-generated checklist items
    autoGenerated Boolean @default(false) @map("auto_generated")
  }

  model PipelineProject {
    // ... existing fields ...
    generatedFromSeedId String? @map("generated_from_seed_id") @db.Uuid
    seed Seed? @relation(fields: [generatedFromSeedId], references: [id], onDelete: SetNull)
  }
  ```
- **GOTCHA**: Remember to add relation in Seed model: `generatedProjects PipelineProject[]`
- **VALIDATE**: `npx prisma format && npx prisma validate`

### Task 2: CREATE migration file and apply schema

- **IMPLEMENT**: Generate Prisma migration
- **COMMANDS**:
  ```bash
  cd app
  npx prisma migrate dev --name add_intelligent_seed_elaboration
  ```
- **VALIDATE**: Check `app/prisma/migrations/` for new migration folder

### Task 3: CREATE enhanced metadata types

**File**: `app/src/lib/types/intelligent-elaboration.ts`

- **IMPLEMENT**: Define rich metadata structure
- **PATTERN**: Mirror `app/src/lib/types/brainstorm.ts` structure
- **TYPES TO ADD**:
  ```typescript
  export interface SeedMetadata {
    participantCount: number
    participantAge?: { min: number; max: number }
    participantCountries: string[]
    destination: {
      country: string
      city: string
      coordinates?: { lat: number; lng: number }
    }
    duration: {
      days: number
      startDate?: Date
      endDate?: Date
    }
    budget: {
      total: number
      currency: string
      breakdown?: {
        travel?: number
        accommodation?: number
        food?: number
        activities?: number
        emergency?: number
      }
    }
    requirements: {
      visas?: Array<{ country: string; needed: boolean; notes?: string }>
      insurance: boolean
      permits?: string[]
      accessibility?: string[]
    }
    themes?: string[]
    learningObjectives?: string[]
  }

  export interface IntelligentElaborationResponse {
    message: string // AI response to user
    questionsAsked: string[] // Progressive questions
    metadataExtracted: Partial<SeedMetadata> // Incrementally built
    readyForProjectGeneration: boolean // Has enough info?
    updatedSeed: GeneratedSeed
  }
  ```
- **IMPORTS**: Use existing `GeneratedSeed` from `@/lib/types/brainstorm`
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: CREATE Zod schemas for metadata validation

**File**: `app/src/lib/schemas/intelligent-elaboration.ts`

- **IMPLEMENT**: Zod schemas matching TypeScript types
- **PATTERN**: Mirror `app/src/lib/schemas/brainstorm.ts`
- **SCHEMAS TO ADD**:
  ```typescript
  import { z } from 'zod'

  export const SeedMetadataSchema = z.object({
    participantCount: z.number().int().positive(),
    participantAge: z.object({
      min: z.number().int().min(13),
      max: z.number().int().max(30)
    }).optional(),
    participantCountries: z.array(z.string()),
    destination: z.object({
      country: z.string(),
      city: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      }).optional()
    }),
    // ... continue for all metadata fields
  })

  export const IntelligentElaborationResponseSchema = z.object({
    message: z.string(),
    questionsAsked: z.array(z.string()),
    metadataExtracted: SeedMetadataSchema.partial(),
    readyForProjectGeneration: z.boolean(),
    updatedSeed: z.any() // Use existing GeneratedSeedSchema
  })
  ```
- **VALIDATE**: `npx tsc --noEmit`

### Task 5: CREATE intelligent elaboration prompt

**File**: `app/src/lib/ai/prompts/intelligent-elaboration.ts`

- **IMPLEMENT**: Enhanced prompt for metadata gathering
- **PATTERN**: Similar structure to `app/src/lib/ai/prompts/seed-elaboration.ts`
- **PROMPT STRUCTURE**:
  ```typescript
  export const INTELLIGENT_ELABORATION_PROMPT = `You are an expert Erasmus+ project consultant helping gather requirements for a Youth Exchange project.

  CURRENT SEED STATE:
  {currentSeedJson}

  METADATA COLLECTED SO FAR:
  {metadataJson}

  CONVERSATION HISTORY:
  {conversationHistoryJson}

  USER MESSAGE:
  {userMessage}

  YOUR ROLE:
  Conduct a progressive requirements-gathering conversation. Ask strategic questions to collect:
  1. Participant details (count, age range, countries)
  2. Destination (country, city)
  3. Duration (days, specific dates if known)
  4. Budget (total, currency)
  5. Special requirements (visas, insurance, permits, accessibility)
  6. Themes and learning objectives

  APPROACH:
  - Ask 1-2 questions at a time (not overwhelming)
  - Build on previous answers
  - Provide helpful suggestions when user doesn't know
  - Validate against Erasmus+ rules:
    * Youth ages: 13-30
    * Minimum 16 participants from at least 2 countries
    * Maximum duration: typically 21 days
    * Must include learning objectives
  - Signal when you have enough info for project generation

  RESPONSE FORMAT:
  {format_instructions}

  Be encouraging and guide them toward a successful project application.`
  ```
- **VALIDATE**: Compile check

### Task 6: CREATE requirements analyzer service

**File**: `app/src/server/services/requirements-analyzer.ts`

- **IMPLEMENT**: Detect visas, permits, insurance needs
- **PATTERN**: Create standalone service with pure functions
- **FUNCTIONS**:
  ```typescript
  export interface RequirementAnalysis {
    visas: Array<{
      country: string
      needed: boolean
      reason: string
      estimatedCost?: number
    }>
    insurance: {
      needed: boolean
      type: 'health' | 'travel' | 'both'
      estimatedCost: number
    }
    permits: string[]
    warnings: string[]
  }

  export async function analyzeRequirements(
    participantCountries: string[],
    destinationCountry: string,
    duration: number,
    activities: string[]
  ): Promise<RequirementAnalysis> {
    // Implement visa logic (EU Schengen rules)
    // Check insurance requirements
    // Identify activity-specific permits
    // Generate warnings for compliance
  }
  ```
- **LOGIC**:
  - EU/EEA citizens → No visa for Schengen
  - Non-EU → Check visa requirements
  - Always require travel insurance for Erasmus+
  - Special permits for activities (sports, camping, etc.)
- **VALIDATE**: Create unit test file

### Task 7: CREATE timeline generator service

**File**: `app/src/server/services/timeline-generator.ts`

- **IMPLEMENT**: Calculate phase dates from project duration
- **PATTERN**: Pure function service
- **FUNCTION**:
  ```typescript
  export interface PhaseTimeline {
    name: string
    type: PhaseType
    startDate: Date
    endDate: Date
    order: number
  }

  export function generateTimeline(
    projectStart: Date,
    projectEnd: Date,
    metadata: SeedMetadata
  ): PhaseTimeline[] {
    // Pre-project phases (1 month before):
    // - Emergency planning: 1 month before → 2 weeks before

    // During project:
    // - Travel (outbound): Day 1
    // - Accommodation: Day 1 → Last day
    // - Food: Day 1 → Last day
    // - Activities: Day 2 → Day (n-1)
    // - Travel (return): Last day

    // Return array of phases with calculated dates
  }
  ```
- **LOGIC**:
  - Emergency phase: Starts 1 month before, ends 2 weeks before
  - Travel outbound: Project start date
  - Accommodation/Food: Full project duration
  - Activities: Day 2 to Day (n-1)
  - Travel return: Project end date
- **VALIDATE**: Unit test with known dates

### Task 8: CREATE budget allocator service

**File**: `app/src/server/services/budget-allocator.ts`

- **IMPLEMENT**: Distribute total budget across phases
- **PATTERN**: Use existing Erasmus+ calculator as reference (`app/src/lib/erasmus/budget-calculator.ts`)
- **FUNCTION**:
  ```typescript
  export interface BudgetAllocation {
    travel: number
    accommodation: number
    food: number
    activities: number
    emergency: number
    total: number
  }

  export function allocateBudget(
    totalBudget: number,
    metadata: SeedMetadata
  ): BudgetAllocation {
    // Default distribution:
    // Travel: 30%
    // Accommodation: 25%
    // Food: 20%
    // Activities: 20%
    // Emergency: 5%

    // Adjust based on:
    // - Distance (if far, increase travel %)
    // - Duration (longer = more accommodation/food)
    // - Participant count (affects per-person costs)
  }
  ```
- **IMPORTS**: Use `calculateErasmusGrant` from `@/lib/erasmus/income-calculator`
- **VALIDATE**: Test with sample budgets

### Task 9: CREATE project auto-generator service

**File**: `app/src/server/services/project-auto-generator.ts`

- **IMPLEMENT**: Core orchestration for seed → project
- **PATTERN**: Service that coordinates timeline, budget, phases, checklists
- **FUNCTION**:
  ```typescript
  import type { PrismaClient } from '@prisma/client'
  import type { SeedMetadata } from '@/lib/types/intelligent-elaboration'
  import { generateTimeline } from './timeline-generator'
  import { allocateBudget } from './budget-allocator'
  import { generatePhaseChecklist } from './checklist-generator'

  export async function generateProjectFromSeed(
    seedId: string,
    metadata: SeedMetadata,
    orgId: string,
    userId: string,
    prisma: PrismaClient
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get seed
      const seed = await tx.seed.findUnique({ where: { id: seedId } })
      if (!seed) throw new Error('Seed not found')

      // 2. Generate timeline
      const startDate = metadata.duration.startDate || new Date()
      const endDate = metadata.duration.endDate ||
        new Date(startDate.getTime() + metadata.duration.days * 24 * 60 * 60 * 1000)

      const timeline = generateTimeline(startDate, endDate, metadata)

      // 3. Allocate budget
      const budget = allocateBudget(metadata.budget.total, metadata)

      // 4. Create project
      const project = await tx.pipelineProject.create({
        data: {
          tenantId: orgId,
          createdByUserId: userId,
          generatedFromSeedId: seedId,
          name: seed.title,
          type: 'STUDENT_EXCHANGE',
          status: 'PLANNING',
          description: seed.description,
          startDate,
          endDate,
          budgetTotal: metadata.budget.total,
          participantCount: metadata.participantCount,
          location: `${metadata.destination.city}, ${metadata.destination.country}`,
          originCountry: metadata.participantCountries[0],
          hostCountry: metadata.destination.country,
          metadata: metadata as any
        }
      })

      // 5. Create phases with checklists
      const phaseData = timeline.map((phase, index) => {
        const budgetKey = phase.type.toLowerCase() as keyof BudgetAllocation
        return {
          projectId: project.id,
          name: phase.name,
          type: phase.type,
          status: 'NOT_STARTED' as const,
          startDate: phase.startDate,
          endDate: phase.endDate,
          budgetAllocated: budget[budgetKey] || 0,
          order: index,
          autoGenerated: true,
          checklist: generatePhaseChecklist(phase.type, metadata)
        }
      })

      await tx.pipelinePhase.createMany({ data: phaseData })

      // 6. Pre-seed AI agents with project context
      // (This will be done lazily when user opens phase chat)

      return project
    })
  }
  ```
- **IMPORTS**: Existing Prisma types, utility services
- **VALIDATE**: Integration test

### Task 10: CREATE checklist generator helper

**File**: `app/src/server/services/checklist-generator.ts`

- **IMPLEMENT**: Generate phase-specific checklists
- **PATTERN**: Pure function returning JSON structure
- **FUNCTION**:
  ```typescript
  export interface ChecklistItem {
    id: string
    text: string
    completed: boolean
    priority: 'high' | 'medium' | 'low'
  }

  export function generatePhaseChecklist(
    phaseType: PhaseType,
    metadata: SeedMetadata
  ): ChecklistItem[] {
    const checklists: Record<PhaseType, () => ChecklistItem[]> = {
      TRAVEL: () => [
        { id: '1', text: 'Book outbound flights for all participants', completed: false, priority: 'high' },
        { id: '2', text: 'Book return flights', completed: false, priority: 'high' },
        { id: '3', text: 'Arrange airport transfers', completed: false, priority: 'medium' },
        ...(metadata.requirements.visas?.some(v => v.needed)
          ? [{ id: '4', text: 'Process visa applications', completed: false, priority: 'high' }]
          : [])
      ],
      ACCOMMODATION: () => [
        { id: '1', text: 'Find and book accommodation', completed: false, priority: 'high' },
        { id: '2', text: 'Confirm accessibility requirements', completed: false, priority: 'high' },
        { id: '3', text: 'Arrange room assignments', completed: false, priority: 'medium' }
      ],
      FOOD: () => [
        { id: '1', text: 'Plan daily meal schedule', completed: false, priority: 'high' },
        { id: '2', text: 'Identify dietary restrictions', completed: false, priority: 'high' },
        { id: '3', text: 'Book catering or restaurant reservations', completed: false, priority: 'medium' }
      ],
      ACTIVITIES: () => [
        { id: '1', text: 'Design activity schedule', completed: false, priority: 'high' },
        { id: '2', text: 'Book venues and materials', completed: false, priority: 'high' },
        { id: '3', text: 'Prepare learning materials', completed: false, priority: 'medium' }
      ],
      EMERGENCY: () => [
        { id: '1', text: 'Create emergency contact list', completed: false, priority: 'high' },
        { id: '2', text: 'Verify travel insurance coverage', completed: false, priority: 'high' },
        { id: '3', text: 'Identify local hospitals', completed: false, priority: 'medium' },
        { id: '4', text: 'Prepare emergency fund', completed: false, priority: 'high' }
      ]
    }

    return checklists[phaseType]?.() || []
  }
  ```
- **VALIDATE**: Unit test each phase type

### Task 11: UPDATE seed elaboration chain

**File**: `app/src/lib/ai/chains/seed-elaboration.ts`

- **IMPLEMENT**: Extend to support intelligent elaboration mode
- **PATTERN**: Add optional parameter for metadata mode
- **CHANGES**:
  ```typescript
  // Add new function alongside existing elaborateSeed
  export async function elaborateSeedIntelligent(
    currentSeed: GeneratedSeed,
    metadata: Partial<SeedMetadata>,
    conversationHistory: ElaborationMessage[],
    userMessage: string
  ): Promise<IntelligentElaborationResponse> {
    const model = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    const parser = StructuredOutputParser.fromZodSchema(IntelligentElaborationResponseSchema)
    const prompt = PromptTemplate.fromTemplate(INTELLIGENT_ELABORATION_PROMPT)
    const chain = prompt.pipe(model).pipe(parser)

    try {
      const result = await chain.invoke({
        currentSeedJson: JSON.stringify(currentSeed, null, 2),
        metadataJson: JSON.stringify(metadata, null, 2),
        conversationHistoryJson: JSON.stringify(conversationHistory, null, 2),
        userMessage,
        format_instructions: parser.getFormatInstructions(),
      })

      return result as IntelligentElaborationResponse
    } catch (error) {
      console.error('❌ Error in intelligent elaboration:', error)
      throw new Error('Failed to elaborate seed intelligently')
    }
  }
  ```
- **IMPORTS**: New prompt and types
- **VALIDATE**: `npx tsc --noEmit`

### Task 12: UPDATE brainstorm router - add intelligent mode

**File**: `app/src/server/routers/brainstorm.ts`

- **IMPLEMENT**: Add `elaborateIntelligent` mutation
- **PATTERN**: Mirror existing `elaborate` endpoint structure
- **ADD ENDPOINT**:
  ```typescript
  // After existing elaborate endpoint

  elaborateIntelligent: orgProcedure
    .input(z.object({
      seedId: z.string().uuid(),
      message: z.string(),
    }))
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
            currentSeedState: {
              title: seed.title,
              description: seed.description,
              approvalLikelihood: seed.approvalLikelihood,
            },
          },
        })
      }

      // Get current metadata from seed
      const metadata = (seed.metadata as any) || {}
      const currentSeed = elaboration.currentSeedState as any
      const history = elaboration.conversationHistory as unknown as ElaborationMessage[]

      // Run intelligent elaboration
      const response = await elaborateSeedIntelligent(
        currentSeed,
        metadata,
        history,
        input.message
      )

      // Update conversation history
      const updatedHistory = [
        ...history,
        {
          role: 'user' as const,
          content: input.message,
          timestamp: new Date(),
        },
        {
          role: 'assistant' as const,
          content: response.message,
          timestamp: new Date(),
          questionsAsked: response.questionsAsked,
          metadataExtracted: response.metadataExtracted,
        },
      ]

      // Save updated elaboration and metadata
      await ctx.prisma.seedElaboration.update({
        where: { id: elaboration.id },
        data: {
          conversationHistory: updatedHistory as any,
          currentSeedState: response.updatedSeed as any,
        },
      })

      // Update seed with metadata
      await ctx.prisma.seed.update({
        where: { id: seed.id },
        data: {
          metadata: {
            ...(seed.metadata as any),
            ...response.metadataExtracted,
          } as any,
          title: response.updatedSeed.title,
          description: response.updatedSeed.description,
        },
      })

      return {
        message: response.message,
        questionsAsked: response.questionsAsked,
        metadataExtracted: response.metadataExtracted,
        readyForProjectGeneration: response.readyForProjectGeneration,
        updatedSeed: response.updatedSeed,
      }
    }),
  ```
- **IMPORTS**: `elaborateSeedIntelligent`, types
- **VALIDATE**: `npx tsc --noEmit`

### Task 13: ADD project generation endpoint

**File**: `app/src/server/routers/brainstorm.ts`

- **IMPLEMENT**: Add `generateProjectFromSeed` mutation
- **PATTERN**: Use orgProcedure, validate seed ownership
- **ADD ENDPOINT**:
  ```typescript
  generateProjectFromSeed: orgProcedure
    .input(z.object({
      seedId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Load seed with metadata
      const seed = await ctx.prisma.seed.findFirst({
        where: {
          id: input.seedId,
          tenantId: ctx.orgId,
        },
      })

      if (!seed) {
        throw new Error('Seed not found')
      }

      if (!seed.metadata) {
        throw new Error('Seed must be elaborated with metadata before project generation')
      }

      // Validate metadata completeness
      const metadata = seed.metadata as any as SeedMetadata
      if (!metadata.participantCount || !metadata.destination || !metadata.budget) {
        throw new Error('Incomplete metadata. Please complete the elaboration conversation.')
      }

      // Generate project
      const project = await generateProjectFromSeed(
        seed.id,
        metadata,
        ctx.orgId,
        ctx.userId,
        ctx.prisma
      )

      console.log('✅ [ProjectGeneration] Created project from seed', {
        seedId: seed.id,
        projectId: project.id,
        phaseCount: 'generated_5_phases',
      })

      return {
        projectId: project.id,
        project,
      }
    }),
  ```
- **IMPORTS**: `generateProjectFromSeed`, `SeedMetadata`
- **VALIDATE**: `npx tsc --noEmit`

### Task 14: UPDATE agent context pre-seeding

**File**: `app/src/server/routers/pipeline/phases.ts`

- **IMPLEMENT**: Enhance chat endpoint to include project metadata
- **PATTERN**: Extend existing `buildContext` in BaseAgent
- **LOCATE**: Find the `chat` endpoint (around line 200+)
- **CHANGES**:
  ```typescript
  // In chat endpoint, when getting project:
  const project = await ctx.prisma.pipelineProject.findFirst({
    where: { id: phase.projectId },
    include: { phases: true } // Get all phases for context
  })

  // Build enhanced context
  const agentContext: AgentContext = {
    project: {
      name: project.name,
      location: project.location,
      participantCount: project.participantCount,
      startDate: project.startDate,
      endDate: project.endDate,
      metadata: project.metadata as any, // NEW: Include metadata
    },
    phase: {
      name: phase.name,
      type: phase.type,
      budgetAllocated: phase.budgetAllocated.toNumber(),
      startDate: phase.startDate,
      endDate: phase.endDate,
      checklist: phase.checklist as any, // NEW: Include checklist
    },
  }
  ```
- **VALIDATE**: Test agent has access to project context

### Task 15: CREATE unit tests for timeline generator

**File**: `app/src/__tests__/services/timeline-generator.test.ts`

- **IMPLEMENT**: Test timeline calculation logic
- **PATTERN**: Use existing test structure from `app/src/lib/erasmus/__tests__/budget-calculator.test.ts`
- **TEST CASES**:
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { generateTimeline } from '@/server/services/timeline-generator'

  describe('Timeline Generator', () => {
    it('should generate phases for a 7-day project', () => {
      const start = new Date('2024-06-01')
      const end = new Date('2024-06-07')
      const metadata = {
        duration: { days: 7 },
        participantCount: 20,
        // ... minimal metadata
      } as any

      const timeline = generateTimeline(start, end, metadata)

      expect(timeline).toHaveLength(5) // Travel, Accommodation, Food, Activities, Emergency
      expect(timeline[0].type).toBe('EMERGENCY')
      expect(timeline[0].startDate).toBeLessThan(start) // Starts before project
    })

    it('should handle projects with no specific dates', () => {
      // Test with duration only
    })

    it('should calculate emergency phase correctly', () => {
      // Emergency should be 1 month before → 2 weeks before
    })
  })
  ```
- **VALIDATE**: `npm test timeline-generator`

### Task 16: CREATE unit tests for budget allocator

**File**: `app/src/__tests__/services/budget-allocator.test.ts`

- **IMPLEMENT**: Test budget distribution
- **TEST CASES**:
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { allocateBudget } from '@/server/services/budget-allocator'

  describe('Budget Allocator', () => {
    it('should distribute budget with default percentages', () => {
      const total = 10000
      const metadata = {
        duration: { days: 7 },
        participantCount: 20,
        destination: { country: 'Spain', city: 'Barcelona' }
      } as any

      const allocation = allocateBudget(total, metadata)

      expect(allocation.total).toBe(total)
      expect(allocation.travel).toBeGreaterThan(0)
      expect(allocation.accommodation).toBeGreaterThan(0)
      expect(allocation.food).toBeGreaterThan(0)
      expect(allocation.activities).toBeGreaterThan(0)
      expect(allocation.emergency).toBeGreaterThan(0)

      const sum = Object.values(allocation).reduce((a, b) => a + b, -total)
      expect(Math.abs(sum)).toBeLessThan(1) // Allow rounding errors
    })

    it('should adjust for long distances', () => {
      // Test that travel % increases for far destinations
    })
  })
  ```
- **VALIDATE**: `npm test budget-allocator`

### Task 17: CREATE integration test for project generation

**File**: `app/src/__tests__/services/project-auto-generator.test.ts`

- **IMPLEMENT**: End-to-end test of seed → project
- **PATTERN**: Use Prisma mock or test database
- **TEST CASES**:
  ```typescript
  import { describe, it, expect, beforeEach } from 'vitest'
  import { PrismaClient } from '@prisma/client'
  import { generateProjectFromSeed } from '@/server/services/project-auto-generator'

  const prisma = new PrismaClient()

  describe('Project Auto Generator', () => {
    beforeEach(async () => {
      // Clean test data
    })

    it('should create project with all phases', async () => {
      // Create test seed
      const seed = await prisma.seed.create({
        data: {
          title: 'Test Exchange',
          description: 'Test description',
          // ...
        }
      })

      const metadata = {
        participantCount: 20,
        destination: { country: 'Spain', city: 'Barcelona' },
        duration: { days: 7 },
        budget: { total: 15000, currency: 'EUR' },
        // ...
      }

      const project = await generateProjectFromSeed(
        seed.id,
        metadata as any,
        'test-org-id',
        'test-user-id',
        prisma
      )

      expect(project).toBeDefined()
      expect(project.name).toBe('Test Exchange')

      // Verify phases created
      const phases = await prisma.pipelinePhase.findMany({
        where: { projectId: project.id }
      })

      expect(phases).toHaveLength(5)
      expect(phases.every(p => p.autoGenerated)).toBe(true)
      expect(phases.every(p => p.checklist !== null)).toBe(true)
    })
  })
  ```
- **VALIDATE**: `npm test project-auto-generator`

### Task 18: MANUAL E2E testing

- **IMPLEMENT**: Test full user flow
- **STEPS**:
  1. Create brainstorm session
  2. Save a seed
  3. Start intelligent elaboration
  4. Answer AI questions progressively
  5. Verify metadata is collected
  6. Generate project when ready
  7. Verify project has 5 phases
  8. Verify budget is allocated
  9. Verify checklists are populated
  10. Open phase chat and verify agent has context
- **VALIDATE**: Document results in test report

### Task 19: UPDATE frontend types (if needed)

**File**: `app/src/app/(dashboard)/seeds/[id]/page.tsx`

- **IMPLEMENT**: Ensure page can handle new metadata display
- **PATTERN**: Read existing page structure
- **CHANGES**: May need to add UI for:
  - Metadata display (participants, budget, destination)
  - "Ready for Project Generation" indicator
  - "Generate Project" button
- **NOTE**: Frontend changes might be out of scope for this plan
- **VALIDATE**: Check if existing UI works with backend changes

### Task 20: ADD comprehensive error handling

**File**: All service files

- **IMPLEMENT**: Add try/catch and meaningful errors
- **PATTERN**: Follow existing error handling in `app/src/lib/ai/chains/seed-elaboration.ts`
- **AREAS TO CHECK**:
  - Timeline generator edge cases (same start/end date)
  - Budget allocator with zero budget
  - Project generator with missing org/user
  - Checklist generator with unknown phase type
  - Requirements analyzer with invalid countries
- **VALIDATE**: Test error scenarios

---

## TESTING STRATEGY

### Unit Tests

**Framework**: Vitest (already configured in project)

**Test Files Required**:
- `timeline-generator.test.ts` - Timeline calculation logic
- `budget-allocator.test.ts` - Budget distribution algorithms
- `checklist-generator.test.ts` - Checklist generation per phase
- `requirements-analyzer.test.ts` - Visa/permit detection

**Coverage Target**: >80% for new services

### Integration Tests

**Test Scenarios**:
1. **Complete elaboration flow**:
   - Create seed → Elaborate with metadata → Generate project
   - Verify database state at each step
   - Check all relations are created correctly

2. **Prisma transaction integrity**:
   - Test rollback on phase creation failure
   - Verify all-or-nothing project generation

3. **AI chain integration**:
   - Mock OpenAI responses
   - Test structured output parsing
   - Verify metadata extraction

### Edge Cases

**Test Cases**:
- **Invalid dates**: Start date after end date
- **Zero budget**: Handle gracefully
- **Missing metadata**: Prevent project generation
- **Unknown countries**: Fallback in requirements analyzer
- **Extreme durations**: 1 day vs 21 days
- **Large participant counts**: 100+ participants

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# TypeScript type checking
cd app && npx tsc --noEmit

# ESLint (must pass with 0 errors)
cd app && npm run lint

# Prisma schema validation
cd app && npx prisma format && npx prisma validate
```

**Expected**: All commands pass with exit code 0

### Level 2: Unit Tests

```bash
# Run all unit tests
cd app && npm test

# Run specific test files
npm test timeline-generator
npm test budget-allocator
npm test project-auto-generator
```

**Expected**: All tests pass, coverage >80% for new files

### Level 3: Database Migration

```bash
# Generate migration
cd app && npx prisma migrate dev --name add_intelligent_seed_elaboration

# Verify schema is in sync
npx prisma migrate status
```

**Expected**: Migration created successfully, no pending migrations

### Level 4: Manual E2E Validation

**Test Flow**:
```bash
# Start dev server
cd app && npm run dev

# In browser:
# 1. Go to /brainstorm
# 2. Create session, save seed
# 3. Go to /seeds/[id]
# 4. Start intelligent elaboration
# 5. Answer questions:
#    - "We have 25 participants"
#    - "From Sweden and Turkey"
#    - "Going to Barcelona, Spain"
#    - "For 7 days in June"
#    - "Budget is 15000 EUR"
# 6. Click "Generate Project" when ready
# 7. Verify project created with 5 phases
# 8. Open each phase, check checklist
# 9. Test phase chat, verify agent has context
```

**Expected Results**:
- ✅ Metadata collected incrementally
- ✅ AI asks relevant follow-up questions
- ✅ Project generated with correct data
- ✅ 5 phases created (Emergency, Travel, Accommodation, Food, Activities)
- ✅ Budget allocated across phases
- ✅ Checklists populated
- ✅ AI agents have project context

### Level 5: Regression Check

```bash
# Run existing tests to ensure no breakage
cd app && npm test

# Test existing seed elaboration (non-intelligent mode)
# Manually verify old elaboration flow still works
```

**Expected**: All existing tests pass, old functionality intact

---

## PULL REQUEST TEMPLATE

```markdown
## Summary

Implemented intelligent seed elaboration system that transforms minimal project seeds into complete, execution-ready projects through AI-driven requirements gathering.

## Changes

### Backend Services (New)
- `intelligent-seed-elaborator.ts` - Orchestrates enhanced elaboration with metadata collection
- `project-auto-generator.ts` - Generates complete PipelineProject from elaborated seed
- `timeline-generator.ts` - Calculates phase timeline based on project duration
- `budget-allocator.ts` - Distributes budget intelligently across phases
- `requirements-analyzer.ts` - Detects visa, permit, and insurance requirements
- `checklist-generator.ts` - Auto-populates phase-specific checklists

### AI Enhancements
- `intelligent-elaboration.ts` - New prompt for progressive metadata gathering
- Enhanced seed elaboration chain with metadata mode
- Structured output parsing for rich metadata extraction

### Database Schema
- Added `metadata` JSONB to `seed` table
- Added `checklist` JSONB to `pipeline_phase` table
- Added `auto_generated` boolean to `pipeline_phase` table
- Added `generated_from_seed_id` relation to `pipeline_project` table

### API Endpoints (TRPC)
- `brainstorm.elaborateIntelligent` - Enhanced elaboration with metadata
- `brainstorm.generateProjectFromSeed` - Auto-generate project from seed

### Type System
- `intelligent-elaboration.ts` - Rich metadata types
- Zod schemas for validation
- Extended ElaborationResponse types

## Implementation Details

**Metadata Collection Flow**:
1. User starts intelligent elaboration
2. AI asks progressive questions (participants, destination, budget, etc.)
3. Metadata incrementally collected and validated
4. When sufficient data gathered, project generation enabled

**Project Generation Flow**:
1. Validate metadata completeness
2. Generate timeline (phases with calculated dates)
3. Allocate budget across phases
4. Create PipelineProject in transaction
5. Create 5 phases (Emergency, Travel, Accommodation, Food, Activities)
6. Auto-populate checklists per phase type
7. Store relation back to seed

**Budget Allocation Algorithm**:
- Default: 30% Travel, 25% Accommodation, 20% Food, 20% Activities, 5% Emergency
- Adjusts based on distance, duration, participant count

**Timeline Calculation**:
- Emergency: 1 month before → 2 weeks before project
- Travel (outbound): Day 1
- Accommodation/Food: Full duration
- Activities: Day 2 → Day (n-1)
- Travel (return): Last day

## Testing

### Unit Tests
- ✅ Timeline generator (7 test cases)
- ✅ Budget allocator (5 test cases)
- ✅ Checklist generator (5 phase types)
- ✅ Requirements analyzer (visa detection)

### Integration Tests
- ✅ Complete seed → project flow
- ✅ Prisma transaction integrity
- ✅ Metadata incremental collection

### Manual E2E
- ✅ Created test seed
- ✅ Completed intelligent elaboration (8 questions)
- ✅ Generated project successfully
- ✅ Verified 5 phases created
- ✅ Verified budget allocated correctly
- ✅ Verified checklists populated
- ✅ Verified AI agents have project context

## Validation

All validation commands passed:
- ✅ Type checking (`npx tsc --noEmit`)
- ✅ Linting (`npm run lint`)
- ✅ Prisma validation (`npx prisma validate`)
- ✅ Unit tests (`npm test`) - 32 tests, 100% pass rate
- ✅ Database migration generated and applied
- ✅ Manual E2E test completed

## Metrics

**Before**:
- Seed → Project conversion: Manual, 30-60 minutes
- Phase creation: Manual, one by one
- Budget allocation: Manual calculation
- Checklist: Empty, manual entry

**After**:
- Seed → Project conversion: 10-15 minutes with AI guidance
- Phase creation: Automatic, 5 phases in <1 second
- Budget allocation: Automatic with intelligent distribution
- Checklist: Pre-populated with 15-20 items per phase

## Related

- Implementation Plan: `.agents/plans/intelligent-seed-elaboration.md`
- Issue: #96

---

🤖 Generated with Remote Coding Agent
```

---

## ACCEPTANCE CRITERIA

- [ ] Seed model has `metadata` JSONB column
- [ ] PipelinePhase has `checklist` and `autoGenerated` fields
- [ ] PipelineProject has `generatedFromSeedId` relation
- [ ] Intelligent elaboration collects: participants, destination, budget, duration, requirements
- [ ] Project generation creates exactly 5 phases
- [ ] Timeline calculation follows specified algorithm
- [ ] Budget allocation sums to 100% of total
- [ ] Checklists have 3-5 items per phase
- [ ] Requirements analyzer detects visa needs for non-EU participants
- [ ] All validation commands pass with zero errors
- [ ] Unit test coverage >80% for new services
- [ ] Integration test for complete seed → project flow
- [ ] Manual E2E test completed successfully
- [ ] No regressions in existing seed elaboration
- [ ] AI agents receive project metadata in context
- [ ] **Feature branch created and up to date**
- [ ] **All changes committed with conventional commit message**
- [ ] **Pull request created with comprehensive description**

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order (1-20)
- [ ] All validation commands executed successfully:
  - [ ] Level 1: tsc, lint, prisma validate
  - [ ] Level 2: unit tests (all passing)
  - [ ] Level 3: migration generated and applied
  - [ ] Level 4: manual E2E validation
  - [ ] Level 5: regression tests (all passing)
- [ ] Database migration created and applied
- [ ] All unit tests pass (32+ tests)
- [ ] Integration test passes
- [ ] Manual E2E test documented
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] All acceptance criteria met
- [ ] Code reviewed for quality and maintainability
- [ ] **Pull request created and linked to plan**

---

## NOTES

### Design Decisions

**Why separate `elaborateIntelligent` endpoint?**
- Preserves backward compatibility with existing elaboration
- Allows gradual migration of frontend
- Can A/B test both approaches

**Why auto-generate exactly 5 phases?**
- Standard Erasmus+ Youth Exchange structure
- Covers all essential project aspects
- Can be customized after generation

**Why store metadata in JSONB vs normalized tables?**
- Flexible schema (requirements vary by project)
- Faster development iteration
- Easier to extend without migrations
- Sufficient for current scale

**Why calculate timeline server-side?**
- Ensures consistency across users
- Single source of truth for phase dates
- Erasmus+ compliance validation centralized

### Future Enhancements (Out of Scope)

- Custom phase templates (user-defined)
- ML-based budget prediction (historical data)
- Integration with external APIs (flight prices, accommodation)
- Multi-language support for checklists
- Collaborative elaboration (multiple users)
- Export to Erasmus+ application format

### Risk Mitigation

**Risk**: AI fails to extract metadata correctly
**Mitigation**: Validate with Zod schemas, provide fallback prompts

**Risk**: Project generation fails mid-transaction
**Mitigation**: Use Prisma transaction, rollback on error

**Risk**: Budget allocation doesn't sum to 100%
**Mitigation**: Adjust emergency fund to absorb rounding errors

**Risk**: Timeline calculation errors with edge cases
**Mitigation**: Comprehensive unit tests, input validation

### Performance Considerations

**Database**:
- JSONB fields indexed for metadata queries
- Transaction should complete in <500ms
- No N+1 queries (use includes)

**AI Calls**:
- Single call per user message
- Structured outputs reduce token usage
- Typical response time: 2-4 seconds

**Scalability**:
- Stateless services (horizontal scaling)
- Database connection pooling
- No file system dependencies
