# Product Requirements Document: Intelligent Seed Elaboration System

**Version**: 2.0
**Date**: 2026-01-15
**Status**: Draft
**Owner**: OpenHorizon Pipeline Team

---

## Executive Summary

Transform the seed elaboration process from a manual, blank-canvas experience into an **intelligent, AI-driven requirements-gathering conversation** that automatically generates complete project skeletons with pre-populated phases, timelines, budgets, and checklists.

### Problem Statement

**Current State (Broken)**:
- Users create seeds with minimal info
- Seed elaboration AI returns errors (empty JSON responses)
- Converting seed → project creates empty project structure
- Users must manually create each phase
- No guidance on timeline, budget allocation, or requirements
- High friction = abandoned projects

**Desired State**:
- AI acts as expert project consultant during seed elaboration
- Conversational requirements gathering with intelligent Q&A
- Seed conversion automatically generates complete project skeleton
- Pre-populated phases (Travel, Food, Accommodation, Activities, etc.)
- Timeline calculated from duration and dates
- Budget allocated across phases
- Checklists pre-filled (visas, permits, insurance)
- Users refine rather than start from scratch

---

## Vision

### The Intelligent Planning Assistant

The AI should be an **expert in Erasmus+ Youth Exchange project planning** that:

1. **Asks clarifying questions** when user input is vague
2. **Makes intelligent suggestions** when user doesn't know
3. **Validates requirements** against Erasmus+ guidelines
4. **Calculates dependencies** (e.g., "You need travel insurance for 30 people")
5. **Generates realistic timelines** based on project scope
6. **Allocates budgets intelligently** across phases
7. **Identifies requirements** (visas, permits, accommodations)

### User Experience Flow

```
User: "I want to do a youth exchange about digital skills in Barcelona"
  ↓
AI: "Great idea! Let me help you plan this. A few questions:
     • How many participants? (16-60, Erasmus+ requirement)
     • What's your total budget? (I'll help allocate it)
     • How long should the exchange be? (5-21 days typical)
     • Which countries will participants come from?"
  ↓
User provides answers (or AI suggests if unsure)
  ↓
AI builds rich seed with metadata
  ↓
User clicks "Convert to Project" (one button)
  ↓
System generates COMPLETE project:
  ✓ Timeline calculated (Pre-travel, Exchange, Post-reporting)
  ✓ Phases created (Travel, Accommodation, Food, Activities, Insurance, Permits)
  ✓ Budget allocated (30% travel, 25% accommodation, 15% food, etc.)
  ✓ Checklists populated (Visas needed for X countries, etc.)
  ✓ AI agents ready to work on each phase
  ↓
User can immediately start refining (not building from scratch)
```

---

## Requirements

### 1. Conversational Seed Elaboration

#### 1.1 Intelligent Question Flow

**Requirement**: AI asks targeted questions to gather essential project information.

**Questions to Ask** (context-aware):
- **Participants**: "How many participants? (16-60)"
  - If user doesn't know → AI suggests: "For first-time exchanges, 20-30 is manageable"
- **Budget**: "What's your estimated budget?"
  - If user doesn't know → AI suggests: "Typical range is €300-500 per participant"
- **Duration**: "How many days for the exchange?"
  - If user doesn't know → AI suggests: "5-7 days is common for first exchanges"
- **Destination**: "Where will it take place?"
  - Extract requirements: visa needs, language barriers, travel complexity
- **Countries**: "Which countries will send participants?"
  - Calculate visa requirements, travel costs, language support needs
- **Activities**: "What will participants do?"
  - Suggest realistic activities based on budget/duration
- **Theme**: "What's the main learning focus?"
  - Align with EU priorities (digital, green, inclusion, health)

**Acceptance Criteria**:
- [ ] AI asks questions progressively (not all at once)
- [ ] User can answer in free-form text (AI extracts structured data)
- [ ] AI suggests defaults when user is uncertain
- [ ] AI validates answers against Erasmus+ requirements
- [ ] Conversation feels natural, not like a form

#### 1.2 Rich Metadata Collection

**Requirement**: Seed stores comprehensive metadata for auto-generation.

**Seed Schema Enhancement**:
```typescript
interface RichSeed extends GeneratedSeed {
  // Existing fields
  title: string
  description: string
  approvalLikelihood: number

  // NEW: Project Planning Metadata
  metadata: {
    // Participants
    participantCount: number // 16-60
    participantCountries: string[] // ["Sweden", "Spain", ...]
    ageRange: { min: number, max: number } // 13-30 typical

    // Dates & Duration
    duration: number // days
    startDate?: Date // Optional: user can specify or pick later
    endDate?: Date
    preparationWeeks?: number // Default 8-12 weeks

    // Budget
    totalBudget: number // EUR
    budgetBreakdown?: {
      travel: number
      accommodation: number
      food: number
      activities: number
      contingency: number
    }

    // Location
    destination: {
      country: string
      city: string
      venue?: string
    }

    // Requirements (AI-calculated)
    requirements: {
      visas: { country: string, needed: boolean }[]
      insurance: boolean
      permits: string[] // ["Event permit", "Food handling", ...]
      accessibility: string[] // Needs identified
    }

    // Activities
    activities: {
      name: string
      duration: string // "2 hours", "full day"
      budget?: number
    }[]

    // Validation
    erasmusPriorities: string[] // ["Digital", "Green", ...]
    completeness: number // 0-100% how ready for conversion
  }
}
```

**Acceptance Criteria**:
- [ ] All metadata fields stored in database
- [ ] Validation ensures required fields present before conversion
- [ ] Frontend displays completeness indicator (e.g., "80% ready to convert")

### 2. Automatic Project Generation

#### 2.1 Timeline Generation

**Requirement**: Auto-calculate phases based on duration, dates, and dependencies.

**Algorithm**:
```
Input: startDate, duration, activities
Output: Phase timeline with dates

Example:
- Start: June 1, 2026
- Duration: 7 days exchange + 2 travel days = 9 days
- Preparation: 10 weeks before

Generated Phases:
1. Preparation (March 22 - May 31):
   - Application forms
   - Visa applications
   - Travel booking
   - Insurance

2. Travel Out (May 31):
   - Departure day
   - Check-in

3. Exchange (June 1-7):
   - Day 1: Arrival & Orientation
   - Day 2-6: Activities
   - Day 7: Evaluation & Farewell

4. Travel Return (June 8):
   - Return travel

5. Follow-up (June 9 - July 9):
   - Reporting
   - Youthpass certificates
   - Dissemination
```

**Acceptance Criteria**:
- [ ] Phases created with correct dates
- [ ] Dependencies respected (e.g., visa before travel)
- [ ] Deadlines calculated (e.g., visa deadline 6 weeks before travel)
- [ ] Timeline visualized in Gantt chart

#### 2.2 Budget Allocation

**Requirement**: Intelligently distribute budget across phases.

**Allocation Rules**:
```typescript
function allocateBudget(totalBudget: number, participantCount: number): BudgetBreakdown {
  // Erasmus+ typical allocations
  const perParticipant = totalBudget / participantCount

  return {
    travel: totalBudget * 0.30,        // 30% travel (flights/trains)
    accommodation: totalBudget * 0.25, // 25% lodging
    food: totalBudget * 0.15,          // 15% meals
    activities: totalBudget * 0.15,    // 15% workshops/materials
    staffing: totalBudget * 0.10,      // 10% facilitators
    contingency: totalBudget * 0.05    // 5% emergency
  }
}
```

**Adjustments**:
- Long distance travel → increase travel %
- Budget hotel → increase accommodation %
- Workshop-heavy → increase activities %

**Acceptance Criteria**:
- [ ] Budget allocated to each phase
- [ ] User can see breakdown before conversion
- [ ] User can adjust allocations after generation
- [ ] Total always equals 100%

#### 2.3 Phase Generation

**Requirement**: Create phases with pre-populated details.

**Generated Phases**:

| Phase Type | Auto-Generated Content |
|------------|------------------------|
| **TRAVEL** | • Origin/destination extracted<br>• Travel dates calculated<br>• Budget allocated (30%)<br>• Checklist: Book tickets, group travel insurance |
| **ACCOMMODATION** | • Duration calculated<br>• Budget allocated (25%)<br>• Checklist: Book venue, confirm accessibility, meal arrangements |
| **FOOD** | • Meal count calculated (days × 3 meals)<br>• Budget allocated (15%)<br>• Checklist: Dietary restrictions, local vendors, catering |
| **ACTIVITIES** | • Activities from seed inserted<br>• Budget per activity<br>• Materials checklist |
| **INSURANCE** | • Group insurance for all participants<br>• Coverage requirements |
| **PERMITS** | • Event permits (if public activities)<br>• Food handling permits<br>• Venue permits |
| **APPLICATION** | • Erasmus+ form sections<br>• Deadlines calculated |
| **REPORTING** | • Youthpass preparation<br>• Final report deadline |

**Acceptance Criteria**:
- [ ] All relevant phases created automatically
- [ ] Each phase has name, dates, budget, checklist
- [ ] User can delete/modify generated phases
- [ ] User can add custom phases

#### 2.4 Requirements Checklist

**Requirement**: Auto-generate task checklists per phase.

**Examples**:

**Travel Phase Checklist**:
- [ ] Book flights for 30 participants (Origin → Barcelona)
- [ ] Arrange airport transfers
- [ ] Group travel insurance (30 people, 9 days)
- [ ] Travel itinerary shared with participants

**Visa Requirements** (AI-calculated):
- Swedish citizens → No visa (EU)
- Turkish participants → Schengen visa required (apply 8 weeks before)

**Acceptance Criteria**:
- [ ] Checklists auto-populated based on destination, countries, activities
- [ ] User can check off items
- [ ] Phase progress tracked (e.g., "3/7 checklist items complete")

### 3. AI Agent Integration

#### 3.1 Expert Guidance

**Requirement**: AI provides expert suggestions during elaboration.

**Capabilities**:
- **Budget Validation**: "For 30 participants to Barcelona, €15,000 is realistic. Breakdown: ..."
- **Timeline Validation**: "7 days is good for a first exchange. Consider adding 1 day for travel."
- **Activity Suggestions**: "For digital skills, consider: Workshop on video editing, Social media campaign creation, ..."
- **Risk Identification**: "Turkish participants need Schengen visas. Apply 8 weeks in advance."

**Tone**:
- Encouraging and collaborative
- Not prescriptive (offers options, not commands)
- Celebrates good ideas: "Great choice! Barcelona has excellent facilities for digital workshops."

**Acceptance Criteria**:
- [ ] AI provides suggestions at each step
- [ ] Suggestions are contextual and relevant
- [ ] User can accept/ignore suggestions
- [ ] AI explains rationale for suggestions

#### 3.2 Phase-Specific AI Agents

**Requirement**: After project generation, AI agents assist with each phase.

**Phase Agents**:
- **Travel Agent**: Search flights, compare prices, suggest routes
- **Food Agent**: Find catering, restaurants, accommodate dietary needs
- **Accommodation Agent**: Search hotels/hostels, check accessibility
- **Activity Agent**: Suggest activities, estimate costs, provide materials lists

**Integration**:
- Agents pre-seeded with project context (dates, participant count, budget)
- Agents can be invoked directly from phase detail pages
- Results populate phase tables (flights, hotels, etc.)

**Acceptance Criteria**:
- [ ] AI agents available in each phase
- [ ] Agents pre-filled with project context
- [ ] Results can be saved to phase
- [ ] User can compare multiple AI-generated options

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    SEED ELABORATION                     │
│                                                         │
│  User Input → Conversational AI → Rich Seed Metadata   │
│                                                         │
│  • Questions flow (progressive disclosure)              │
│  • Metadata extraction from natural language           │
│  • Validation against Erasmus+ rules                   │
│  • Completeness scoring (0-100%)                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  PROJECT GENERATION                     │
│                                                         │
│  Rich Seed → Generation Engine → Complete Project       │
│                                                         │
│  Generators:                                            │
│  • TimelineGenerator: Calculate phases & dates          │
│  • BudgetAllocator: Distribute budget across phases     │
│  • PhaseGenerator: Create phases with templates         │
│  • ChecklistGenerator: Build task lists                 │
│  • RequirementsAnalyzer: Identify visas, permits, etc.  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   PROJECT EXECUTION                     │
│                                                         │
│  Complete Project → AI Agents → Refined Project         │
│                                                         │
│  • User reviews generated phases                        │
│  • AI agents work on each phase (Travel, Food, etc.)    │
│  • User iterates and refines                            │
│  • Export to Erasmus+ application form                  │
└─────────────────────────────────────────────────────────┘
```

### New Backend Modules

#### 1. `seed-elaboration-agent.ts`
Conversational AI for requirements gathering.

**Responsibilities**:
- Ask progressive questions
- Extract structured data from free-form answers
- Suggest defaults when user uncertain
- Validate against Erasmus+ requirements
- Calculate completeness score

**Technology**: GPT-4 or Claude Sonnet 4.5 with structured output parsing

#### 2. `project-generator.ts`
Orchestrates auto-generation from seed.

**Functions**:
```typescript
async function generateProjectFromSeed(seed: RichSeed): Promise<Project> {
  const timeline = await generateTimeline(seed)
  const budget = await allocateBudget(seed)
  const phases = await generatePhases(seed, timeline, budget)
  const checklists = await generateChecklists(seed, phases)

  return {
    ...projectData,
    phases,
    timeline,
    budget,
    checklists
  }
}
```

#### 3. `timeline-generator.ts`
Calculates phase dates and dependencies.

#### 4. `budget-allocator.ts`
Distributes budget intelligently across phases.

#### 5. `requirements-analyzer.ts`
Identifies visas, permits, insurance needs based on destination and countries.

### Database Schema Changes

#### Seed Table Enhancement
```sql
ALTER TABLE seed ADD COLUMN metadata JSONB;

-- Metadata structure
{
  "participantCount": 30,
  "participantCountries": ["Sweden", "Turkey", "Poland"],
  "duration": 7,
  "startDate": "2026-06-01",
  "totalBudget": 15000,
  "destination": {
    "country": "Spain",
    "city": "Barcelona"
  },
  "requirements": {
    "visas": [
      { "country": "Turkey", "needed": true }
    ],
    "insurance": true,
    "permits": ["Event permit"]
  },
  "completeness": 85
}
```

#### Phase Table Enhancement
```sql
ALTER TABLE phase ADD COLUMN checklist JSONB;
ALTER TABLE phase ADD COLUMN auto_generated BOOLEAN DEFAULT FALSE;

-- Checklist structure
{
  "items": [
    {
      "id": "book-flights",
      "text": "Book flights for 30 participants",
      "completed": false,
      "deadline": "2026-04-15"
    },
    ...
  ]
}
```

---

## User Stories

### Epic 1: Intelligent Seed Elaboration

**US-1.1: Conversational Requirements Gathering**
```
AS A project coordinator
I WANT the AI to ask me questions about my project
SO THAT I don't have to figure out what information is needed
```

**Acceptance Criteria**:
- AI asks progressive questions (participants, budget, duration, etc.)
- I can answer in natural language
- AI suggests defaults if I'm unsure
- AI validates my answers against Erasmus+ rules

**US-1.2: Rich Seed with Metadata**
```
AS A project coordinator
I WANT my seed to store comprehensive project information
SO THAT the system can auto-generate a complete project
```

**Acceptance Criteria**:
- Seed stores participant count, budget, dates, destination
- Seed shows completeness score (e.g., "80% ready to convert")
- I can review all metadata before converting

### Epic 2: Automatic Project Generation

**US-2.1: One-Click Project Generation**
```
AS A project coordinator
I WANT to convert my seed to a complete project with one click
SO THAT I don't have to manually create phases
```

**Acceptance Criteria**:
- Click "Convert to Project" button
- System generates project with all phases
- Timeline calculated automatically
- Budget allocated across phases
- Checklists pre-populated

**US-2.2: Generated Timeline**
```
AS A project coordinator
I WANT the system to calculate phase dates automatically
SO THAT I have a realistic project timeline
```

**Acceptance Criteria**:
- Preparation phases scheduled before exchange
- Travel phases on correct dates
- Follow-up phases after exchange
- Deadlines calculated (visas, bookings, etc.)

**US-2.3: Budget Allocation**
```
AS A project coordinator
I WANT the system to allocate my budget across phases
SO THAT I know how much to spend on each activity
```

**Acceptance Criteria**:
- Budget distributed intelligently (30% travel, 25% accommodation, etc.)
- Each phase shows allocated budget
- I can adjust allocations manually
- Total always equals 100%

**US-2.4: Pre-Populated Checklists**
```
AS A project coordinator
I WANT each phase to have a checklist of tasks
SO THAT I know what needs to be done
```

**Acceptance Criteria**:
- Travel phase: "Book flights", "Get insurance", etc.
- Accommodation phase: "Book hotel", "Confirm accessibility", etc.
- I can check off completed tasks
- Phase progress shown (e.g., "3/7 tasks complete")

### Epic 3: AI Agent Assistance

**US-3.1: Phase-Specific AI Agents**
```
AS A project coordinator
I WANT AI agents to help with each phase
SO THAT I can quickly find options and make decisions
```

**Acceptance Criteria**:
- Travel Agent: Search flights, compare prices
- Food Agent: Find catering, restaurants
- Accommodation Agent: Search hotels, check accessibility
- Agents pre-filled with project context
- Results can be saved to phase

---

## Success Metrics

### User Experience Metrics
- **Time to First Project**: < 15 minutes (from seed idea to complete project)
  - Current: 2+ hours (manual phase creation)
  - Target: 15 minutes (AI-assisted)
- **Seed Completion Rate**: > 80% (seeds that get converted to projects)
  - Current: ~30% (users abandon due to complexity)
  - Target: 80% (with intelligent guidance)
- **User Satisfaction**: > 4.5/5 (post-conversion survey)

### System Performance Metrics
- **Seed Elaboration Response Time**: < 5 seconds per AI message
- **Project Generation Time**: < 10 seconds (seed → complete project)
- **AI Agent Response Time**: < 60 seconds (already achieved)

### Business Metrics
- **Projects Created**: +200% increase (from easier onboarding)
- **Erasmus+ Application Success Rate**: +30% (better planning = better applications)

---

## Implementation Phases

### Phase 1: Fix Current Bugs ✅ (Completed)
- [x] Fix seed elaboration empty JSON error
- [x] Fix phase validation datetime format
- [x] Rebuild backend and frontend

### Phase 2: Conversational Seed Elaboration (2 weeks)
- [ ] Design question flow and conversation logic
- [ ] Implement `seed-elaboration-agent.ts` with GPT-4
- [ ] Add metadata schema to Seed model
- [ ] Create frontend UI for conversational elaboration
- [ ] Add completeness indicator

### Phase 3: Project Generation Engine (2 weeks)
- [ ] Implement `timeline-generator.ts`
- [ ] Implement `budget-allocator.ts`
- [ ] Implement `phase-generator.ts` with templates
- [ ] Implement `checklist-generator.ts`
- [ ] Implement `requirements-analyzer.ts`
- [ ] Add "Convert to Project" button with generation

### Phase 4: Enhanced Phase Management (1 week)
- [ ] Add checklist UI to phase detail pages
- [ ] Add progress indicators (X/Y tasks complete)
- [ ] Allow user to edit generated phases
- [ ] Add ability to delete auto-generated phases

### Phase 5: AI Agent Integration (1 week)
- [ ] Pre-seed agents with project context
- [ ] Add "Ask AI" buttons in phase pages
- [ ] Save AI results directly to phases
- [ ] Add comparison view for multiple AI suggestions

### Phase 6: Testing & Refinement (1 week)
- [ ] User testing with real project coordinators
- [ ] Iterate on question flow based on feedback
- [ ] Optimize generation algorithms
- [ ] Performance testing

---

## Open Questions

1. **Question Sequencing**: Should questions be asked all at once (wizard-style) or progressively in conversation?
   - **Recommendation**: Progressive conversation feels more natural, but wizard is faster

2. **User Overrides**: How much should users be able to override auto-generation?
   - **Recommendation**: Full control - users can delete/modify any generated phase

3. **Default Values**: Should we provide "Quick Start" presets? (e.g., "Small Exchange Template", "Large Conference Template")
   - **Recommendation**: Yes - offer 3-4 templates as starting points

4. **AI Model Choice**: GPT-4 vs Claude Sonnet 4.5 for seed elaboration?
   - **Current**: Using GPT-4o (fixed)
   - **Consider**: Claude Sonnet 4.5 for better structured outputs

5. **Metadata Validation**: How strict should validation be?
   - **Recommendation**: Soft validation with warnings, not hard blocks

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **AI generates unrealistic timelines** | High | Add validation rules, test with real projects, allow user overrides |
| **Budget allocation not suitable for all project types** | Medium | Allow manual adjustment, learn from user edits over time |
| **User overwhelmed by too many questions** | High | Progressive disclosure, smart defaults, "Skip for now" option |
| **Generated checklists miss critical tasks** | High | Extensive testing, user feedback loop, allow custom checklist items |
| **Performance issues with complex generation** | Medium | Optimize algorithms, use background jobs for large projects |

---

## Appendix

### Example: Generated Project from Rich Seed

**Input Seed**:
```json
{
  "title": "Digital Skills Youth Exchange Barcelona",
  "metadata": {
    "participantCount": 30,
    "participantCountries": ["Sweden", "Turkey", "Poland"],
    "duration": 7,
    "startDate": "2026-06-01",
    "totalBudget": 15000,
    "destination": { "country": "Spain", "city": "Barcelona" },
    "activities": [
      { "name": "Video editing workshop", "duration": "2 days" },
      { "name": "Social media campaign", "duration": "2 days" },
      { "name": "Final presentation", "duration": "1 day" }
    ]
  }
}
```

**Generated Project**:
```json
{
  "name": "Digital Skills Youth Exchange Barcelona",
  "start_date": "2026-06-01",
  "end_date": "2026-06-07",
  "total_budget": 15000,
  "budget_breakdown": {
    "travel": 4500,
    "accommodation": 3750,
    "food": 2250,
    "activities": 2250,
    "contingency": 750
  },
  "phases": [
    {
      "name": "Preparation",
      "type": "APPLICATION",
      "start_date": "2026-03-22",
      "end_date": "2026-05-31",
      "budget_allocated": 0,
      "checklist": [
        "Submit Erasmus+ application",
        "Recruit participants",
        "Confirm team leaders"
      ]
    },
    {
      "name": "Travel to Barcelona",
      "type": "TRAVEL",
      "start_date": "2026-05-31",
      "end_date": "2026-06-01",
      "budget_allocated": 4500,
      "checklist": [
        "Book flights for 30 participants",
        "Arrange airport transfers",
        "Group travel insurance",
        "⚠️ Turkish participants need Schengen visa (apply by April 6)"
      ]
    },
    {
      "name": "Accommodation Barcelona",
      "type": "ACCOMMODATION",
      "start_date": "2026-06-01",
      "end_date": "2026-06-08",
      "budget_allocated": 3750,
      "checklist": [
        "Book hostel/hotel (30 people, 7 nights)",
        "Confirm accessibility",
        "Meal arrangements"
      ]
    },
    {
      "name": "Food & Catering",
      "type": "FOOD",
      "start_date": "2026-06-01",
      "end_date": "2026-06-07",
      "budget_allocated": 2250,
      "checklist": [
        "Breakfast arrangements (7 days × 30 people)",
        "Lunch caterer (7 days × 30 people)",
        "Dinner options (mix of group meals & free time)",
        "Collect dietary restrictions"
      ]
    },
    {
      "name": "Digital Skills Workshops",
      "type": "ACTIVITIES",
      "start_date": "2026-06-02",
      "end_date": "2026-06-06",
      "budget_allocated": 2250,
      "checklist": [
        "Video editing workshop materials (Day 1-2)",
        "Social media campaign materials (Day 3-4)",
        "Presentation equipment (Day 5)",
        "Facilitator fees",
        "Venue rental"
      ]
    },
    {
      "name": "Return Travel",
      "type": "TRAVEL",
      "start_date": "2026-06-08",
      "end_date": "2026-06-08",
      "budget_allocated": 0,
      "checklist": [
        "Confirm return flights",
        "Airport transfers"
      ]
    },
    {
      "name": "Follow-up & Reporting",
      "type": "REPORTING",
      "start_date": "2026-06-09",
      "end_date": "2026-07-09",
      "budget_allocated": 0,
      "checklist": [
        "Issue Youthpass certificates",
        "Submit final report to Erasmus+",
        "Dissemination activities",
        "Participant feedback survey"
      ]
    }
  ]
}
```

---

**End of PRD**
