# Implementation Plan: Project Generation Engine (Issue #99)

**Issue:** #99 - Backend: Project Generation Engine (Part 3/4 of Intelligent Seed Elaboration System)
**Parent Issue:** #96 - Intelligent Seed Elaboration System
**Plan Created:** 2026-01-15
**Estimated Effort:** 3-4 hours

---

## Executive Summary

This plan implements the automatic project generation engine that converts rich seeds (elaborated project ideas) into complete, actionable projects with phases, timelines, budgets, and checklists. This is Part 3 of the 4-part Intelligent Seed Elaboration System.

The system will intelligently analyze seed metadata (destination, participants, activities, duration) and generate:
- Realistic project timelines with preparation, execution, and follow-up phases
- Smart budget allocation across categories (travel, accommodation, food, activities, etc.)
- Phase-specific checklists with actionable tasks
- Requirements analysis (visas, permits, insurance)

---

## Current State Analysis

### Existing Infrastructure
1. **Seed System** (✅ Complete - from Part 1)
   - `Seed` model with metadata fields: `estimated_duration`, `estimated_participants`, `tags`
   - `current_version` JSON field storing elaborated seed data including activities, themes, etc.
   - Seeds service with CRUD operations
   - Basic `convertSeedToProject()` stub exists but needs enhancement

2. **Project & Phase Models** (✅ Complete)
   - `Project` model with comprehensive fields (budget, dates, participants, location, metadata)
   - `Phase` model with types: ACCOMMODATION, TRAVEL, FOOD, ACTIVITIES, INSURANCE, PERMITS, APPLICATION, REPORTING
   - `checklist` JSON field on phases (currently unused)
   - Budget tracking: `budget_allocated`, `budget_spent` at phase level

3. **Existing Convert Function** (⚠️ Needs Major Enhancement)
   - Location: `project-pipeline/backend/src/seeds/seeds.service.ts:252-339`
   - Current implementation:
     - Creates project with basic fields
     - Generates 5 generic phases with hardcoded durations
     - No intelligent budget allocation
     - No metadata-driven phase generation
     - No checklist generation
     - No requirements analysis

### What Needs to Be Built

We need to build **6 new generator modules** and enhance the existing convert function:

1. **Timeline Generator** - Calculate phase dates from seed metadata
2. **Budget Allocator** - Smart budget distribution based on project characteristics
3. **Requirements Analyzer** - Identify visa, insurance, permit needs
4. **Phase Generator** - Create phases based on seed activities and requirements
5. **Checklist Generator** - Generate phase-specific task lists
6. **Project Generator Orchestrator** - Coordinate all generators (enhance existing `convertSeedToProject`)

---

## Architecture Design

### Module Structure

```
project-pipeline/backend/src/seeds/
├── seeds.service.ts                  (existing - will be enhanced)
├── seeds.routes.ts                   (existing - already has /convert endpoint)
├── seeds.types.ts                    (existing - may need new types)
├── generators/                       (new directory)
│   ├── timeline-generator.ts         (new)
│   ├── budget-allocator.ts           (new)
│   ├── requirements-analyzer.ts      (new)
│   ├── phase-generator.ts            (new)
│   ├── checklist-generator.ts        (new)
│   └── types.ts                      (new - shared generator types)
└── tests/generators/                 (new directory)
    ├── timeline-generator.test.ts    (new)
    ├── budget-allocator.test.ts      (new)
    ├── requirements-analyzer.test.ts (new)
    ├── phase-generator.test.ts       (new)
    ├── checklist-generator.test.ts   (new)
    └── integration.test.ts           (new)
```

### Data Flow

```
User clicks "Convert to Project" in frontend
    ↓
POST /api/seeds/:id/convert-to-project
    ↓
convertSeedToProject(seedId, userId)
    ↓
┌─────────────────────────────────────┐
│ 1. Load Seed + Elaboration Data    │
│    - Basic seed fields              │
│    - current_version metadata       │
│    - Elaboration conversation       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. Extract Rich Metadata           │
│    - Activities array               │
│    - Destination country            │
│    - Participant countries          │
│    - Duration, dates                │
│    - Budget estimate                │
└─────────────────────────────────────┘
    ↓
┌──────────────────────────┬──────────────────────────┬───────────────────────────┐
│ 3a. Timeline Generator   │ 3b. Budget Allocator     │ 3c. Requirements Analyzer │
│    - Prep phase dates    │    - Smart allocation    │    - Visa needs           │
│    - Activity scheduling │    - Category %          │    - Insurance type       │
│    - Follow-up period    │    - Per-phase budgets   │    - Permits required     │
└──────────────────────────┴──────────────────────────┴───────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. Phase Generator                  │
│    - Create phases for each need    │
│    - Assign dates from timeline     │
│    - Assign budgets from allocator  │
│    - Set dependencies & order       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 5. Checklist Generator              │
│    - Phase-specific tasks           │
│    - Context-aware items            │
│    - Deadline-driven ordering       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 6. Transaction: Create Project      │
│    - Project record                 │
│    - All phases with checklists     │
│    - Atomic commit                  │
└─────────────────────────────────────┘
    ↓
Return { projectId, phases, timeline, budget }
```

---

## Detailed Component Specifications

### 1. Timeline Generator

**File:** `project-pipeline/backend/src/seeds/generators/timeline-generator.ts`

**Purpose:** Calculate all phase dates based on exchange dates and dependencies

**Input:**
```typescript
interface TimelineInput {
  exchangeStartDate: Date    // From seed.current_version.startDate
  exchangeDuration: number    // Days (from seed.estimated_duration)
  activities: Activity[]      // From seed.current_version.activities
}
```

**Output:**
```typescript
interface TimelineOutput {
  preparation: {
    startDate: Date   // 8-12 weeks before exchange
    endDate: Date     // Day before exchange
  }
  exchange: {
    startDate: Date
    endDate: Date
  }
  followUp: {
    startDate: Date   // Day after exchange
    endDate: Date     // 4 weeks after exchange
  }
  phases: {
    [phaseType: string]: {
      startDate: Date
      endDate: Date
      deadline: Date
    }
  }
}
```

**Algorithm:**
```typescript
1. Parse exchangeStartDate and exchangeDuration
2. Calculate exchange end date: startDate + duration days
3. Calculate preparation period:
   - Default: 10 weeks before exchange
   - If visa required (from requirements): 12 weeks before
   - If complex activities: 12 weeks before
4. Calculate phase-specific deadlines:
   - APPLICATION: 12 weeks before (earliest)
   - VISA/PERMITS: 8 weeks before
   - INSURANCE: 6 weeks before
   - ACCOMMODATION: 6 weeks before
   - TRAVEL: 4 weeks before (booking flights)
   - FOOD: 2 weeks before (confirm catering)
   - ACTIVITIES: 1 week before (finalize materials)
5. Calculate follow-up:
   - Start: exchange end + 1 day
   - End: exchange end + 30 days
   - REPORTING deadline: 30 days after exchange
```

**Edge Cases:**
- If start date is in past → error
- If duration < 1 day → error
- If preparation time overlaps today → warn but continue

---

### 2. Budget Allocator

**File:** `project-pipeline/backend/src/seeds/generators/budget-allocator.ts`

**Purpose:** Intelligently distribute budget across phases based on project characteristics

**Input:**
```typescript
interface BudgetInput {
  totalBudget: number         // EUR (from seed.estimated_budget or default)
  participants: number
  duration: number            // Days
  destination: string
  activities: Activity[]
  hasLongDistanceTravel: boolean
  hasAccommodation: boolean
  hasWorkshops: boolean
}
```

**Output:**
```typescript
interface BudgetOutput {
  breakdown: {
    travel: number          // EUR
    accommodation: number
    food: number
    activities: number
    staffing: number
    insurance: number
    permits: number
    application: number
    contingency: number
  }
  phaseAllocations: {
    [phaseId: string]: number
  }
  justification: string     // Human-readable explanation
}
```

**Base Allocation Rules:**
```typescript
const BASE_PERCENTAGES = {
  travel: 0.30,          // 30% - Flights, trains, local transport
  accommodation: 0.25,   // 25% - Hotels, hostels, venues
  food: 0.15,            // 15% - Meals, catering
  activities: 0.15,      // 15% - Workshops, materials, facilitators
  staffing: 0.08,        // 8%  - Staff travel, accommodation
  insurance: 0.03,       // 3%  - Group travel insurance
  permits: 0.01,         // 1%  - Event permits, venue permits
  application: 0.01,     // 1%  - Admin costs
  contingency: 0.02,     // 2%  - Buffer for unexpected costs
}
```

**Smart Adjustments:**
```typescript
1. Long-distance travel (>1500km):
   - Increase travel to 35%
   - Decrease activities to 13%

2. Workshop-heavy (3+ workshop activities):
   - Increase activities to 20%
   - Decrease accommodation to 23%

3. High accommodation costs (Western Europe):
   - Increase accommodation to 30%
   - Decrease food to 13%

4. Large group (50+ participants):
   - Increase contingency to 5%

5. Short duration (<3 days):
   - Decrease food to 10%
   - Increase travel to 32%
```

**Per-Phase Allocation:**
```typescript
- TRAVEL (outbound): 40% of travel budget
- TRAVEL (return): 40% of travel budget
- LOCAL_TRANSPORT: 20% of travel budget
- ACCOMMODATION: 100% of accommodation budget
- FOOD: 100% of food budget
- ACTIVITIES: Split equally among activity phases
- INSURANCE: 100% of insurance budget
- PERMITS: 100% of permits budget
- APPLICATION: 100% of application budget
- REPORTING: 0 (administrative, no budget)
```

---

### 3. Requirements Analyzer

**File:** `project-pipeline/backend/src/seeds/generators/requirements-analyzer.ts`

**Purpose:** Identify visa, insurance, permit, and other requirements

**Input:**
```typescript
interface RequirementsInput {
  participantCountries: string[]   // From seed.current_version.participantCountries
  destinationCountry: string       // From seed.current_version.destination
  activities: Activity[]
  isPublicEvent: boolean
  hasFood: boolean
  participants: number
}
```

**Output:**
```typescript
interface RequirementsOutput {
  visas: {
    required: boolean
    countries: string[]        // Which countries need visas
    type: 'schengen' | 'national' | 'none'
    deadline: Date             // Application deadline
  }
  insurance: {
    required: boolean
    type: 'group_travel' | 'individual'
    coverage: string[]         // ['medical', 'liability', 'cancellation']
  }
  permits: {
    required: boolean
    types: Array<{
      type: 'event' | 'venue' | 'food_handling' | 'public_assembly'
      reason: string
      authority: string
    }>
  }
  accessibility: {
    wheelchairAccess: boolean
    dietaryRestrictions: boolean
    languageSupport: boolean
  }
}
```

**Analysis Logic:**

**Visa Requirements:**
```typescript
const SCHENGEN_COUNTRIES = ['ES', 'FR', 'DE', 'IT', 'NL', ...] // All Schengen states
const EU_COUNTRIES = ['ES', 'FR', 'DE', ..., 'BG', 'RO']      // All EU members

function analyzeVisaRequirements(participants: string[], destination: string) {
  const nonEU = participants.filter(c => !EU_COUNTRIES.includes(c))

  if (SCHENGEN_COUNTRIES.includes(destination)) {
    return {
      required: nonEU.length > 0,
      countries: nonEU,
      type: 'schengen',
      deadline: calculateDeadline(12) // 12 weeks before
    }
  }

  return { required: false, type: 'none' }
}
```

**Insurance Requirements:**
```typescript
function analyzeInsurance(participants: number) {
  if (participants >= 10) {
    return {
      required: true,
      type: 'group_travel',
      coverage: ['medical', 'liability', 'trip_cancellation', 'emergency_evacuation']
    }
  }
  return {
    required: true,
    type: 'individual',
    coverage: ['medical', 'liability']
  }
}
```

**Permit Requirements:**
```typescript
function analyzePermits(activities: Activity[], isPublic: boolean, hasFood: boolean) {
  const permits = []

  if (isPublic || activities.some(a => a.type === 'public_event')) {
    permits.push({
      type: 'event',
      reason: 'Public gathering of participants',
      authority: 'Local municipality'
    })
  }

  if (hasFood || activities.some(a => a.type === 'cooking_workshop')) {
    permits.push({
      type: 'food_handling',
      reason: 'Serving food to participants',
      authority: 'Health department'
    })
  }

  if (activities.some(a => a.isOutdoor)) {
    permits.push({
      type: 'public_assembly',
      reason: 'Outdoor activities in public spaces',
      authority: 'Parks department'
    })
  }

  return {
    required: permits.length > 0,
    types: permits
  }
}
```

---

### 4. Phase Generator

**File:** `project-pipeline/backend/src/seeds/generators/phase-generator.ts`

**Purpose:** Generate all project phases based on requirements, timeline, and budget

**Input:**
```typescript
interface PhaseGeneratorInput {
  seed: RichSeed
  timeline: TimelineOutput
  budget: BudgetOutput
  requirements: RequirementsOutput
  projectId: string
}
```

**Output:**
```typescript
interface PhaseGeneratorOutput {
  phases: Array<{
    project_id: string
    name: string
    type: PhaseType
    status: 'NOT_STARTED'
    start_date: Date
    end_date: Date
    deadline: Date
    budget_allocated: number
    budget_spent: 0
    order: number
    dependencies: string[]    // Phase types that must complete first
    checklist: null          // Will be populated by checklist generator
    editable: boolean
    skippable: boolean
  }>
}
```

**Phase Generation Strategy:**

**Core Phases (Always Created):**
```typescript
1. APPLICATION
   - Order: 1
   - Type: APPLICATION
   - Name: "Grant Application Preparation"
   - Duration: timeline.preparation.startDate → 10 weeks before
   - Budget: budget.breakdown.application
   - Dependencies: []
   - Skippable: false (required for funding)

2. INSURANCE
   - Order: 2
   - Type: INSURANCE
   - Name: "Group Travel Insurance"
   - Duration: 6 weeks before → 4 weeks before
   - Budget: budget.breakdown.insurance
   - Dependencies: ['APPLICATION']
   - Skippable: false

3. ACCOMMODATION
   - Order: 3
   - Type: ACCOMMODATION
   - Name: "Accommodation Booking"
   - Duration: 6 weeks before → 2 weeks before
   - Budget: budget.breakdown.accommodation
   - Dependencies: ['APPLICATION']
   - Skippable: false

4. TRAVEL (Outbound)
   - Order: 4
   - Type: TRAVEL
   - Name: "Outbound Travel Arrangements"
   - Duration: 4 weeks before → 1 day before
   - Budget: budget.phaseAllocations.travel_outbound
   - Dependencies: ['INSURANCE', 'ACCOMMODATION']
   - Skippable: false

5. ACTIVITIES
   - Order: 5-N (one phase per activity)
   - Type: ACTIVITIES
   - Name: seed.current_version.activities[i].name
   - Duration: During exchange period
   - Budget: budget.breakdown.activities / activityCount
   - Dependencies: ['TRAVEL']
   - Skippable: true (flexible schedule)

6. FOOD
   - Order: N+1
   - Type: FOOD
   - Name: "Catering and Meals"
   - Duration: 2 weeks before → exchange end
   - Budget: budget.breakdown.food
   - Dependencies: ['ACCOMMODATION']
   - Skippable: false

7. TRAVEL (Return)
   - Order: N+2
   - Type: TRAVEL
   - Name: "Return Travel Arrangements"
   - Duration: Exchange end → +1 day
   - Budget: budget.phaseAllocations.travel_return
   - Dependencies: ['ACTIVITIES']
   - Skippable: false

8. REPORTING
   - Order: N+3
   - Type: REPORTING
   - Name: "Final Report and Documentation"
   - Duration: Exchange end+1 → +30 days
   - Budget: 0
   - Dependencies: ['TRAVEL'] (return)
   - Skippable: false
```

**Conditional Phases (Based on Requirements):**
```typescript
if (requirements.visas.required) {
  phases.push({
    name: "Visa Applications",
    type: "PERMITS",
    order: 2,  // After APPLICATION
    start_date: timeline.preparation.startDate,
    end_date: addWeeks(exchangeStart, -8),
    deadline: addWeeks(exchangeStart, -8),
    budget_allocated: budget.breakdown.permits * 0.5,
    dependencies: ['APPLICATION'],
    skippable: false
  })
}

if (requirements.permits.types.some(p => p.type === 'event')) {
  phases.push({
    name: "Event Permits",
    type: "PERMITS",
    order: 3,
    start_date: addWeeks(exchangeStart, -8),
    end_date: addWeeks(exchangeStart, -4),
    deadline: addWeeks(exchangeStart, -4),
    budget_allocated: budget.breakdown.permits * 0.3,
    dependencies: ['ACCOMMODATION'],
    skippable: false
  })
}

if (requirements.permits.types.some(p => p.type === 'food_handling')) {
  phases.push({
    name: "Food Handling Permits",
    type: "PERMITS",
    order: 4,
    start_date: addWeeks(exchangeStart, -6),
    end_date: addWeeks(exchangeStart, -2),
    deadline: addWeeks(exchangeStart, -2),
    budget_allocated: budget.breakdown.permits * 0.2,
    dependencies: ['ACCOMMODATION'],
    skippable: true
  })
}
```

**Dependency Resolution:**
```typescript
function resolveDependencies(phases: Phase[]): Phase[] {
  // Ensure phases are ordered correctly based on dependencies
  const ordered = topologicalSort(phases, (p) => p.dependencies)

  // Renumber order field
  ordered.forEach((phase, index) => {
    phase.order = index + 1
  })

  return ordered
}
```

---

### 5. Checklist Generator

**File:** `project-pipeline/backend/src/seeds/generators/checklist-generator.ts`

**Purpose:** Generate phase-specific task checklists

**Input:**
```typescript
interface ChecklistInput {
  phase: Phase
  seed: RichSeed
  requirements: RequirementsOutput
}
```

**Output:**
```typescript
interface ChecklistOutput {
  tasks: Array<{
    id: string
    description: string
    completed: boolean
    dueDate?: Date
    category: 'planning' | 'booking' | 'admin' | 'coordination'
    priority: 'high' | 'medium' | 'low'
  }>
}
```

**Checklist Templates:**

**APPLICATION Phase:**
```typescript
[
  { description: "Review Erasmus+ application guidelines", category: "planning", priority: "high" },
  { description: "Complete project narrative sections", category: "admin", priority: "high" },
  { description: "Prepare budget breakdown", category: "admin", priority: "high" },
  { description: "Gather partner organization documents", category: "admin", priority: "medium" },
  { description: "Collect CVs of project staff", category: "admin", priority: "medium" },
  { description: "Write learning outcomes and impact assessment", category: "planning", priority: "high" },
  { description: "Submit application before deadline", category: "admin", priority: "high", dueDate: phase.deadline }
]
```

**ACCOMMODATION Phase:**
```typescript
[
  { description: `Research ${participants} hostels/hotels in ${destination}`, category: "planning", priority: "high" },
  { description: "Request quotes from 3-5 venues", category: "booking", priority: "high" },
  { description: "Compare accessibility features", category: "planning", priority: "medium" },
  { description: "Confirm group booking discount", category: "booking", priority: "medium" },
  { description: "Check cancellation policies", category: "planning", priority: "medium" },
  { description: "Book accommodation and get confirmation", category: "booking", priority: "high", dueDate: phase.deadline },
  { description: "Share accommodation details with participants", category: "coordination", priority: "low" }
]
```

**TRAVEL Phase:**
```typescript
[
  { description: "Research flight/train options from ${origin} to ${destination}", category: "planning", priority: "high" },
  { description: "Request group booking quotes", category: "booking", priority: "high" },
  { description: "Book travel insurance", category: "admin", priority: "high" },
  { description: "Book flights/trains for all participants", category: "booking", priority: "high" },
  { description: "Collect passport/ID copies", category: "admin", priority: "high" },
  { description: "Create travel itinerary document", category: "coordination", priority: "medium" },
  { description: "Arrange airport/station pickup", category: "coordination", priority: "medium" },
  { description: "Send travel details to participants", category: "coordination", priority: "high", dueDate: addDays(phase.deadline, -7) }
]
```

**FOOD Phase:**
```typescript
[
  { description: "Collect dietary restrictions from participants", category: "planning", priority: "high" },
  { description: "Research catering options in ${destination}", category: "planning", priority: "high" },
  { description: "Request quotes from caterers", category: "booking", priority: "medium" },
  { description: "Plan menu accommodating all diets", category: "planning", priority: "high" },
  { description: "Book catering services", category: "booking", priority: "high" },
  { description: "Confirm meal schedule with venue", category: "coordination", priority: "medium" },
  { description: "Arrange water/snacks for breaks", category: "booking", priority: "low" }
]
```

**ACTIVITIES Phase (per activity):**
```typescript
// For workshop activity
[
  { description: `Book facilitator for "${activity.name}"`, category: "booking", priority: "high" },
  { description: "Prepare materials list", category: "planning", priority: "medium" },
  { description: "Purchase/print workshop materials", category: "admin", priority: "medium" },
  { description: "Test equipment and setup", category: "planning", priority: "low" },
  { description: "Prepare handouts and certificates", category: "admin", priority: "low" }
]

// For cultural visit activity
[
  { description: `Book tickets for ${activity.name}`, category: "booking", priority: "high" },
  { description: "Arrange group tour guide", category: "booking", priority: "medium" },
  { description: "Check accessibility for all participants", category: "planning", priority: "medium" }
]
```

**PERMITS Phase:**
```typescript
if (permit.type === 'event') [
  { description: "Research local event permit requirements", category: "planning", priority: "high" },
  { description: "Complete event permit application", category: "admin", priority: "high" },
  { description: "Submit application to municipality", category: "admin", priority: "high" },
  { description: "Follow up on permit status", category: "admin", priority: "medium" },
  { description: "Receive approved permit", category: "admin", priority: "high", dueDate: phase.deadline }
]

if (permit.type === 'visa') [
  { description: "Collect visa application forms", category: "admin", priority: "high" },
  { description: "Book visa appointment slots for ${visaParticipants.length} participants`, category: "booking", priority: "high" },
  { description: "Prepare invitation letters", category: "admin", priority: "high" },
  { description: "Assist participants with visa applications", category: "coordination", priority: "high" },
  { description: "Track visa application status", category: "admin", priority: "medium" },
  { description: "Confirm all visas approved", category: "admin", priority: "high", dueDate: phase.deadline }
]
```

**REPORTING Phase:**
```typescript
[
  { description: "Collect participant feedback forms", category: "admin", priority: "high" },
  { description: "Compile photos and documentation", category: "admin", priority: "medium" },
  { description: "Draft final report narrative", category: "admin", priority: "high" },
  { description: "Complete financial report with receipts", category: "admin", priority: "high" },
  { description: "Write impact assessment", category: "admin", priority: "high" },
  { description: "Submit final report to funding agency", category: "admin", priority: "high", dueDate: phase.deadline }
]
```

**Context-Aware Enhancements:**
```typescript
// Add participant count to relevant tasks
task.description = task.description.replace('${participants}', seed.estimated_participants)

// Add destination to tasks
task.description = task.description.replace('${destination}', seed.current_version.destination)

// Add activity name to tasks
task.description = task.description.replace('${activity.name}', activity.name)

// Calculate due dates relative to phase deadline
if (task.priority === 'high' && !task.dueDate) {
  task.dueDate = addDays(phase.deadline, -3) // 3 days before deadline
}
```

---

### 6. Project Generator Orchestrator

**File:** `project-pipeline/backend/src/seeds/seeds.service.ts` (enhance existing `convertSeedToProject`)

**Purpose:** Coordinate all generators and create complete project

**Current Function Location:** Lines 252-339
**Action:** Replace entire function implementation

**New Implementation:**

```typescript
export async function convertSeedToProject(seedId: string, userId: string) {
  // 1. Load seed with full data
  const seed = await getSeedById(seedId, userId)

  // 2. Extract metadata from current_version
  const metadata = extractSeedMetadata(seed)

  // 3. Run generators in parallel (independent)
  const [timeline, budget, requirements] = await Promise.all([
    generateTimeline(metadata),
    allocateBudget(metadata),
    analyzeRequirements(metadata)
  ])

  // 4. Generate phases (depends on timeline, budget, requirements)
  const phaseTemplates = await generatePhases({
    seed: metadata,
    timeline,
    budget,
    requirements
  })

  // 5. Create project and phases in transaction
  const project = await prisma.$transaction(async (tx) => {
    // Create project
    const newProject = await tx.project.create({
      data: {
        name: seed.title_formal || seed.title,
        type: determineProjectType(seed.tags),
        status: 'PLANNING',
        description: seed.description_formal || seed.description,
        start_date: timeline.preparation.startDate,
        end_date: timeline.followUp.endDate,
        budget_total: budget.totalBudget,
        participants_count: metadata.participants,
        location: metadata.destination,
        created_by: userId,
        metadata: {
          converted_from_seed_id: seed.id,
          original_approval_likelihood: seed.approval_likelihood_formal,
          timeline_summary: timeline,
          budget_breakdown: budget.breakdown,
          requirements_summary: requirements,
          generation_timestamp: new Date().toISOString()
        }
      }
    })

    // Create phases with checklists
    const createdPhases = []
    for (const phaseTemplate of phaseTemplates) {
      // Generate checklist for this phase
      const checklist = await generateChecklist({
        phase: phaseTemplate,
        seed: metadata,
        requirements
      })

      const phase = await tx.phase.create({
        data: {
          ...phaseTemplate,
          project_id: newProject.id,
          checklist: checklist // JSON field
        }
      })

      createdPhases.push(phase)
    }

    return { project: newProject, phases: createdPhases }
  })

  // 6. Return complete project data
  return {
    project: project.project,
    phases: project.phases,
    timeline,
    budget,
    requirements
  }
}

// Helper: Extract rich metadata from seed
function extractSeedMetadata(seed: Seed): RichSeedMetadata {
  const currentVersion = seed.current_version as any

  return {
    title: seed.title_formal || seed.title,
    description: seed.description_formal || seed.description,
    participants: seed.estimated_participants || 20,
    duration: seed.estimated_duration || 7,
    destination: currentVersion?.destination || 'Barcelona, Spain',
    participantCountries: currentVersion?.participantCountries || ['TR'],
    activities: currentVersion?.activities || [],
    startDate: currentVersion?.startDate ? new Date(currentVersion.startDate) : null,
    estimatedBudget: currentVersion?.estimatedBudget || 50000,
    tags: seed.tags || [],
    isPublicEvent: currentVersion?.isPublicEvent || false,
    hasWorkshops: currentVersion?.activities?.some((a: any) => a.type === 'workshop'),
    requiresPermits: currentVersion?.requiresPermits || false
  }
}

// Helper: Determine project type from tags
function determineProjectType(tags: string[]): ProjectType {
  const lowerTags = tags.map(t => t.toLowerCase())

  if (lowerTags.some(t => t.includes('exchange') || t.includes('mobility'))) {
    return 'STUDENT_EXCHANGE'
  }
  if (lowerTags.some(t => t.includes('training') || t.includes('course'))) {
    return 'TRAINING'
  }
  if (lowerTags.some(t => t.includes('conference') || t.includes('seminar'))) {
    return 'CONFERENCE'
  }
  return 'CUSTOM'
}
```

---

## Type Definitions

**File:** `project-pipeline/backend/src/seeds/generators/types.ts`

```typescript
// Shared types for all generators

export interface RichSeedMetadata {
  title: string
  description: string
  participants: number
  duration: number // days
  destination: string
  participantCountries: string[]
  activities: Activity[]
  startDate: Date | null
  estimatedBudget: number // EUR
  tags: string[]
  isPublicEvent: boolean
  hasWorkshops: boolean
  requiresPermits: boolean
}

export interface Activity {
  id: string
  name: string
  type: 'workshop' | 'cultural_visit' | 'team_building' | 'reflection' | 'other'
  duration: number // hours
  isOutdoor: boolean
  requiresFacilitator: boolean
  description?: string
}

export interface TimelineOutput {
  preparation: {
    startDate: Date
    endDate: Date
    durationWeeks: number
  }
  exchange: {
    startDate: Date
    endDate: Date
    durationDays: number
  }
  followUp: {
    startDate: Date
    endDate: Date
    durationWeeks: number
  }
  phaseDates: Map<PhaseType, {
    startDate: Date
    endDate: Date
    deadline: Date
  }>
}

export interface BudgetOutput {
  totalBudget: number
  breakdown: {
    travel: number
    accommodation: number
    food: number
    activities: number
    staffing: number
    insurance: number
    permits: number
    application: number
    contingency: number
  }
  phaseAllocations: Map<string, number> // phaseId → budget
  justification: string
}

export interface RequirementsOutput {
  visas: {
    required: boolean
    countries: string[]
    type: 'schengen' | 'national' | 'none'
    deadline: Date
  }
  insurance: {
    required: boolean
    type: 'group_travel' | 'individual'
    coverage: string[]
  }
  permits: {
    required: boolean
    types: Array<{
      type: 'event' | 'venue' | 'food_handling' | 'public_assembly'
      reason: string
      authority: string
    }>
  }
  accessibility: {
    wheelchairAccess: boolean
    dietaryRestrictions: boolean
    languageSupport: string[]
  }
}

export interface PhaseTemplate {
  name: string
  type: PhaseType
  status: 'NOT_STARTED'
  start_date: Date
  end_date: Date
  deadline: Date
  budget_allocated: number
  budget_spent: 0
  order: number
  dependencies: string[] // Phase types
  editable: boolean
  skippable: boolean
}

export interface ChecklistTask {
  id: string
  description: string
  completed: boolean
  dueDate?: Date
  category: 'planning' | 'booking' | 'admin' | 'coordination'
  priority: 'high' | 'medium' | 'low'
}

export type PhaseType =
  | 'ACCOMMODATION'
  | 'TRAVEL'
  | 'FOOD'
  | 'ACTIVITIES'
  | 'EVENTS'
  | 'INSURANCE'
  | 'EMERGENCY_PLANNING'
  | 'PERMITS'
  | 'APPLICATION'
  | 'REPORTING'
  | 'CUSTOM'
```

---

## Testing Strategy

### Unit Tests

**1. Timeline Generator Tests**
```typescript
// project-pipeline/backend/src/tests/generators/timeline-generator.test.ts

describe('Timeline Generator', () => {
  it('should calculate preparation period 10 weeks before exchange', () => {
    const input = { exchangeStartDate: '2026-06-01', duration: 7, activities: [] }
    const result = generateTimeline(input)
    expect(result.preparation.startDate).toBe('2026-03-22') // 10 weeks before
  })

  it('should extend preparation to 12 weeks if visa required', () => {
    const input = {
      exchangeStartDate: '2026-06-01',
      duration: 7,
      activities: [],
      requiresVisa: true
    }
    const result = generateTimeline(input)
    expect(result.preparation.durationWeeks).toBe(12)
  })

  it('should calculate follow-up period 4 weeks after exchange', () => {
    const input = { exchangeStartDate: '2026-06-01', duration: 7, activities: [] }
    const result = generateTimeline(input)
    expect(result.followUp.endDate).toBe('2026-07-09') // 30 days after June 8
  })

  it('should set APPLICATION deadline 12 weeks before exchange', () => {
    const input = { exchangeStartDate: '2026-06-01', duration: 7, activities: [] }
    const result = generateTimeline(input)
    expect(result.phaseDates.get('APPLICATION').deadline).toBe('2026-03-08')
  })
})
```

**2. Budget Allocator Tests**
```typescript
// project-pipeline/backend/src/tests/generators/budget-allocator.test.ts

describe('Budget Allocator', () => {
  it('should apply base percentages for standard project', () => {
    const input = {
      totalBudget: 50000,
      participants: 30,
      duration: 7,
      destination: 'Barcelona, Spain',
      activities: [],
      hasLongDistanceTravel: false
    }
    const result = allocateBudget(input)

    expect(result.breakdown.travel).toBe(15000) // 30%
    expect(result.breakdown.accommodation).toBe(12500) // 25%
    expect(result.breakdown.food).toBe(7500) // 15%
  })

  it('should increase travel budget for long-distance projects', () => {
    const input = { ...baseInput, hasLongDistanceTravel: true }
    const result = allocateBudget(input)

    expect(result.breakdown.travel).toBeGreaterThan(15000)
    expect(result.breakdown.travel / result.totalBudget).toBeCloseTo(0.35)
  })

  it('should increase activities budget for workshop-heavy projects', () => {
    const input = {
      ...baseInput,
      activities: [
        { type: 'workshop' },
        { type: 'workshop' },
        { type: 'workshop' }
      ]
    }
    const result = allocateBudget(input)

    expect(result.breakdown.activities / result.totalBudget).toBeCloseTo(0.20)
  })

  it('should allocate contingency based on group size', () => {
    const smallGroup = allocateBudget({ ...baseInput, participants: 20 })
    const largeGroup = allocateBudget({ ...baseInput, participants: 60 })

    expect(largeGroup.breakdown.contingency).toBeGreaterThan(smallGroup.breakdown.contingency)
  })
})
```

**3. Requirements Analyzer Tests**
```typescript
// project-pipeline/backend/src/tests/generators/requirements-analyzer.test.ts

describe('Requirements Analyzer', () => {
  it('should require Schengen visa for Turkish participants to Spain', () => {
    const input = {
      participantCountries: ['TR'],
      destinationCountry: 'ES',
      activities: [],
      participants: 30
    }
    const result = analyzeRequirements(input)

    expect(result.visas.required).toBe(true)
    expect(result.visas.type).toBe('schengen')
    expect(result.visas.countries).toContain('TR')
  })

  it('should not require visa for EU citizens within EU', () => {
    const input = {
      participantCountries: ['DE', 'FR', 'IT'],
      destinationCountry: 'ES',
      activities: [],
      participants: 30
    }
    const result = analyzeRequirements(input)

    expect(result.visas.required).toBe(false)
  })

  it('should require group insurance for 10+ participants', () => {
    const input = { participants: 30, ...baseInput }
    const result = analyzeRequirements(input)

    expect(result.insurance.required).toBe(true)
    expect(result.insurance.type).toBe('group_travel')
    expect(result.insurance.coverage).toContain('medical')
  })

  it('should require event permit for public activities', () => {
    const input = {
      ...baseInput,
      isPublicEvent: true,
      activities: [{ type: 'public_event', name: 'Cultural Festival' }]
    }
    const result = analyzeRequirements(input)

    expect(result.permits.required).toBe(true)
    expect(result.permits.types).toContainEqual(
      expect.objectContaining({ type: 'event' })
    )
  })

  it('should require food handling permit for cooking activities', () => {
    const input = {
      ...baseInput,
      activities: [{ type: 'cooking_workshop', name: 'Cooking Class' }]
    }
    const result = analyzeRequirements(input)

    expect(result.permits.types).toContainEqual(
      expect.objectContaining({ type: 'food_handling' })
    )
  })
})
```

**4. Phase Generator Tests**
```typescript
// project-pipeline/backend/src/tests/generators/phase-generator.test.ts

describe('Phase Generator', () => {
  it('should create core phases for all projects', () => {
    const result = generatePhases(mockInput)

    const phaseTypes = result.phases.map(p => p.type)
    expect(phaseTypes).toContain('APPLICATION')
    expect(phaseTypes).toContain('ACCOMMODATION')
    expect(phaseTypes).toContain('TRAVEL')
    expect(phaseTypes).toContain('FOOD')
    expect(phaseTypes).toContain('REPORTING')
  })

  it('should create PERMITS phase when visa required', () => {
    const input = {
      ...mockInput,
      requirements: { visas: { required: true } }
    }
    const result = generatePhases(input)

    expect(result.phases).toContainEqual(
      expect.objectContaining({
        type: 'PERMITS',
        name: expect.stringMatching(/visa/i)
      })
    )
  })

  it('should create separate phases for each activity', () => {
    const input = {
      ...mockInput,
      seed: {
        activities: [
          { name: 'Workshop A', type: 'workshop' },
          { name: 'Workshop B', type: 'workshop' },
          { name: 'City Tour', type: 'cultural_visit' }
        ]
      }
    }
    const result = generatePhases(input)

    const activityPhases = result.phases.filter(p => p.type === 'ACTIVITIES')
    expect(activityPhases).toHaveLength(3)
  })

  it('should set correct dependencies between phases', () => {
    const result = generatePhases(mockInput)

    const travelPhase = result.phases.find(p => p.name.includes('Outbound'))
    expect(travelPhase.dependencies).toContain('INSURANCE')
    expect(travelPhase.dependencies).toContain('ACCOMMODATION')
  })

  it('should order phases correctly', () => {
    const result = generatePhases(mockInput)

    const orderedNames = result.phases
      .sort((a, b) => a.order - b.order)
      .map(p => p.type)

    expect(orderedNames.indexOf('APPLICATION')).toBeLessThan(
      orderedNames.indexOf('TRAVEL')
    )
    expect(orderedNames.indexOf('TRAVEL')).toBeLessThan(
      orderedNames.indexOf('REPORTING')
    )
  })
})
```

**5. Checklist Generator Tests**
```typescript
// project-pipeline/backend/src/tests/generators/checklist-generator.test.ts

describe('Checklist Generator', () => {
  it('should generate APPLICATION checklist with required tasks', () => {
    const phase = { type: 'APPLICATION', ...mockPhase }
    const result = generateChecklist({ phase, seed: mockSeed, requirements: mockRequirements })

    expect(result.tasks).toContainEqual(
      expect.objectContaining({ description: expect.stringMatching(/application/i) })
    )
    expect(result.tasks.some(t => t.priority === 'high')).toBe(true)
  })

  it('should generate ACCOMMODATION checklist with participant count', () => {
    const seed = { ...mockSeed, estimated_participants: 45 }
    const phase = { type: 'ACCOMMODATION', ...mockPhase }
    const result = generateChecklist({ phase, seed, requirements: mockRequirements })

    expect(result.tasks.some(t => t.description.includes('45'))).toBe(true)
  })

  it('should generate TRAVEL checklist with destination', () => {
    const seed = { ...mockSeed, current_version: { destination: 'Barcelona' } }
    const phase = { type: 'TRAVEL', ...mockPhase }
    const result = generateChecklist({ phase, seed, requirements: mockRequirements })

    expect(result.tasks.some(t => t.description.includes('Barcelona'))).toBe(true)
  })

  it('should set due dates for high-priority tasks', () => {
    const phase = { type: 'APPLICATION', deadline: new Date('2026-03-01'), ...mockPhase }
    const result = generateChecklist({ phase, seed: mockSeed, requirements: mockRequirements })

    const highPriorityTasks = result.tasks.filter(t => t.priority === 'high')
    expect(highPriorityTasks.some(t => t.dueDate)).toBe(true)
  })

  it('should include visa tasks when required', () => {
    const requirements = {
      ...mockRequirements,
      visas: { required: true, countries: ['TR'] }
    }
    const phase = { type: 'PERMITS', name: 'Visa Applications', ...mockPhase }
    const result = generateChecklist({ phase, seed: mockSeed, requirements })

    expect(result.tasks.some(t => t.description.toLowerCase().includes('visa'))).toBe(true)
  })
})
```

### Integration Tests

**File:** `project-pipeline/backend/src/tests/generators/integration.test.ts`

```typescript
describe('Project Generation Integration', () => {
  let testUser: User
  let testSeed: Seed

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: { email: 'test@example.com', name: 'Test User', password_hash: 'hash' }
    })

    // Create test seed with rich metadata
    testSeed = await prisma.seed.create({
      data: {
        user_id: testUser.id,
        title: "Barcelona Youth Exchange",
        description: "Cultural exchange program",
        estimated_participants: 30,
        estimated_duration: 7,
        tags: ['youth', 'exchange', 'culture'],
        current_version: {
          destination: 'Barcelona, Spain',
          participantCountries: ['TR', 'GR'],
          startDate: '2026-06-01',
          estimatedBudget: 50000,
          activities: [
            { name: 'Cultural Workshop', type: 'workshop', duration: 3 },
            { name: 'City Tour', type: 'cultural_visit', duration: 2 }
          ]
        }
      }
    })
  })

  afterEach(async () => {
    await prisma.project.deleteMany()
    await prisma.seed.deleteMany()
    await prisma.user.deleteMany()
  })

  it('should convert seed to complete project with all phases', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    // Project created
    expect(result.project).toBeDefined()
    expect(result.project.name).toBe("Barcelona Youth Exchange")
    expect(result.project.participants_count).toBe(30)

    // Phases created
    expect(result.phases.length).toBeGreaterThan(5)
    expect(result.phases).toContainEqual(
      expect.objectContaining({ type: 'APPLICATION' })
    )

    // Timeline generated
    expect(result.timeline.preparation).toBeDefined()
    expect(result.timeline.exchange.startDate).toEqual(new Date('2026-06-01'))

    // Budget allocated
    expect(result.budget.totalBudget).toBe(50000)
    expect(result.budget.breakdown.travel).toBeGreaterThan(0)

    // Requirements analyzed
    expect(result.requirements.visas.required).toBe(true) // Turkish participants
  })

  it('should create phases with checklists', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    const accommodationPhase = result.phases.find(p => p.type === 'ACCOMMODATION')
    expect(accommodationPhase).toBeDefined()
    expect(accommodationPhase.checklist).toBeDefined()

    const checklist = accommodationPhase.checklist as any
    expect(checklist.tasks.length).toBeGreaterThan(0)
    expect(checklist.tasks[0]).toHaveProperty('description')
    expect(checklist.tasks[0]).toHaveProperty('completed')
  })

  it('should create activity-specific phases', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    const activityPhases = result.phases.filter(p => p.type === 'ACTIVITIES')
    expect(activityPhases.length).toBe(2) // 2 activities in seed

    expect(activityPhases[0].name).toContain('Cultural Workshop')
    expect(activityPhases[1].name).toContain('City Tour')
  })

  it('should allocate budget across all phases', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    const totalAllocated = result.phases.reduce(
      (sum, phase) => sum + Number(phase.budget_allocated),
      0
    )

    expect(totalAllocated).toBeCloseTo(50000, -2) // Within 100 EUR
  })

  it('should set dependencies correctly', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    const travelPhase = result.phases.find(p => p.name.includes('Outbound'))
    expect(travelPhase.dependencies.length).toBeGreaterThan(0)

    // Travel should depend on insurance and accommodation
    const depPhases = result.phases.filter(p =>
      travelPhase.dependencies.includes(p.type)
    )
    expect(depPhases.some(p => p.type === 'INSURANCE')).toBe(true)
  })

  it('should validate against PRD example (Barcelona Youth Exchange)', async () => {
    const result = await convertSeedToProject(testSeed.id, testUser.id)

    // Timeline matches PRD example
    expect(result.timeline.preparation.durationWeeks).toBeGreaterThanOrEqual(10)
    expect(result.timeline.followUp.durationWeeks).toBe(4)

    // Budget breakdown reasonable
    expect(result.budget.breakdown.travel).toBeGreaterThan(10000)
    expect(result.budget.breakdown.accommodation).toBeGreaterThan(10000)

    // Visa phase exists (Turkish participants)
    expect(result.phases.some(p =>
      p.type === 'PERMITS' && p.name.toLowerCase().includes('visa')
    )).toBe(true)
  })
})
```

---

## Implementation Order

### Phase 1: Foundation (30 minutes)
1. Create directory structure: `generators/` and `tests/generators/`
2. Create `generators/types.ts` with all shared types
3. Set up test infrastructure with Vitest

### Phase 2: Core Generators (90 minutes)
4. Implement Timeline Generator + tests (20 min)
5. Implement Budget Allocator + tests (25 min)
6. Implement Requirements Analyzer + tests (25 min)
7. Implement Phase Generator + tests (20 min)

### Phase 3: Checklist System (30 minutes)
8. Implement Checklist Generator + tests (30 min)

### Phase 4: Orchestration (30 minutes)
9. Enhance `convertSeedToProject` in seeds.service.ts (20 min)
10. Update API endpoint response format (10 min)

### Phase 5: Integration & Testing (30 minutes)
11. Write integration test (15 min)
12. Run all tests and fix issues (10 min)
13. Manual testing with real seed data (5 min)

### Phase 6: Documentation (10 minutes)
14. Update API documentation
15. Add JSDoc comments to all functions

**Total:** 3.5 hours

---

## API Changes

### Endpoint: POST /api/seeds/:id/convert-to-project

**Request:**
```http
POST /api/seeds/cuid123/convert-to-project
Authorization: Bearer <jwt-token>
```

**Enhanced Response:**
```json
{
  "project": {
    "id": "proj_abc123",
    "name": "Barcelona Youth Exchange",
    "type": "STUDENT_EXCHANGE",
    "status": "PLANNING",
    "description": "A 7-day cultural exchange...",
    "start_date": "2026-03-22T00:00:00Z",
    "end_date": "2026-07-09T00:00:00Z",
    "budget_total": 50000,
    "participants_count": 30,
    "location": "Barcelona, Spain",
    "created_by": "user_xyz",
    "metadata": {
      "converted_from_seed_id": "cuid123",
      "original_approval_likelihood": 0.85,
      "timeline_summary": { ... },
      "budget_breakdown": { ... },
      "requirements_summary": { ... },
      "generation_timestamp": "2026-01-15T10:30:00Z"
    }
  },
  "phases": [
    {
      "id": "phase_1",
      "name": "Grant Application Preparation",
      "type": "APPLICATION",
      "status": "NOT_STARTED",
      "start_date": "2026-03-22T00:00:00Z",
      "end_date": "2026-03-08T00:00:00Z",
      "deadline": "2026-03-08T00:00:00Z",
      "budget_allocated": 500,
      "budget_spent": 0,
      "order": 1,
      "dependencies": [],
      "checklist": {
        "tasks": [
          {
            "id": "task_1",
            "description": "Review Erasmus+ application guidelines",
            "completed": false,
            "category": "planning",
            "priority": "high"
          },
          // ... more tasks
        ]
      },
      "editable": true,
      "skippable": false
    },
    // ... more phases
  ],
  "timeline": {
    "preparation": {
      "startDate": "2026-03-22T00:00:00Z",
      "endDate": "2026-05-31T00:00:00Z",
      "durationWeeks": 10
    },
    "exchange": {
      "startDate": "2026-06-01T00:00:00Z",
      "endDate": "2026-06-08T00:00:00Z",
      "durationDays": 7
    },
    "followUp": {
      "startDate": "2026-06-09T00:00:00Z",
      "endDate": "2026-07-09T00:00:00Z",
      "durationWeeks": 4
    }
  },
  "budget": {
    "totalBudget": 50000,
    "breakdown": {
      "travel": 15000,
      "accommodation": 12500,
      "food": 7500,
      "activities": 7500,
      "staffing": 4000,
      "insurance": 1500,
      "permits": 500,
      "application": 500,
      "contingency": 1000
    },
    "justification": "Budget allocated based on 30 participants, 7-day duration..."
  },
  "requirements": {
    "visas": {
      "required": true,
      "countries": ["TR"],
      "type": "schengen",
      "deadline": "2026-04-01T00:00:00Z"
    },
    "insurance": {
      "required": true,
      "type": "group_travel",
      "coverage": ["medical", "liability", "trip_cancellation"]
    },
    "permits": {
      "required": false,
      "types": []
    }
  }
}
```

**Error Responses:**
```json
// 404 - Seed not found
{
  "error": "Seed not found"
}

// 400 - Invalid seed data
{
  "error": "Insufficient metadata",
  "details": "Seed must have estimated_duration and estimated_participants"
}

// 500 - Generation error
{
  "error": "Failed to generate project",
  "details": "Timeline calculation failed: Invalid start date"
}
```

---

## Success Criteria

### Functional Requirements
- ✅ Timeline generator produces correct dates for all phases
- ✅ Budget allocator distributes total budget intelligently
- ✅ Requirements analyzer identifies visa/permit needs
- ✅ Phase generator creates all necessary phases
- ✅ Checklist generator populates phase tasks
- ✅ Project creation happens atomically in transaction
- ✅ API endpoint returns complete project data

### Quality Requirements
- ✅ All unit tests pass (>90% coverage)
- ✅ Integration test validates full conversion
- ✅ Generated project matches PRD example
- ✅ Performance: Conversion completes in <2 seconds
- ✅ Error handling for invalid/incomplete seed data
- ✅ JSDoc comments on all exported functions

### Business Requirements
- ✅ Generated timeline is realistic (8-12 week prep)
- ✅ Budget allocation follows Erasmus+ best practices
- ✅ Checklists are actionable and comprehensive
- ✅ Dependencies prevent illogical phase ordering
- ✅ Metadata preserved for audit trail

---

## Risk Mitigation

### Risk 1: Incomplete Seed Metadata
**Mitigation:** Use sensible defaults and validate required fields
```typescript
if (!seed.estimated_participants) {
  seed.estimated_participants = 20 // Default group size
}
if (!seed.estimated_duration) {
  throw new Error('Seed must have estimated_duration')
}
```

### Risk 2: Timeline Calculation Errors
**Mitigation:** Extensive date validation and unit tests
```typescript
if (exchangeStartDate < new Date()) {
  throw new Error('Exchange start date cannot be in the past')
}
```

### Risk 3: Budget Over-allocation
**Mitigation:** Assert total allocations equal total budget
```typescript
const allocated = phases.reduce((sum, p) => sum + p.budget_allocated, 0)
if (Math.abs(allocated - totalBudget) > 1) {
  throw new Error('Budget allocation mismatch')
}
```

### Risk 4: Database Transaction Failure
**Mitigation:** Wrap all operations in Prisma transaction
```typescript
await prisma.$transaction(async (tx) => {
  // All operations here
}, { timeout: 10000 })
```

---

## Rollout Plan

### Stage 1: Development (This PR)
- Implement all generators
- Write comprehensive tests
- Update API endpoint

### Stage 2: Testing (Next PR)
- Manual testing with real seed data
- QA review of generated projects
- Performance testing

### Stage 3: Frontend Integration (Part 2 - Issue #97)
- Update frontend to display timeline/budget
- Add "Convert to Project" button
- Show generation progress

### Stage 4: Enhancement (Part 4 - Issue #100)
- Add database schema enhancements
- Implement learning from user edits
- Add custom checklist templates

---

## Dependencies

### Upstream (Required)
- ✅ Part 1 (Issue #97) - Backend Seed Elaboration (COMPLETE)
- ✅ Existing Project/Phase models (COMPLETE)
- ✅ Prisma transaction support (COMPLETE)

### Downstream (Blocks)
- ⏳ Part 2 (Issue #98) - Frontend UI for conversion
- ⏳ Part 4 (Issue #100) - Database enhancements for learning

### Parallel (Can work simultaneously)
- Part 4 database changes can proceed in parallel
- This implementation uses existing schema initially

---

## Validation Against PRD

### PRD Example: Barcelona Youth Exchange
- **Input:**
  - Destination: Barcelona, Spain
  - Participants: 30 (Turkish students)
  - Duration: 7 days (June 1-7, 2026)
  - Activities: 3 workshops, 1 cultural visit
  - Budget: €50,000

- **Expected Output:**
  - Preparation: March 22 - May 31 (10 weeks)
  - Visa phase: Required (Turkish → Spain)
  - Travel phases: Outbound + Return
  - Budget: 30% travel, 25% accommodation, etc.
  - Checklists: ~5-7 tasks per phase

- **Validation:**
  - ✅ Timeline matches (10 week prep)
  - ✅ Visa requirement detected
  - ✅ Budget allocation follows rules
  - ✅ All phases created with checklists
  - ✅ Dependencies logical (travel after insurance)

---

## Code Review Checklist

Before submitting PR, verify:

- [ ] All 6 generator modules implemented
- [ ] All generator modules have unit tests
- [ ] Integration test covers full conversion flow
- [ ] `convertSeedToProject` enhanced with orchestration
- [ ] API endpoint tested manually
- [ ] Error handling for invalid inputs
- [ ] TypeScript types for all new interfaces
- [ ] JSDoc comments on exported functions
- [ ] No hardcoded values (use constants)
- [ ] Transaction rollback on failure
- [ ] Performance acceptable (<2s conversion)
- [ ] No breaking changes to existing API
- [ ] README updated with new features

---

## Next Steps After This PR

1. **Frontend Integration (Part 2 - Issue #98)**
   - Add "Convert to Project" button to Seed Detail page
   - Display timeline visualization
   - Show budget breakdown chart
   - Phase creation progress indicator

2. **Database Enhancements (Part 4 - Issue #100)**
   - Add `project_template` table for reusable patterns
   - Add `checklist_template` table for custom templates
   - Track user modifications to learn preferences
   - Implement smart suggestions based on history

3. **AI Enhancement**
   - Use LLM to generate context-aware checklist tasks
   - Personalize budget allocation based on user history
   - Suggest optimal timeline based on similar projects

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building the Project Generation Engine. The modular architecture (6 independent generators + orchestrator) ensures:

- **Testability:** Each generator can be unit tested in isolation
- **Maintainability:** Clear separation of concerns
- **Extensibility:** Easy to add new generators or enhance existing ones
- **Reliability:** Transaction-based atomic operations

The plan follows the PRD requirements precisely while providing sensible defaults and robust error handling. All success criteria from Issue #99 are addressed.

**Estimated total effort:** 3-4 hours
**Files to create:** 13
**Files to modify:** 2
**Lines of code:** ~1,500

Ready for implementation! 🚀
