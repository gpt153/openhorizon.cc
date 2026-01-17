# Implementation Plan: Idea-to-Project Generator (MVP First Feature)

**Feature**: AI-powered tool that transforms rough ideas into structured Erasmus+ Youth Exchange project concepts
**Priority**: CRITICAL - This is the entry point for users needing to plan 3-5 projects by February 2025
**Timeline**: 2-3 weeks (foundation + feature)
**Status**: Planning

---

## Executive Summary

The Idea-to-Project Generator is the first user-facing feature of the Open Horizon Project Companion. It enables users to input rough project ideas and receive structured Erasmus+ Youth Exchange (KA1) project concepts that meet program requirements and quality standards.

**Why this feature first:**
1. **Immediate value** - Users need to plan and apply for 3-5 projects by February 2025
2. **Entry point** - Project ideation is the first step in the Erasmus+ application journey
3. **AI showcase** - Demonstrates the platform's core value proposition (AI-driven expertise)
4. **Foundation builder** - Establishes Project DNA schema and core data models used by all other features

---

## Current State

**Repository**: `/home/samuel/workspace/openhorizon.cc`
- Greenfield project (only landing page content exists)
- No application code yet
- No package.json or framework setup
- README indicates npm-based project intended

**Existing Assets**:
- Landing page copy describing Open Horizon's services
- Comprehensive research documents in Archon knowledge base:
  - Erasmus+ program requirements (6,813 words)
  - Technology stack recommendations (14,853 words)
  - Multi-tenant architecture patterns (10,296 words)

---

## Target User Flow

1. **User** (Samuel or Open Horizon staff) logs in to dashboard
2. **User** clicks "Create New Project" → "Start from Idea"
3. **System** presents conversational interview form:
   - What age group? (13-17, 18-25, 26-30, mixed)
   - What theme/topic? (environment, digital skills, inclusion, arts, democracy, etc.)
   - Who is the target group? (general youth, fewer opportunities, specific needs)
   - How many participants? (16-60)
   - Duration preference? (5-21 days)
   - Partner countries/organizations in mind? (optional)
   - Special considerations? (accessibility, language support, etc.)
4. **System** (AI) generates structured project concept:
   - Project title and tagline
   - Objectives (aligned with Erasmus+ priorities)
   - Target group profile
   - Activity ideas and programme structure (day-by-day outline)
   - Learning outcomes
   - Inclusion and accessibility plan overview
   - Partner profile (what kind of organizations to involve)
   - Estimated budget range
   - Sustainability and impact narrative
5. **User** reviews, edits, and saves the concept
6. **System** creates Project record with Project DNA profile
7. **User** can proceed to refine programme, build application, or save as draft

---

## Technical Architecture

### Technology Stack (from research)

**Frontend**: Next.js 14+ with TypeScript
- Shadcn/ui + Tailwind CSS (UI components)
- React Hook Form + Zod (form validation)
- React Query (server state)
- Zustand (client state)

**Backend**: Next.js API routes + tRPC
- Full-stack TypeScript with end-to-end type safety
- Single deployment (Google Cloud Run)

**Database**: Supabase
- PostgreSQL 15+ (with pgvector extension)
- Row-level security for multi-tenancy
- Includes Auth, Storage, Realtime

**Auth**: Clerk
- Multi-tenant organizations
- Role-based access control
- User can belong to multiple orgs

**AI**: OpenAI GPT-4 + LangChain
- GPT-4 for generation quality
- LangChain for orchestration
- pgvector for RAG (retrieval of successful project examples)

**Background Jobs**: Inngest (for long-running AI generation)

**Deployment**: Google Cloud Run (containerized Next.js), Supabase (database + services)

### Multi-Tenancy Architecture

**CRITICAL**: Every table must include `tenant_id` from day one. Cannot be added later.

**Tenant Model**: Organization-based
- Open Horizon = tenant
- Client Org 1 = tenant
- Client Org 2 = tenant

**User Model**: Users can belong to multiple organizations
- Samuel needs access to Open Horizon + client organizations
- After login, user selects "acting as" organization

**Tenant Resolution**: Subdomain-based (for production)
- `openhorizon.app` (main landing page)
- `app.openhorizon.app` (Open Horizon internal workspace)
- `clientorg1.openhorizon.app` (Client Org 1 workspace)

For MVP: Path-based for simplicity (`/org/:orgId/...`)

---

## Data Model

### Core Tables

```typescript
// Tenant/Organization
table organizations {
  id: uuid (pk)
  name: string
  slug: string (unique) // for subdomain/path
  subscription_tier: enum('free', 'basic', 'pro')
  created_at: timestamp
  updated_at: timestamp
}

// Users (Clerk handles auth, we store org memberships)
table user_organization_memberships {
  id: uuid (pk)
  user_id: string (Clerk user ID)
  organization_id: uuid (fk -> organizations)
  role: enum('owner', 'admin', 'staff', 'partner', 'participant', 'guardian')
  created_at: timestamp
}

// Project DNA Schema (JSON in project table)
type ProjectDNA = {
  target_group: {
    age_range: string // "13-17", "18-25", "26-30", "mixed"
    size: number // 16-60
    profile: string // general, fewer_opportunities, specific_needs
    specific_needs: string[] // accessibility, language_support, etc.
  }

  theme: string // environment, digital, inclusion, arts, democracy, etc.

  inclusion_complexity: enum('low', 'medium', 'high')
  // low: general group, standard activities
  // medium: some participants with fewer opportunities
  // high: majority participants with complex support needs

  risk_level: enum('low', 'medium', 'high')
  // Based on activities, locations, participant needs

  digital_comfort: enum('low', 'medium', 'high')
  // Participant familiarity with digital tools

  language_needs: {
    primary: string[] // ["English", "Swedish"]
    translation_required: boolean
    interpretation_needed: boolean
  }

  green_ambition: enum('basic', 'moderate', 'high')
  // basic: follow minimum requirements
  // moderate: active green practices
  // high: green theme integrated throughout

  budget_flexibility: enum('tight', 'moderate', 'flexible')
  // Informs travel choices, venue selection

  partner_maturity: enum('new', 'experienced', 'mixed')
  // new: first Erasmus+ project
  // experienced: multiple successful projects
  // mixed: combination

  duration_preference: number // 5-21 days

  activity_intensity: enum('low', 'medium', 'high')
  // Hours per day, pacing, breaks needed
}

// Projects Table
table projects {
  id: uuid (pk)
  tenant_id: uuid (fk -> organizations, indexed) // CRITICAL: multi-tenancy
  created_by_user_id: string (Clerk user ID)

  title: string
  tagline: string
  status: enum('draft', 'concept', 'planning', 'application_draft', 'submitted', 'approved', 'in_progress', 'completed')

  project_dna: jsonb // ProjectDNA type above

  // Generated content from Idea-to-Project Generator
  objectives: jsonb // array of {text, erasmus_priority}
  target_group_description: text
  activity_outline: jsonb // day-by-day structure
  learning_outcomes: jsonb // array of outcomes
  inclusion_plan_overview: text
  partner_profile: text
  estimated_budget_range: jsonb // {min, max, currency}
  sustainability_narrative: text
  impact_narrative: text

  // Erasmus+ metadata
  erasmus_action: string // "KA1-Youth-Exchange"
  duration_days: number
  participant_count: number

  // Timestamps
  created_at: timestamp
  updated_at: timestamp

  // Indexes
  index(tenant_id, status)
  index(tenant_id, created_by_user_id)
}

// Project Generation Sessions (for tracking AI conversations)
table project_generation_sessions {
  id: uuid (pk)
  tenant_id: uuid (fk -> organizations)
  project_id: uuid (fk -> projects, nullable) // null until project created
  user_id: string (Clerk user ID)

  session_data: jsonb // conversation history, user inputs
  ai_model: string // "gpt-4-turbo-preview"
  generation_status: enum('in_progress', 'completed', 'failed')

  created_at: timestamp
  updated_at: timestamp
}
```

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model Organization {
  id                String   @id @default(uuid()) @db.Uuid
  name              String
  slug              String   @unique
  subscriptionTier  SubscriptionTier @default(FREE)
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  // Relations
  projects          Project[]
  userMemberships   UserOrganizationMembership[]
  generationSessions ProjectGenerationSession[]

  @@map("organizations")
}

enum SubscriptionTier {
  FREE
  BASIC
  PRO
}

model UserOrganizationMembership {
  id             String       @id @default(uuid()) @db.Uuid
  userId         String       @map("user_id") // Clerk user ID
  organizationId String       @map("organization_id") @db.Uuid
  role           UserRole
  createdAt      DateTime     @default(now()) @map("created_at")

  // Relations
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@index([userId])
  @@index([organizationId])
  @@map("user_organization_memberships")
}

enum UserRole {
  OWNER
  ADMIN
  STAFF
  PARTNER
  PARTICIPANT
  GUARDIAN
}

model Project {
  id                      String        @id @default(uuid()) @db.Uuid
  tenantId                String        @map("tenant_id") @db.Uuid
  createdByUserId         String        @map("created_by_user_id")

  title                   String
  tagline                 String?
  status                  ProjectStatus @default(DRAFT)

  projectDna              Json          @map("project_dna") // ProjectDNA type

  // Generated content
  objectives              Json?
  targetGroupDescription  String?       @map("target_group_description") @db.Text
  activityOutline         Json?         @map("activity_outline")
  learningOutcomes        Json?         @map("learning_outcomes")
  inclusionPlanOverview   String?       @map("inclusion_plan_overview") @db.Text
  partnerProfile          String?       @map("partner_profile") @db.Text
  estimatedBudgetRange    Json?         @map("estimated_budget_range")
  sustainabilityNarrative String?       @map("sustainability_narrative") @db.Text
  impactNarrative         String?       @map("impact_narrative") @db.Text

  // Erasmus+ metadata
  erasmusAction           String        @map("erasmus_action")
  durationDays            Int           @map("duration_days")
  participantCount        Int           @map("participant_count")

  createdAt               DateTime      @default(now()) @map("created_at")
  updatedAt               DateTime      @updatedAt @map("updated_at")

  // Relations
  organization            Organization  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  generationSessions      ProjectGenerationSession[]

  @@index([tenantId, status])
  @@index([tenantId, createdByUserId])
  @@map("projects")
}

enum ProjectStatus {
  DRAFT
  CONCEPT
  PLANNING
  APPLICATION_DRAFT
  SUBMITTED
  APPROVED
  IN_PROGRESS
  COMPLETED
}

model ProjectGenerationSession {
  id                String              @id @default(uuid()) @db.Uuid
  tenantId          String              @map("tenant_id") @db.Uuid
  projectId         String?             @map("project_id") @db.Uuid
  userId            String              @map("user_id")

  sessionData       Json                @map("session_data")
  aiModel           String              @map("ai_model")
  generationStatus  GenerationStatus    @map("generation_status") @default(IN_PROGRESS)

  createdAt         DateTime            @default(now()) @map("created_at")
  updatedAt         DateTime            @updatedAt @map("updated_at")

  // Relations
  organization      Organization        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project           Project?            @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([tenantId, userId])
  @@index([projectId])
  @@map("project_generation_sessions")
}

enum GenerationStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
}
```

---

## AI Orchestration Strategy

### LangChain Chain Architecture

```typescript
// lib/ai/chains/idea-to-project.ts

import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "langchain/output_parsers"
import { z } from "zod"

// Step 1: Analyze user inputs and extract Project DNA
const projectDnaExtractionChain = createChain({
  model: "gpt-4-turbo-preview",
  systemPrompt: `You are an expert Erasmus+ Youth Exchange project designer...

  Based on user inputs, extract and structure project DNA including:
  - Target group characteristics
  - Inclusion complexity assessment
  - Risk level evaluation
  - Theme alignment with Erasmus+ priorities
  ...`,

  outputSchema: z.object({
    projectDna: ProjectDNASchema,
    confidence: z.number(), // 0-1
    missingInfo: z.array(z.string()) // what questions to ask next
  })
})

// Step 2: Generate project concept from Project DNA
const projectConceptGenerationChain = createChain({
  model: "gpt-4-turbo-preview",
  temperature: 0.8, // creative
  systemPrompt: `You are crafting an Erasmus+ Youth Exchange project concept...

  Requirements from research:
  - Promote intercultural dialogue and European identity
  - Build life and professional competencies
  - Combat stereotypes, encourage civic engagement
  - Include 4 phases: Planning, Preparation, Implementation, Follow-up
  - Address horizontal dimensions: inclusion, sustainability, digital, democracy

  Evaluation criteria (100 points):
  - Relevance & Impact (30 points)
  - Project Design (40 points)
  - Project Management (30 points)

  Generate:
  1. Title (impactful, clear)
  2. Tagline (one sentence)
  3. Objectives (3-5, aligned with Erasmus+ priorities)
  4. Activity outline (day-by-day high-level structure for {duration} days)
  5. Learning outcomes (specific, measurable)
  6. Inclusion plan overview
  7. Partner profile (what organizations to involve)
  8. Sustainability narrative
  9. Impact narrative`,

  inputVariables: ["projectDna", "theme", "duration", "participants"],

  outputSchema: ProjectConceptSchema
})

// Step 3: RAG - Retrieve similar successful projects for inspiration
const retrieveSimilarProjectsChain = createChain({
  vectorStore: supabaseVectorStore, // pgvector
  similarityThreshold: 0.7,
  maxResults: 3,

  // Embed user's theme + target group, search for similar past projects
  queryTransform: (inputs) => `
    Erasmus+ youth exchange project
    Theme: ${inputs.theme}
    Age: ${inputs.ageRange}
    Participants: ${inputs.participantCount}
    Complexity: ${inputs.inclusionComplexity}
  `
})

// Combined orchestration
export async function generateProjectFromIdea(
  userInputs: UserIdeaInputs,
  tenantId: string,
  userId: string
): Promise<ProjectConcept> {

  // 1. Extract Project DNA from user inputs
  const { projectDna, missingInfo } = await projectDnaExtractionChain.invoke({
    userInputs
  })

  // If critical info missing, ask follow-up questions (multi-turn conversation)
  if (missingInfo.length > 0) {
    return { status: 'needs_more_info', questions: missingInfo }
  }

  // 2. Retrieve similar successful projects (RAG)
  const similarProjects = await retrieveSimilarProjectsChain.invoke({
    theme: projectDna.theme,
    ageRange: projectDna.target_group.age_range,
    participantCount: projectDna.target_group.size,
    inclusionComplexity: projectDna.inclusion_complexity
  })

  // 3. Generate project concept
  const concept = await projectConceptGenerationChain.invoke({
    projectDna,
    theme: projectDna.theme,
    duration: projectDna.duration_preference,
    participants: projectDna.target_group.size,
    similarProjects // provide as examples/inspiration
  })

  // 4. Save to database
  const project = await db.project.create({
    data: {
      tenantId,
      createdByUserId: userId,
      projectDna,
      ...concept,
      status: 'CONCEPT',
      erasmusAction: 'KA1-Youth-Exchange',
      durationDays: projectDna.duration_preference,
      participantCount: projectDna.target_group.size
    }
  })

  return { status: 'success', project }
}
```

### Prompt Templates

**Project DNA Extraction Prompt:**
```
You are an expert Erasmus+ Youth Exchange project designer with deep knowledge of:
- Erasmus+ Programme Guide 2025 requirements
- Youth Exchange (KA1) eligibility criteria
- Quality standards and evaluation criteria
- Inclusion and accessibility best practices

The user wants to create a new Erasmus+ Youth Exchange project. Based on their inputs, extract structured Project DNA.

User Inputs:
{userInputs}

Extract and return:
1. Target group profile (age, size, characteristics, special needs)
2. Theme (aligned with Erasmus+ priorities: inclusion, participation, sustainability, digital transformation)
3. Inclusion complexity assessment (low/medium/high based on support needs)
4. Risk level (low/medium/high based on activities, age group, locations)
5. Digital comfort level of target group
6. Language needs (primary languages, translation required?)
7. Green ambition (basic/moderate/high - environmental focus)
8. Budget flexibility (tight/moderate/flexible)
9. Partner maturity (new to Erasmus+ / experienced / mixed)
10. Duration preference (5-21 days)
11. Activity intensity (low/medium/high - pacing, hours per day)

Also assess:
- Confidence level (0-1): How complete is the information?
- Missing info: What critical questions should we ask next?

Output as JSON matching ProjectDNA schema.
```

**Project Concept Generation Prompt:**
```
You are crafting an Erasmus+ Youth Exchange project concept that will compete for EU funding.

PROJECT DNA:
{projectDnaJson}

SIMILAR SUCCESSFUL PROJECTS (for inspiration):
{similarProjectsJson}

ERASMUS+ REQUIREMENTS (Key Action 1 - Youth Exchanges):

Eligibility:
- 2+ organizations from different countries
- 16-60 participants aged 13-30
- 5-21 days duration (excluding travel)
- Activities in participating countries

Quality Standards:
- Active involvement of young people in all phases
- Clear learning outcome identification and documentation (Youthpass)
- Inclusion and accessibility design
- Safe, respectful, non-discriminatory environment

Evaluation Criteria (100 points total, 60 minimum to pass):
1. RELEVANCE & IMPACT (30 points):
   - Organizational experience
   - EU Youth Dialogue alignment
   - Inclusion practices
   - Anticipated outcomes

2. PROJECT DESIGN (40 points):
   - Clear phase descriptions (Planning, Preparation, Implementation, Follow-up)
   - Participant diversity
   - Sustainable practices
   - Appropriate learning methods
   - Outcome documentation plan

3. PROJECT MANAGEMENT (30 points):
   - Practical arrangements
   - Participant safety measures
   - Organizational cooperation
   - Evaluation planning
   - Result dissemination

Horizontal Dimensions (must address):
- Inclusion: accessible design for participants with fewer opportunities
- Environmental Sustainability: eco-friendly practices, low-emission transport
- Digital Transformation: integration of digital tools
- Democratic Participation: civic engagement, value promotion

GENERATE:

1. **Title**: Impactful, clear, reflects theme and objectives (5-10 words)

2. **Tagline**: One compelling sentence summarizing the project's essence

3. **Objectives** (3-5 objectives):
   - Align with Erasmus+ priorities
   - Specific, measurable, achievable
   - Connect to target group needs
   - Format: {text: string, erasmus_priority: string}

4. **Target Group Description** (150-200 words):
   - Who they are (age, background, characteristics)
   - Why this project is relevant for them
   - What needs/challenges it addresses
   - Inclusion considerations

5. **Activity Outline** (day-by-day structure for {duration} days):
   - Balance learning blocks, youth-led activities, reflection, breaks
   - Include low-stimulation alternatives (for inclusion)
   - Incorporate all horizontal dimensions
   - Format: [{day: number, morning: string, afternoon: string, evening: string}]

6. **Learning Outcomes** (5-8 outcomes):
   - Skills, competencies, knowledge participants will gain
   - Aligned with non-formal learning principles
   - Documentable through Youthpass
   - Format: [{category: string, outcome: string}]

7. **Inclusion Plan Overview** (100-150 words):
   - Accessibility measures
   - Support for participants with fewer opportunities
   - Adaptation strategies
   - Dietary, sensory, communication adjustments

8. **Partner Profile** (100-150 words):
   - What kind of organizations to involve
   - Required expertise/experience
   - Geographic distribution
   - Complementary strengths

9. **Estimated Budget Range**:
   - Based on Erasmus+ unit costs:
     - Organizational: €125/participant
     - Travel: €28-€1,735 (distance-based)
     - Individual: €41-€83/day (country-based)
     - Inclusion: €125/participant with fewer opportunities
   - Format: {min: number, max: number, currency: "EUR", breakdown: object}

10. **Sustainability Narrative** (80-100 words):
    - Green practices during project
    - Sustainable transport approach
    - Environmental consciousness integration
    - Long-term environmental impact

11. **Impact Narrative** (80-100 words):
    - Impact on participants (skills, confidence, networks)
    - Impact on organizations (capacity, partnerships)
    - Impact on communities (dissemination, follow-up)
    - Potential for future cooperation

Output as JSON matching ProjectConcept schema.

Make the concept compelling, realistic, and aligned with Erasmus+ values: inclusion, participation, sustainability, quality.
```

---

## UI/UX Design

### Wizard-Style Interview Form

**Step 1: Project Basics**
```
┌─────────────────────────────────────────────────┐
│  Create New Project                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  Let's start with the basics                    │
│                                                  │
│  What's your project theme or topic?            │
│  ┌──────────────────────────────────────────┐  │
│  │ e.g., environmental sustainability,      │  │
│  │ digital skills, inclusion and diversity  │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Or choose from common themes:                   │
│  [ Environment ] [ Digital ] [ Inclusion ]      │
│  [ Arts & Culture ] [ Democracy ] [ Health ]    │
│  [ Entrepreneurship ] [ Sport ] [ Other ]       │
│                                                  │
│                    [Cancel]  [Next: Participants]│
└─────────────────────────────────────────────────┘
```

**Step 2: Target Group**
```
┌─────────────────────────────────────────────────┐
│  Create New Project                   [2 of 5]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  Who are your participants?                      │
│                                                  │
│  Age group:                                      │
│  ( ) 13-17 years (young adolescents)            │
│  ( ) 18-25 years (young adults)                 │
│  ( ) 26-30 years (older youth)                  │
│  (•) Mixed ages                                  │
│                                                  │
│  How many participants?                          │
│  ┌──────────────────────────────────────────┐  │
│  │ [30]  ←────────────────────────────→     │  │
│  │       16                            60     │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  Target group profile:                           │
│  ( ) General youth population                   │
│  ( ) Youth with fewer opportunities             │
│  (•) Specific needs (e.g., accessibility)       │
│                                                  │
│  If specific needs, describe:                    │
│  ┌──────────────────────────────────────────┐  │
│  │ Visual impairments, wheelchair users     │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│              [Back]  [Cancel]  [Next: Duration] │
└─────────────────────────────────────────────────┘
```

**Step 3: Duration & Logistics**
```
┌─────────────────────────────────────────────────┐
│  Create New Project                   [3 of 5]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  Project duration & logistics                    │
│                                                  │
│  How long should the exchange be?                │
│  ┌──────────────────────────────────────────┐  │
│  │ [10] days  ←────────────────────────→    │  │
│  │             5                        21    │  │
│  └──────────────────────────────────────────┘  │
│  (excluding travel days)                         │
│                                                  │
│  Activity intensity:                             │
│  ( ) Low (relaxed pace, many breaks)            │
│  (•) Medium (balanced schedule)                  │
│  ( ) High (intensive programme)                 │
│                                                  │
│  Green ambition:                                 │
│  ( ) Basic (meet minimum requirements)          │
│  (•) Moderate (active green practices)           │
│  ( ) High (green theme throughout)               │
│                                                  │
│            [Back]  [Cancel]  [Next: Partners]   │
└─────────────────────────────────────────────────┘
```

**Step 4: Partners**
```
┌─────────────────────────────────────────────────┐
│  Create New Project                   [4 of 5]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  Partner organizations                           │
│                                                  │
│  Do you have partner organizations in mind?      │
│  ( ) Yes, I have partners confirmed             │
│  (•) Not yet, need suggestions                   │
│  ( ) Some confirmed, need more                   │
│                                                  │
│  Partner experience level:                       │
│  ( ) All new to Erasmus+                        │
│  (•) Mixed (new and experienced)                 │
│  ( ) All experienced                             │
│                                                  │
│  Preferred partner countries (optional):         │
│  ┌──────────────────────────────────────────┐  │
│  │ Germany, Italy, Poland                    │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│         [Back]  [Cancel]  [Next: Additional]    │
└─────────────────────────────────────────────────┘
```

**Step 5: Additional Considerations**
```
┌─────────────────────────────────────────────────┐
│  Create New Project                   [5 of 5]  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│  Final details                                   │
│                                                  │
│  Language considerations:                        │
│  Primary language(s):                            │
│  ┌──────────────────────────────────────────┐  │
│  │ English, Swedish                          │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  [✓] Translation support needed                  │
│  [ ] Professional interpretation required        │
│                                                  │
│  Digital comfort level of participants:          │
│  ( ) Low (limited digital experience)           │
│  (•) Medium (comfortable with basics)            │
│  ( ) High (digitally savvy)                     │
│                                                  │
│  Budget flexibility:                             │
│  ( ) Tight (minimum costs)                      │
│  (•) Moderate (reasonable spending)              │
│  ( ) Flexible (quality prioritized)             │
│                                                  │
│  Any other important information?                │
│  ┌──────────────────────────────────────────┐  │
│  │ Participants have experience with art     │  │
│  │ projects but not international exchanges  │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│              [Back]  [Cancel]  [Generate →]     │
└─────────────────────────────────────────────────┘
```

### Generation Progress Screen

```
┌─────────────────────────────────────────────────┐
│  Generating Your Project Concept                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                  │
│         ⟳  AI is crafting your project...       │
│                                                  │
│  [████████████████░░░░░░░░░░░░] 60%            │
│                                                  │
│  ✓ Analyzing your inputs                        │
│  ✓ Searching for similar successful projects    │
│  ⟳ Generating objectives and activities...      │
│  ○ Creating inclusion plan                      │
│  ○ Estimating budget                            │
│  ○ Finalizing concept                           │
│                                                  │
│  This may take 30-60 seconds.                    │
│                                                  │
│                              [Cancel Generation] │
└─────────────────────────────────────────────────┘
```

### Generated Concept Review Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Project Concept Generated ✨                    [Edit] [Save]│
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                              │
│  🎯 Digital Horizons: Empowering Visually                   │
│     Impaired Youth Through Technology                        │
│                                                              │
│  Tagline: Creating accessible digital futures through        │
│  hands-on learning and intercultural exchange               │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  📋 OVERVIEW                                                 │
│                                                              │
│  Participants: 30 young people (18-25 years)                │
│  Duration: 10 days + 2 travel days                          │
│  Theme: Digital inclusion and accessibility                  │
│  Estimated Budget: €32,000 - €38,000                        │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🎯 OBJECTIVES                                               │
│                                                              │
│  1. Develop digital literacy skills adapted for visual      │
│     impairments (screen readers, assistive tech)             │
│     → Erasmus+ Priority: Digital transformation             │
│                                                              │
│  2. Foster intercultural understanding and combat            │
│     stereotypes about disability                             │
│     → Erasmus+ Priority: Inclusion & diversity              │
│                                                              │
│  3. Build confidence and self-advocacy skills through        │
│     peer learning and shared experiences                     │
│     → Erasmus+ Priority: Active participation               │
│                                                              │
│  4. Create accessible digital content (podcasts,             │
│     audio guides) as project outputs                         │
│     → Erasmus+ Priority: Civic engagement                   │
│                                                              │
│  [View all 5 objectives...]                                  │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  👥 TARGET GROUP                                             │
│                                                              │
│  This project is designed for young people aged 18-25       │
│  with visual impairments, including blind and low-vision    │
│  participants. Many face barriers to digital participation   │
│  due to inaccessible technology and lack of adapted         │
│  training. The exchange will...                              │
│                                                              │
│  [Read more...]                                              │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  📅 ACTIVITY OUTLINE (10 days)                               │
│                                                              │
│  Day 1: Arrival & Welcome                                    │
│  • Morning: Airport pickup, accommodation orientation       │
│  • Afternoon: Icebreaker activities (audio-based games)     │
│  • Evening: Welcome dinner, group agreements                 │
│                                                              │
│  Day 2: Digital Accessibility Basics                         │
│  • Morning: Workshop on screen readers (JAWS, NVDA)         │
│  • Afternoon: Hands-on practice with accessible websites    │
│  • Evening: Cultural night - Sweden                          │
│                                                              │
│  [View all 10 days...]                                       │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🧠 LEARNING OUTCOMES                                        │
│                                                              │
│  Digital Competence:                                         │
│  • Navigate and create content using assistive technology    │
│  • Evaluate digital tools for accessibility                  │
│                                                              │
│  Intercultural Awareness:                                    │
│  • Understand disability experiences across cultures         │
│  • Communicate effectively in diverse groups                 │
│                                                              │
│  [View all 8 outcomes...]                                    │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ♿ INCLUSION PLAN                                            │
│                                                              │
│  Accessibility Measures:                                     │
│  • All venues wheelchair accessible                          │
│  • Audio descriptions for all visual materials               │
│  • Tactile materials for workshops                           │
│  • Guide dogs welcome, quiet spaces available               │
│  • Assistive technology provided (screen readers, braille)   │
│                                                              │
│  Support:                                                    │
│  • 1 support person per 5 participants                       │
│  • Orientation training for staff on visual impairment       │
│  • Dietary needs accommodated (halal, vegan, allergies)     │
│                                                              │
│  [Read full inclusion plan...]                               │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🤝 PARTNER PROFILE                                          │
│                                                              │
│  Seek organizations with:                                    │
│  • Experience working with youth with disabilities           │
│  • Access to assistive technology resources                  │
│  • Commitment to inclusion and accessibility                 │
│  • Capacity for quality programme delivery                   │
│                                                              │
│  Suggested partner countries: Germany (strong disability     │
│  rights framework), Italy (cultural exchange), Poland        │
│  (growing accessibility sector)                              │
│                                                              │
│  [Read more...]                                              │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  💰 ESTIMATED BUDGET                                         │
│                                                              │
│  Organizational Support: €3,750 (30 participants × €125)    │
│  Travel Costs: €18,000 - €22,000 (distance-based)           │
│  Individual Support: €8,100 - €10,800 (10 days subsistence) │
│  Inclusion Support: €3,750 (30 participants × €125)         │
│  Assistive Technology: €2,000 (exceptional costs)           │
│                                                              │
│  TOTAL: €35,600 - €42,300                                   │
│                                                              │
│  [View detailed breakdown...]                                │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🌱 SUSTAINABILITY NARRATIVE                                 │
│                                                              │
│  Environmental sustainability is integrated throughout:      │
│  • Train travel prioritized over flights where feasible      │
│  • Reusable materials for workshops (braille, audio)         │
│  • Digital outputs reduce need for printed materials         │
│  • Local, seasonal food sourcing                             │
│  • Carbon offset for necessary flights                       │
│                                                              │
│  [Read more...]                                              │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  🚀 IMPACT NARRATIVE                                         │
│                                                              │
│  Participants: Gain digital skills, confidence, and          │
│  international networks. Increased employability through     │
│  tech competencies and soft skills.                          │
│                                                              │
│  Organizations: Build capacity in accessible programme       │
│  delivery, establish international partnerships, create      │
│  reusable training materials.                                │
│                                                              │
│  Communities: Dissemination through podcasts and audio       │
│  guides created by participants. Awareness raising about     │
│  digital inclusion.                                          │
│                                                              │
│  [Read more...]                                              │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│                                                              │
│  Actions:                                                    │
│  [ Regenerate Concept ]  [ Edit Manually ]  [ Save as Draft]│
│  [ Proceed to Programme Builder → ]                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 0: Foundation Setup (Week 1)

**Goal**: Establish development environment and core infrastructure

**Tasks**:
1. **Initialize Next.js Project**
   ```bash
   npx create-next-app@latest open-horizon-companion --typescript --tailwind --app --use-npm
   cd open-horizon-companion
   ```

2. **Install Dependencies**
   ```bash
   # Core
   npm install @clerk/nextjs @prisma/client @tanstack/react-query zustand zod react-hook-form @hookform/resolvers

   # UI
   npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select class-variance-authority clsx tailwind-merge lucide-react

   # AI
   npm install @langchain/openai @langchain/community langchain zod-to-json-schema

   # tRPC
   npm install @trpc/server @trpc/client @trpc/react-query @trpc/next superjson

   # Dev
   npm install -D prisma @types/node
   ```

3. **Set Up Supabase Project**
   - Create Supabase project: https://app.supabase.com
   - Enable pgvector extension
   - Copy connection string
   - Set up `.env.local`:
     ```
     DATABASE_URL="postgresql://..."
     DIRECT_URL="postgresql://..."
     NEXT_PUBLIC_SUPABASE_URL="https://..."
     NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
     ```

4. **Set Up Clerk**
   - Create Clerk application: https://dashboard.clerk.com
   - Enable "Organizations" feature
   - Copy API keys
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
     CLERK_SECRET_KEY="sk_..."
     ```

5. **Initialize Prisma**
   ```bash
   npx prisma init
   ```
   - Copy Prisma schema from data model above
   - Run migration:
     ```bash
     npx prisma migrate dev --name init
     npx prisma generate
     ```

6. **Configure tRPC**
   - Create `src/server/trpc.ts` (context, router setup)
   - Create `src/server/routers/_app.ts` (root router)
   - Create `src/app/api/trpc/[trpc]/route.ts` (API handler)
   - Create `src/lib/trpc/client.ts` (client setup)

7. **Set Up Shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   ```
   - Install components:
     ```bash
     npx shadcn-ui@latest add button dialog form input label select textarea progress card
     ```

8. **Configure OpenAI**
   - Get API key: https://platform.openai.com/api-keys
   - Add to `.env.local`:
     ```
     OPENAI_API_KEY="sk-..."
     ```

**Deliverables**:
- ✅ Next.js app running locally
- ✅ Supabase database connected
- ✅ Clerk authentication working
- ✅ Prisma schema migrated
- ✅ tRPC endpoints scaffolded
- ✅ UI components library ready

**Time**: 2-3 days

---

### Phase 1: Core Feature Implementation (Week 2-3)

**Goal**: Build Idea-to-Project Generator end-to-end

#### 1.1 Frontend: Wizard Form (3-4 days)

**Files to Create**:
```
src/app/(auth)/projects/new/page.tsx                 # Main wizard page
src/components/project-wizard/ProjectWizard.tsx      # Wizard container
src/components/project-wizard/steps/BasicsStep.tsx   # Step 1
src/components/project-wizard/steps/TargetGroupStep.tsx # Step 2
src/components/project-wizard/steps/DurationStep.tsx # Step 3
src/components/project-wizard/steps/PartnersStep.tsx # Step 4
src/components/project-wizard/steps/AdditionalStep.tsx # Step 5
src/components/project-wizard/GenerationProgress.tsx  # Loading screen
src/lib/schemas/project-wizard.ts                     # Zod schemas
src/hooks/useProjectWizard.ts                         # State management
```

**Implementation**:
- Multi-step form with React Hook Form + Zod
- Client-side state with Zustand
- Progress indicator
- Form validation per step
- Responsive design (mobile-friendly)

**Testing**:
- Can navigate between steps
- Form validation works
- Data persists across steps
- Cancel resets form
- Submit triggers generation

#### 1.2 Backend: tRPC API (2-3 days)

**Files to Create**:
```
src/server/routers/projects.ts                        # Project router
src/server/services/project-generator.ts              # AI orchestration
src/lib/ai/chains/project-dna-extraction.ts           # DNA extraction chain
src/lib/ai/chains/project-concept-generation.ts       # Concept generation chain
src/lib/ai/prompts/project-dna.ts                     # DNA prompt template
src/lib/ai/prompts/project-concept.ts                 # Concept prompt template
```

**tRPC Router**:
```typescript
// src/server/routers/projects.ts
export const projectsRouter = router({
  generateFromIdea: protectedProcedure
    .input(UserIdeaInputsSchema)
    .mutation(async ({ input, ctx }) => {
      // 1. Create generation session
      const session = await ctx.db.projectGenerationSession.create({
        data: {
          tenantId: ctx.organization.id,
          userId: ctx.user.id,
          sessionData: input,
          aiModel: "gpt-4-turbo-preview",
          generationStatus: "IN_PROGRESS"
        }
      })

      // 2. Trigger background job (Inngest)
      await inngest.send({
        name: "project.generate-from-idea",
        data: { sessionId: session.id }
      })

      return { sessionId: session.id }
    }),

  getGenerationStatus: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const session = await ctx.db.projectGenerationSession.findUnique({
        where: { id: input.sessionId },
        include: { project: true }
      })

      return {
        status: session.generationStatus,
        project: session.project
      }
    }),

  // ... more endpoints
})
```

**Inngest Background Job**:
```typescript
// src/inngest/functions/generate-project.ts
export const generateProjectFromIdea = inngest.createFunction(
  { id: "project.generate-from-idea" },
  { event: "project.generate-from-idea" },
  async ({ event, step }) => {

    // Step 1: Load session
    const session = await step.run("load-session", async () => {
      return db.projectGenerationSession.findUnique({
        where: { id: event.data.sessionId }
      })
    })

    // Step 2: Extract Project DNA
    const projectDna = await step.run("extract-dna", async () => {
      return extractProjectDNA(session.sessionData)
    })

    // Step 3: Retrieve similar projects (RAG)
    const similarProjects = await step.run("retrieve-similar", async () => {
      return retrieveSimilarProjects(projectDna)
    })

    // Step 4: Generate concept
    const concept = await step.run("generate-concept", async () => {
      return generateProjectConcept(projectDna, similarProjects)
    })

    // Step 5: Save project
    const project = await step.run("save-project", async () => {
      return db.project.create({
        data: {
          tenantId: session.tenantId,
          createdByUserId: session.userId,
          projectDna,
          ...concept,
          status: "CONCEPT",
          erasmusAction: "KA1-Youth-Exchange",
          durationDays: projectDna.duration_preference,
          participantCount: projectDna.target_group.size
        }
      })
    })

    // Step 6: Update session
    await step.run("update-session", async () => {
      return db.projectGenerationSession.update({
        where: { id: session.id },
        data: {
          projectId: project.id,
          generationStatus: "COMPLETED"
        }
      })
    })

    return { projectId: project.id }
  }
)
```

#### 1.3 AI Integration: LangChain Chains (3-4 days)

**Project DNA Extraction Chain**:
```typescript
// src/lib/ai/chains/project-dna-extraction.ts
import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "langchain/output_parsers"
import { ProjectDNASchema } from "@/lib/schemas/project-dna"

export async function extractProjectDNA(
  userInputs: UserIdeaInputs
): Promise<ProjectDNA> {

  const model = new ChatOpenAI({
    modelName: "gpt-4-turbo-preview",
    temperature: 0.3, // lower for consistent extraction
    openAIApiKey: process.env.OPENAI_API_KEY
  })

  const parser = StructuredOutputParser.fromZodSchema(ProjectDNASchema)

  const prompt = PromptTemplate.fromTemplate(`
    You are an expert Erasmus+ Youth Exchange project designer...

    {format_instructions}

    User Inputs:
    {userInputs}

    Extract structured Project DNA as JSON.
  `)

  const chain = prompt.pipe(model).pipe(parser)

  const result = await chain.invoke({
    userInputs: JSON.stringify(userInputs, null, 2),
    format_instructions: parser.getFormatInstructions()
  })

  return result
}
```

**Project Concept Generation Chain**:
```typescript
// src/lib/ai/chains/project-concept-generation.ts
import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { StructuredOutputParser } from "langchain/output_parsers"
import { ProjectConceptSchema } from "@/lib/schemas/project-concept"
import { projectConceptPrompt } from "@/lib/ai/prompts/project-concept"

export async function generateProjectConcept(
  projectDna: ProjectDNA,
  similarProjects: SimilarProject[]
): Promise<ProjectConcept> {

  const model = new ChatOpenAI({
    modelName: "gpt-4-turbo-preview",
    temperature: 0.8, // higher for creativity
    openAIApiKey: process.env.OPENAI_API_KEY
  })

  const parser = StructuredOutputParser.fromZodSchema(ProjectConceptSchema)

  const prompt = PromptTemplate.fromTemplate(projectConceptPrompt)

  const chain = prompt.pipe(model).pipe(parser)

  const result = await chain.invoke({
    projectDnaJson: JSON.stringify(projectDna, null, 2),
    similarProjectsJson: JSON.stringify(similarProjects, null, 2),
    duration: projectDna.duration_preference,
    participants: projectDna.target_group.size,
    format_instructions: parser.getFormatInstructions()
  })

  return result
}
```

**RAG: Retrieve Similar Projects**:
```typescript
// src/lib/ai/chains/retrieve-similar-projects.ts
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { OpenAIEmbeddings } from "@langchain/openai"
import { createClient } from "@supabase/supabase-js"

export async function retrieveSimilarProjects(
  projectDna: ProjectDNA
): Promise<SimilarProject[]> {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY
  })

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName: "project_embeddings",
    queryName: "match_projects"
  })

  // Create search query from Project DNA
  const query = `
    Erasmus+ youth exchange project
    Theme: ${projectDna.theme}
    Age: ${projectDna.target_group.age_range}
    Participants: ${projectDna.target_group.size}
    Inclusion: ${projectDna.inclusion_complexity}
    Duration: ${projectDna.duration_preference} days
  `

  const results = await vectorStore.similaritySearch(query, 3)

  return results.map(doc => ({
    title: doc.metadata.title,
    objectives: doc.metadata.objectives,
    activities: doc.metadata.activities,
    outcomes: doc.metadata.outcomes
  }))
}
```

**Testing**:
- DNA extraction returns valid schema
- Concept generation produces complete project
- RAG retrieves relevant examples
- Error handling works
- Generation takes <60 seconds

#### 1.4 Frontend: Concept Review (2-3 days)

**Files to Create**:
```
src/app/(auth)/projects/[id]/page.tsx                 # Project detail page
src/components/project-concept/ConceptReview.tsx      # Review UI
src/components/project-concept/sections/ObjectivesSection.tsx
src/components/project-concept/sections/ActivityOutlineSection.tsx
src/components/project-concept/sections/InclusionSection.tsx
src/components/project-concept/sections/BudgetSection.tsx
... (one component per section)
```

**Implementation**:
- Render generated concept in readable format
- Expandable sections
- Edit mode (inline editing with optimistic updates)
- Regenerate button (triggers new AI generation)
- Save as draft
- Proceed to next step (Programme Builder - future feature)

**Testing**:
- All sections render correctly
- Edit mode works
- Regenerate creates new concept
- Save persists changes
- Loading states work

---

### Phase 2: Testing & Refinement (Week 3)

#### 2.1 Integration Testing (2 days)

**Test Scenarios**:
1. **Happy Path**: User completes wizard → AI generates concept → User saves
2. **Validation**: Invalid inputs → Form shows errors → User corrects
3. **Generation Failure**: AI error → User sees friendly message → Can retry
4. **Cancellation**: User cancels mid-wizard → Data not saved
5. **Edit & Regenerate**: User edits concept → Saves → Regenerates → New version

**Tools**:
- Playwright for E2E tests
- React Testing Library for component tests
- tRPC testing utilities for API tests

#### 2.2 AI Prompt Refinement (2 days)

**Process**:
1. Test with diverse inputs (different themes, ages, complexity)
2. Evaluate generated concepts against Erasmus+ criteria
3. Refine prompts based on quality issues
4. Iterate until concepts are consistently good (>80% acceptance rate)

**Quality Metrics**:
- Objectives align with Erasmus+ priorities
- Activities are realistic and age-appropriate
- Inclusion plan is comprehensive
- Budget estimates are accurate
- Language is clear and compelling

#### 2.3 UX Polish (1 day)

- Smooth transitions between steps
- Loading states and progress indicators
- Error messages are helpful
- Success confirmations
- Mobile responsive
- Accessibility (keyboard navigation, screen readers)

---

## Success Criteria

### MVP Success (End of Week 3)

✅ **Feature Complete**:
- User can input project idea via wizard
- AI generates structured Erasmus+ project concept
- User can review and edit generated concept
- Concept is saved to database with Project DNA

✅ **Quality Thresholds**:
- AI generation succeeds >95% of time
- Generated concepts meet Erasmus+ requirements (manual review)
- Generation completes in <60 seconds
- UI is intuitive (no user confusion in testing)

✅ **Technical Soundness**:
- Multi-tenancy works (tested with 2 organizations)
- Database schema supports future features
- AI prompts are version-controlled
- Error handling prevents data loss
- Costs are within budget (<$100 for testing)

✅ **Ready for Next Feature**:
- Can proceed to Programme & Agenda Builder
- Can proceed to Application Form Builder
- Foundation supports autopilot levels (future)

---

## Risk Mitigation

### Risk 1: AI Generation Quality is Inconsistent

**Mitigation**:
- Start with high-quality prompt templates (based on research)
- Use structured output parsing (Zod schemas) to enforce format
- Implement RAG with example projects to guide AI
- Allow regeneration (users can try again if not satisfied)
- Collect user feedback (thumbs up/down on generated concepts)

### Risk 2: Generation Takes Too Long (>60 seconds)

**Mitigation**:
- Use background jobs (Inngest) with status polling
- Show detailed progress (step-by-step updates)
- Optimize prompts (reduce token count where possible)
- Use GPT-4 Turbo (faster than GPT-4)
- Consider streaming responses (show concept as it's generated)

### Risk 3: Costs Exceed Budget

**Mitigation**:
- Monitor OpenAI usage closely
- Set spending limits in OpenAI dashboard
- Use caching for similar queries (future optimization)
- Consider GPT-3.5 for less critical parts (DNA extraction)
- Track cost per generation ($0.50-$1.00 estimated)

### Risk 4: Database Schema Needs Changes

**Mitigation**:
- Over-design schema initially (JSON fields for flexibility)
- Use Prisma migrations (easy to modify)
- Test multi-tenancy thoroughly early
- Document schema decisions
- Plan for versioning (Project DNA may evolve)

### Risk 5: User Confusion (Wizard is Complex)

**Mitigation**:
- Conduct user testing with Samuel early
- Provide examples/hints in form fields
- Allow saving draft mid-wizard
- Clear progress indicators
- Skip/optional fields for non-critical info

---

## Post-MVP: Next Features

Once Idea-to-Project Generator is complete, proceed to:

1. **Programme & Agenda Builder** (Week 4-5)
   - Day-by-day detailed schedule
   - Activity templates
   - Inclusion alternatives
   - Timing and pacing

2. **Application Form Builder** (Week 6-7)
   - Erasmus+ Part B form sections
   - Auto-populate from project concept
   - AI-generated narratives
   - Compliance checking

3. **Budget Calculator** (Week 8)
   - Erasmus+ unit cost calculator
   - Budget narrative generator
   - Justification for inclusion costs

4. **PDF Export** (Week 9)
   - Generate professional application document
   - Match Erasmus+ format
   - Include all required sections

**Timeline to February**: 9 weeks → Target completion by early February, leaving time for refinement and actual project applications.

---

## Resources

**Documentation**:
- Erasmus+ Programme Guide 2025: https://erasmus-plus.ec.europa.eu/programme-guide
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- LangChain JS Docs: https://js.langchain.com/docs
- Clerk Docs: https://clerk.com/docs
- Supabase Docs: https://supabase.com/docs

**Archon Knowledge Base**:
- Erasmus+ Program Research (ID: 189f1025-c75f-40e6-bed9-f2cdbbffb522)
- Technology Stack Recommendations (ID: 39b9cba7-692f-49b8-9f96-bc9f77ea1441)
- Multi-Tenant SaaS Architecture (ID: e5526963-2cc5-4684-9276-660b8256212d)
- Dashboard Design Research (ID: e462846b-1000-4517-92c8-4c50ed6d162d)
- Project Management Tools Research (ID: 875f3ec0-14c0-491d-aec1-dba3adc37140)
- Research Summary & Next Steps (ID: d054f703-6c81-4d0c-a011-4351d4f09e7f)

---

## Questions for User Before Starting

1. **Supabase vs Self-Hosted PostgreSQL**: Are you comfortable using Supabase's free tier for MVP, or do you prefer self-hosted PostgreSQL from the start?

2. **Clerk vs NextAuth.js**: Clerk is recommended for speed (multi-tenancy built-in), but it's a paid service. Are you okay with this, or prefer open-source NextAuth.js (more setup work)?

3. **OpenAI API Budget**: Estimated $100-300/month for AI usage during development and initial use. Is this acceptable?

4. **Domain/Hosting**: Do you have a domain for the app (e.g., `app.openhorizon.cc`)? Will be deployed to Google Cloud Run.

5. **Initial Test Data**: Do you have any successful Erasmus+ applications we can use to seed the RAG vector store?

6. **Priority Adjustments**: Is there any part of this plan you'd like to adjust (more/less time, different order, etc.)?

---

**Status**: Ready for user approval and implementation
**Next Step**: User reviews plan → Asks questions / approves → Begin Phase 0 (Foundation Setup)
