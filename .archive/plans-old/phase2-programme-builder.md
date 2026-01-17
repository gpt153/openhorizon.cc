# Phase 2: Programme & Agenda Builder - Implementation Plan

**Feature**: AI-powered detailed programme generator for Erasmus+ Youth Exchange projects
**Priority**: HIGH - Critical for February 2025 application deadline
**Timeline**: 1-2 weeks
**Status**: Planning → Ready for Implementation

---

## Executive Summary

The Programme & Agenda Builder transforms high-level project concepts (from Phase 1) into detailed, day-by-day programmes with timetables, activities, materials, and facilitator notes. This is essential for both project implementation and grant application quality.

**Why This Feature Next:**
1. **Natural workflow progression** - Users have concepts, now need detailed plans
2. **High user value** - Saves 5-10 hours per project of manual planning
3. **Application requirement** - Detailed programmes improve evaluation scores
4. **Proven AI patterns** - Leverages same infrastructure as Phase 1
5. **Time-sensitive** - Applications due February 2025

**User Value:**
- Transform 1-paragraph activity outline into 7-10 day detailed schedule
- Generate age-appropriate activities with clear learning objectives
- Include logistics, materials, and facilitation notes
- Export ready-to-use daily schedules for team and participants
- Edit, reorder, or regenerate any session

---

## Current State Analysis

### ✅ What We Have (Phase 1)
- Complete project concepts with:
  - High-level activity outline (day-by-day themes)
  - Target group profile
  - Learning outcomes
  - Project objectives
  - Duration and participant count
  - Inclusion needs
- Working AI generation pipeline (Inngest + GPT-4)
- Database with projects table
- tRPC API infrastructure
- UI components library (shadcn/ui)

### 🎯 What We're Adding
- Detailed daily schedules (30-60 min time slots)
- Specific activity descriptions with methodology
- Materials and preparation checklists
- Facilitator notes and tips
- Interactive timeline/calendar UI
- Session editing and regeneration
- PDF export for team distribution

---

## User Stories

### Primary User Story
**As a** youth worker planning an Erasmus+ project
**I want to** generate a detailed daily programme from my project concept
**So that** I can have a ready-to-use schedule with activities, timings, and materials

**Acceptance Criteria:**
- Click "Build Programme" on project detail page
- AI generates 7-10 day detailed schedule (based on project duration)
- Each day shows time slots from 9:00 AM to 10:00 PM
- Each session includes:
  - Time (start/end)
  - Activity title and description
  - Learning objectives
  - Materials needed
  - Duration (30-90 minutes)
  - Facilitator notes
- Can edit any session inline
- Can regenerate individual days or sessions
- Can export as PDF or calendar format
- Programme auto-saves on changes

### Secondary User Stories

**Editing & Refinement:**
- Edit session times, titles, descriptions
- Drag-and-drop to reorder sessions
- Delete or duplicate sessions
- Add custom sessions manually
- Regenerate single sessions with AI

**Export & Sharing:**
- Export as PDF with daily breakdown
- Export to Google Calendar / iCal
- Print-friendly format
- Share view link with team (future)

**Quality & Validation:**
- Validate programme meets educational standards
- Check time allocations are realistic
- Ensure inclusion activities present
- Verify learning outcomes alignment

---

## Technical Architecture

### Database Schema

#### New Table: `programmes`

```sql
CREATE TABLE programmes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Programme metadata
  version INTEGER DEFAULT 1, -- Support multiple versions
  status VARCHAR(20) DEFAULT 'draft', -- draft, final, archived

  -- Generation metadata
  generated_from_concept JSONB, -- Snapshot of project concept used
  ai_model VARCHAR(50) DEFAULT 'gpt-4-turbo-preview',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT programmes_project_fk FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT programmes_tenant_fk FOREIGN KEY (tenant_id) REFERENCES organizations(id)
);

CREATE INDEX idx_programmes_project ON programmes(project_id);
CREATE INDEX idx_programmes_tenant ON programmes(tenant_id);
```

#### New Table: `programme_days`

```sql
CREATE TABLE programme_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,

  -- Day metadata
  day_number INTEGER NOT NULL, -- 1, 2, 3...
  date DATE, -- Actual date (optional, for scheduling)
  theme VARCHAR(200), -- Daily theme

  -- Day structure
  morning_focus VARCHAR(500), -- What's the morning about
  afternoon_focus VARCHAR(500), -- What's the afternoon about
  evening_focus VARCHAR(500), -- Evening activities

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT programme_days_programme_fk FOREIGN KEY (programme_id) REFERENCES programmes(id),
  CONSTRAINT unique_day_per_programme UNIQUE(programme_id, day_number)
);

CREATE INDEX idx_programme_days_programme ON programme_days(programme_id);
```

#### New Table: `programme_sessions`

```sql
CREATE TABLE programme_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programme_day_id UUID NOT NULL REFERENCES programme_days(id) ON DELETE CASCADE,

  -- Session timing
  start_time TIME NOT NULL, -- e.g., '09:00'
  end_time TIME NOT NULL, -- e.g., '10:30'
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ) STORED,

  -- Session content
  title VARCHAR(200) NOT NULL,
  description TEXT,
  activity_type VARCHAR(50), -- icebreaker, workshop, reflection, energizer, free_time, meal

  -- Educational metadata
  learning_objectives TEXT[], -- Array of objectives
  methodology VARCHAR(100), -- non-formal education method used

  -- Practical info
  materials_needed TEXT[], -- Array of materials
  preparation_notes TEXT, -- For facilitators
  space_requirements VARCHAR(200), -- indoor, outdoor, flexible
  group_size VARCHAR(50), -- whole group, small groups, pairs

  -- Inclusion & accessibility
  accessibility_notes TEXT,
  language_level VARCHAR(20), -- basic, intermediate, advanced

  -- Metadata
  order_index INTEGER, -- For sorting within day
  is_optional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT programme_sessions_day_fk FOREIGN KEY (programme_day_id) REFERENCES programme_days(id)
);

CREATE INDEX idx_programme_sessions_day ON programme_sessions(programme_day_id);
CREATE INDEX idx_programme_sessions_time ON programme_sessions(start_time);
```

#### Prisma Schema Addition

```prisma
model Programme {
  id                    String          @id @default(uuid()) @db.Uuid
  projectId             String          @map("project_id") @db.Uuid
  tenantId              String          @map("tenant_id") @db.Uuid

  version               Int             @default(1)
  status                ProgrammeStatus @default(DRAFT)

  generatedFromConcept  Json            @map("generated_from_concept")
  aiModel               String          @default("gpt-4-turbo-preview") @map("ai_model")

  createdAt             DateTime        @default(now()) @map("created_at")
  updatedAt             DateTime        @updatedAt @map("updated_at")

  // Relations
  project               Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  organization          Organization    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  days                  ProgrammeDay[]

  @@index([projectId])
  @@index([tenantId])
  @@map("programmes")
}

enum ProgrammeStatus {
  DRAFT
  FINAL
  ARCHIVED
}

model ProgrammeDay {
  id              String            @id @default(uuid()) @db.Uuid
  programmeId     String            @map("programme_id") @db.Uuid

  dayNumber       Int               @map("day_number")
  date            DateTime?         @db.Date
  theme           String?           @db.VarChar(200)

  morningFocus    String?           @map("morning_focus") @db.VarChar(500)
  afternoonFocus  String?           @map("afternoon_focus") @db.VarChar(500)
  eveningFocus    String?           @map("evening_focus") @db.VarChar(500)

  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")

  // Relations
  programme       Programme         @relation(fields: [programmeId], references: [id], onDelete: Cascade)
  sessions        ProgrammeSession[]

  @@unique([programmeId, dayNumber])
  @@index([programmeId])
  @@map("programme_days")
}

model ProgrammeSession {
  id                  String        @id @default(uuid()) @db.Uuid
  programmeDayId      String        @map("programme_day_id") @db.Uuid

  startTime           String        @map("start_time") @db.Time // Using String for Time
  endTime             String        @map("end_time") @db.Time

  title               String        @db.VarChar(200)
  description         String?       @db.Text
  activityType        ActivityType? @map("activity_type")

  learningObjectives  String[]      @map("learning_objectives")
  methodology         String?       @db.VarChar(100)

  materialsNeeded     String[]      @map("materials_needed")
  preparationNotes    String?       @map("preparation_notes") @db.Text
  spaceRequirements   String?       @map("space_requirements") @db.VarChar(200)
  groupSize           String?       @map("group_size") @db.VarChar(50)

  accessibilityNotes  String?       @map("accessibility_notes") @db.Text
  languageLevel       String?       @map("language_level") @db.VarChar(20)

  orderIndex          Int           @map("order_index")
  isOptional          Boolean       @default(false) @map("is_optional")

  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")

  // Relations
  day                 ProgrammeDay  @relation(fields: [programmeDayId], references: [id], onDelete: Cascade)

  @@index([programmeDayId])
  @@index([startTime])
  @@map("programme_sessions")
}

enum ActivityType {
  ICEBREAKER
  WORKSHOP
  REFLECTION
  ENERGIZER
  FREE_TIME
  MEAL
  PRESENTATION
  GROUP_WORK
  OUTDOOR
  CULTURAL
  INTERCULTURAL
  CREATIVE
  SPORTS
  DISCUSSION
}
```

---

## AI Generation Design

### Generation Pipeline (Inngest Function)

```typescript
// src/inngest/functions/generate-programme.ts

export const generateProgramme = inngest.createFunction(
  {
    id: 'programme.generate-from-concept',
    name: 'Generate Programme from Project Concept',
  },
  { event: 'programme.generate-from-concept' },
  async ({ event, step }) => {
    const { projectId, tenantId, userId } = event.data

    // Step 1: Load project and concept
    const project = await step.run('load-project', async () => {
      const project = await prisma.project.findUnique({
        where: { id: projectId, tenantId },
      })
      if (!project) throw new Error('Project not found')
      return project
    })

    // Step 2: Extract programme requirements from project DNA
    const programmeRequirements = await step.run('extract-requirements', async () => {
      return extractProgrammeRequirements(project)
    })

    // Step 3: Generate daily themes and structure
    const dailyStructure = await step.run('generate-daily-structure', async () => {
      return await generateDailyStructure(programmeRequirements)
    })

    // Step 4: Generate detailed sessions for each day
    const sessions = await step.run('generate-sessions', async () => {
      const allSessions = []
      for (const day of dailyStructure.days) {
        const daySessions = await generateDaySessionsAI(day, programmeRequirements)
        allSessions.push({ dayNumber: day.dayNumber, sessions: daySessions })
      }
      return allSessions
    })

    // Step 5: Save to database
    const programme = await step.run('save-programme', async () => {
      return await saveProgrammeToDatabase(
        project,
        dailyStructure,
        sessions,
        tenantId
      )
    })

    return { programmeId: programme.id }
  }
)
```

### AI Prompts

#### Prompt 1: Daily Structure Generator

```typescript
const DAILY_STRUCTURE_PROMPT = `You are an expert Erasmus+ Youth Exchange programme designer with 15+ years of experience in non-formal education.

CONTEXT:
Project: {projectTitle}
Duration: {durationDays} days
Participants: {participantCount} youth aged {ageRange}
Theme: {theme}
Objectives: {objectives}
Target Group Profile: {targetGroupProfile}
Inclusion Needs: {inclusionNeeds}

TASK:
Generate a day-by-day thematic structure for this youth exchange.

REQUIREMENTS:
1. Day 1 (Arrival):
   - Afternoon: Registration, welcome, introduction to venue
   - Evening: Icebreakers, programme overview, getting to know each other

2. Days 2-{durationDays-1} (Main Programme):
   - Each day should have a clear THEME that builds on the previous day
   - Morning: Usually more intensive learning (9:00-13:00)
   - Afternoon: Practical workshops or activities (14:00-18:00)
   - Evening: Reflection, cultural activities, or free time (19:00-22:00)
   - Include variety: workshops, outdoor activities, cultural visits, creative sessions
   - Ensure progression of learning (from basics to deeper engagement)

3. Day {durationDays} (Departure):
   - Morning: Final reflection, evaluation, certificates
   - Afternoon: Departure

EDUCATIONAL PRINCIPLES:
- Start with trust-building and team formation
- Progress from individual to group activities
- Mix energetic and reflective activities
- Include intercultural learning moments
- Build towards final outcomes/presentations
- Allow time for informal learning
- Consider energy levels (intensive vs. relaxed days)

OUTPUT FORMAT:
For each day, provide:
- day_number: 1, 2, 3...
- theme: One sentence theme for the day
- morning_focus: What participants will do/learn in the morning
- afternoon_focus: What participants will do/learn in the afternoon
- evening_focus: Evening activities and their purpose
- key_learning_outcomes: What participants should achieve by end of day

Generate the structure as a JSON array.`
```

#### Prompt 2: Session Generator (per day)

```typescript
const SESSION_GENERATOR_PROMPT = `You are creating detailed session plans for Day {dayNumber} of an Erasmus+ Youth Exchange.

DAY CONTEXT:
Theme: {dayTheme}
Morning Focus: {morningFocus}
Afternoon Focus: {afternoonFocus}
Evening Focus: {eveningFocus}

PROJECT CONTEXT:
Participants: {participantCount} youth aged {ageRange}
Profile: {targetProfile}
Language Levels: {languageLevels}
Inclusion Needs: {inclusionNeeds}
Cultural Mix: {countriesList}

TASK:
Generate detailed session plans for this day following this structure:

TIME BLOCKS:
- 09:00-09:30: Morning energizer
- 09:30-11:00: Morning session 1
- 11:00-11:30: Coffee break
- 11:30-13:00: Morning session 2
- 13:00-14:30: Lunch break
- 14:30-16:00: Afternoon session 1
- 16:00-16:30: Coffee/energizer break
- 16:30-18:00: Afternoon session 2
- 18:00-19:00: Free time
- 19:00-20:00: Dinner
- 20:00-22:00: Evening activity
- 22:00+: Free time

REQUIREMENTS FOR EACH SESSION:
1. Title: Engaging, clear title
2. Description: 2-3 sentences explaining the activity
3. Activity Type: (icebreaker, workshop, reflection, energizer, etc.)
4. Learning Objectives: 1-3 specific objectives
5. Methodology: Which non-formal education method (group work, simulation, role play, debate, creative expression, outdoor learning, etc.)
6. Materials Needed: Specific list (markers, flip charts, music, props, etc.)
7. Preparation Notes: What facilitators need to prepare beforehand
8. Space Requirements: Indoor/outdoor/flexible
9. Group Size: Whole group / Small groups (size) / Pairs / Individual
10. Accessibility Notes: How to adapt for different needs
11. Language Level: Basic/Intermediate/Advanced language proficiency needed

BEST PRACTICES:
- Start mornings with energizers (15-30 min)
- Main sessions should be 60-90 minutes
- Include breaks every 90 minutes
- Mix individual, pair, small group, and whole group activities
- Vary methodologies (don't repeat same format)
- Build intensity gradually (don't start with heavy content)
- End days with reflection or relaxed social activities
- Consider cultural sensitivity
- Include movement and physical activities
- Ensure accessibility for all participants

INCLUSION CONSIDERATIONS:
- Provide visual, auditory, and kinesthetic learning options
- Allow flexibility in participation levels
- Provide language support when needed
- Consider physical accessibility
- Respect cultural and religious needs
- Create safe, non-competitive environment

Generate sessions as a JSON array with all fields filled.`
```

---

## API Design (tRPC)

### New Router: `programmes`

```typescript
// src/server/routers/programmes.ts

import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { inngest } from '@/inngest/client'

export const programmesRouter = router({
  // Generate programme from project concept
  generateFromConcept: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify project exists and belongs to user's org
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Project not found or unauthorized')
      }

      // Check if programme already exists
      const existingProgramme = await ctx.prisma.programme.findFirst({
        where: {
          projectId: input.projectId,
          status: { not: 'ARCHIVED' },
        },
      })

      if (existingProgramme) {
        throw new Error('Programme already exists. Archive it first to regenerate.')
      }

      // Trigger background generation
      await inngest.send({
        name: 'programme.generate-from-concept',
        data: {
          projectId: input.projectId,
          tenantId: ctx.orgId,
          userId: ctx.userId,
        },
      })

      return { success: true, message: 'Programme generation started' }
    }),

  // Get programme by project ID
  getByProjectId: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const programme = await ctx.prisma.programme.findFirst({
        where: {
          projectId: input.projectId,
          tenantId: ctx.orgId,
        },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              sessions: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      })

      return programme
    }),

  // Update session
  updateSession: orgProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          learningObjectives: z.array(z.string()).optional(),
          materialsNeeded: z.array(z.string()).optional(),
          preparationNotes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify session belongs to user's org (through programme -> project -> tenant)
      const session = await ctx.prisma.programmeSession.findFirst({
        where: {
          id: input.sessionId,
          day: {
            programme: {
              tenantId: ctx.orgId,
            },
          },
        },
      })

      if (!session) {
        throw new Error('Session not found or unauthorized')
      }

      return await ctx.prisma.programmeSession.update({
        where: { id: input.sessionId },
        data: input.data,
      })
    }),

  // Regenerate specific day
  regenerateDay: orgProcedure
    .input(
      z.object({
        dayId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify and trigger regeneration
      await inngest.send({
        name: 'programme.regenerate-day',
        data: {
          dayId: input.dayId,
          tenantId: ctx.orgId,
        },
      })

      return { success: true }
    }),

  // Delete programme
  deleteProgramme: orgProcedure
    .input(
      z.object({
        programmeId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.prisma.programme.deleteMany({
        where: {
          id: input.programmeId,
          tenantId: ctx.orgId,
        },
      })

      if (deleted.count === 0) {
        throw new Error('Programme not found or unauthorized')
      }

      return { success: true }
    }),
})
```

---

## UI/UX Design

### Page Structure

#### 1. Project Detail Page Updates

**Add "Build Programme" Button:**
```tsx
// src/app/(dashboard)/projects/[id]/page.tsx

// Add to action buttons
<Button
  variant="default"
  size="sm"
  onClick={() => router.push(`/projects/${id}/programme/new`)}
  disabled={!project || hasProgramme}
>
  <Calendar className="mr-2 h-4 w-4" />
  {hasProgramme ? 'View Programme' : 'Build Programme'}
</Button>
```

#### 2. Programme Generation Page

```
/projects/[id]/programme/new
```

**Layout:**
- Loading screen during generation
- Shows progress: "Analyzing project... Generating daily structure... Creating sessions..."
- Estimated time: 60-90 seconds
- Redirect to programme view when complete

#### 3. Programme View/Edit Page

```
/projects/[id]/programme
```

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│ Header                                                   │
│ ← Back to Project | Programme for: [Project Title]      │
│                                                          │
│ [Export PDF] [Regenerate] [Archive]                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Day Tabs                                                 │
│ [Day 1: Arrival] [Day 2: Building Trust] [Day 3: ...]  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Timeline View (Selected Day)                            │
│                                                          │
│ 09:00 ┌────────────────────────────┐                   │
│       │ Morning Energizer          │ [Edit] [Regen]    │
│       │ Interactive name games     │                    │
│       │ 📝 Materials: Ball, music  │                    │
│ 09:30 └────────────────────────────┘                   │
│                                                          │
│       ┌────────────────────────────┐                   │
│       │ Expectations Workshop      │ [Edit] [Regen]    │
│       │ Setting group agreements   │                    │
│       │ 📝 Materials: Flip charts  │                    │
│ 11:00 └────────────────────────────┘                   │
│                                                          │
│       [Coffee Break]                                     │
│                                                          │
│ 11:30 ┌────────────────────────────┐                   │
│       │ Intercultural Exploration  │ [Edit] [Regen]    │
│       │ ...                        │                    │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Day tabs for navigation
- Timeline view showing all sessions
- Click session to expand/edit
- Drag to reorder (future)
- Add custom session button
- Regenerate individual sessions
- Export options (PDF, Calendar)

#### 4. Session Edit Modal

```tsx
<Dialog open={editingSession !== null}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Edit Session</DialogTitle>
    </DialogHeader>

    <form>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Time</Label>
            <Input type="time" value={startTime} />
          </div>
          <div>
            <Label>End Time</Label>
            <Input type="time" value={endTime} />
          </div>
        </div>

        <div>
          <Label>Title</Label>
          <Input value={title} />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea rows={4} value={description} />
        </div>

        <div>
          <Label>Activity Type</Label>
          <Select value={activityType}>
            <option value="workshop">Workshop</option>
            <option value="icebreaker">Icebreaker</option>
            <option value="reflection">Reflection</option>
            {/* ... */}
          </Select>
        </div>

        <div>
          <Label>Learning Objectives</Label>
          <TagInput value={learningObjectives} />
        </div>

        <div>
          <Label>Materials Needed</Label>
          <TagInput value={materialsNeeded} />
        </div>

        <div>
          <Label>Preparation Notes (for facilitators)</Label>
          <Textarea rows={3} value={preparationNotes} />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave}>Save Changes</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

## Implementation Steps

### Week 1: Database & Backend (4-5 days)

**Day 1: Database Setup**
- [ ] Update Prisma schema with new models
- [ ] Create and run migration
- [ ] Test database relationships
- [ ] Seed test data

**Day 2: AI Prompts & Logic**
- [ ] Create daily structure generator prompt
- [ ] Create session generator prompt
- [ ] Implement programme requirements extractor
- [ ] Test AI generation locally

**Day 3: Inngest Function**
- [ ] Create `generate-programme.ts` function
- [ ] Implement 5-step pipeline
- [ ] Add error handling and retries
- [ ] Test background generation

**Day 4-5: tRPC API**
- [ ] Create `programmes` router
- [ ] Implement all endpoints
- [ ] Add authorization checks
- [ ] Write tests

### Week 2: Frontend (5-6 days)

**Day 1: Programme Generation Page**
- [ ] Create `/projects/[id]/programme/new` page
- [ ] Add loading/progress UI
- [ ] Connect to tRPC mutation
- [ ] Test generation flow

**Day 2-3: Programme View**
- [ ] Create `/projects/[id]/programme` page
- [ ] Implement day tabs navigation
- [ ] Create timeline/schedule view
- [ ] Add session cards with expand/collapse
- [ ] Show all session details

**Day 4: Edit Functionality**
- [ ] Create session edit modal
- [ ] Implement inline editing
- [ ] Connect to update mutation
- [ ] Add validation

**Day 5: Polish & Export**
- [ ] Add regenerate day functionality
- [ ] Implement PDF export
- [ ] Add archive programme
- [ ] Polish UI/UX
- [ ] Add loading states

**Day 6: Testing & Bug Fixes**
- [ ] End-to-end testing
- [ ] Fix bugs
- [ ] Performance optimization
- [ ] Documentation

---

## Success Criteria

### Functional Requirements
- ✅ User can click "Build Programme" on any project
- ✅ Programme generates in 60-90 seconds
- ✅ Generated programme has 7-10 days (based on project)
- ✅ Each day has realistic time schedule (9 AM - 10 PM)
- ✅ Sessions include all required fields
- ✅ User can edit any session
- ✅ User can regenerate individual days
- ✅ Programme auto-saves on changes
- ✅ Can export as PDF

### Quality Requirements
- ✅ Generated activities are age-appropriate
- ✅ Time allocations are realistic (30-90 min sessions)
- ✅ Daily themes progress logically
- ✅ Includes variety of activity types
- ✅ Materials lists are specific and actionable
- ✅ Facilitator notes provide useful guidance
- ✅ Accessibility considerations included

### Technical Requirements
- ✅ Multi-tenancy enforced
- ✅ Type-safe throughout
- ✅ Background processing doesn't block UI
- ✅ Optimistic UI updates
- ✅ Error handling for AI failures
- ✅ Mobile-responsive design

---

## Risk Mitigation

### Risk 1: AI generates unrealistic schedules
**Mitigation:**
- Strict time constraints in prompts
- Validation logic for session durations
- Example-based prompting with good schedules

### Risk 2: Generation takes too long
**Mitigation:**
- Generate days in parallel (reduce from 90s to 30s)
- Cache common session types
- Show incremental progress

### Risk 3: Generated content lacks quality
**Mitigation:**
- Comprehensive prompts with Erasmus+ best practices
- Include real example programmes in prompt context
- Allow easy regeneration of any section

### Risk 4: Users want more customization
**Mitigation:**
- Make everything editable
- Add custom session creation
- Allow manual reordering (drag-drop future)

---

## Future Enhancements (Post-MVP)

### Phase 2.1: Advanced Features
- Drag-and-drop session reordering
- Session templates library
- Duplicate programmes across projects
- Compare multiple programme versions
- Collaborative editing (multiple users)

### Phase 2.2: Export & Integration
- Google Calendar export
- iCal format
- Integration with project management tools
- WhatsApp/Slack schedule sharing
- Participant-facing schedule view

### Phase 2.3: Quality Improvements
- Activity database integration (500+ activities)
- Smart suggestions based on similar projects
- Automatic validation (educational quality checks)
- Alternative session recommendations
- Resource links (videos, guides, etc.)

---

## Dependencies & Prerequisites

**Required:**
- ✅ Phase 1 complete (project concepts exist)
- ✅ Inngest configured and working
- ✅ GPT-4 API access
- ✅ Database schema migration capability

**Nice to Have:**
- Activity templates database
- Example programmes for RAG
- PDF generation library (react-pdf or similar)

---

## Deployment Plan

### Development
1. Feature branch: `feature/phase2-programme-builder`
2. Test with real project concepts
3. Iterate on AI prompts based on quality
4. User testing with 2-3 sample projects

### Production
1. Database migration
2. Deploy backend (API + Inngest function)
3. Deploy frontend
4. Monitor generation success rate
5. Collect user feedback

### Rollback Plan
- Programme feature is additive (doesn't break existing features)
- Can disable "Build Programme" button if issues
- Database rollback script prepared

---

## Estimated Timeline

**Week 1:** Backend (Database, AI, API)
**Week 2:** Frontend (UI, Editing, Export)

**Total:** 10-12 working days

---

## Next Steps

1. **Review this plan** - Any questions or changes needed?
2. **Approve database schema** - Confirm table structure works
3. **Start implementation** - Begin with database migration
4. **Iterative development** - Build, test, improve

---

**Ready to build this?** 🚀

Once approved, I'll start with:
1. Database migration
2. AI prompt creation
3. Inngest function implementation
4. tRPC router setup

Then move to frontend in Week 2!
