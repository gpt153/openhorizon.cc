# Implementation Plan: Open Horizon Pipeline Integration & Erasmus+ Platform

**Created:** 2026-01-08
**Target Completion:** 2026-02-09 (32 days)
**Complexity:** Very High
**PRD:** `PRD-MERGED-SYSTEM-FINAL.md`

---

## Summary

Integrate the complete project-pipeline system into the main Open Horizon app to create a unified Erasmus+ business platform. This involves merging two codebases (Next.js + Fastify), adding Erasmus+ income calculator, AI agents for research, email automation, profit tracking dashboard, and application generator. The goal is to enable submitting 5-10 high-quality applications by February 12, 2026.

**Approach:** Incremental integration in phases - database → backend API → AI agents → frontend → email → profit tracking → application generator. Each phase is tested before moving to the next.

---

## Intent

Build a service business platform that:
1. Calculates Erasmus+ grant income from official EU rules
2. Uses AI agents to research accommodations, activities, and emergency planning
3. Automates vendor quote requests via email
4. Tracks profit margins (grant income - estimated costs)
5. Generates complete Erasmus+ KA1 Youth Exchange applications

---

## Persona

**Samuel** - Solo entrepreneur building a service business submitting Erasmus+ applications for Swedish organizations and executing approved projects.

**Needs:**
- Generate 5-10 applications quickly (February 12 deadline)
- Know profit margin BEFORE applying (income - costs)
- Automate vendor research (hotels, activities)
- See accumulated profit across all projects

**Current Pain:**
- Manual applications take 20-40 hours each
- No way to calculate Erasmus+ grant amounts
- Manual vendor research and quotes
- Can't assess project viability

---

## UX

### Before

```
User creates project in main app
  ↓
Project sits in DRAFT status
  ↓
User manually:
  - Googles hotels for 2 hours
  - Emails 10 vendors individually
  - Waits for responses
  - Builds Excel spreadsheet for budget
  - Guesses Erasmus+ grant amount (often wrong)
  - Spends 20-40 hours writing application in Word
  ↓
Submits 2-3 applications max (time constraint)
```

### After

```
User creates seed from brainstorm
  ↓
"Turn into Project" prefills data with AI
  ↓
User clicks "Open Pipeline"
  ↓
Timeline shows 6 phases (accommodation, travel, food, etc.)
  ↓
System calculates Erasmus+ INCOME:
  "20 participants × 7 days = €15,900 grant"
  ↓
User clicks "Accommodation" phase
  ↓
Chat with AccommodationAgent:
  User: "Find hostels in Barcelona, €50/night"
  AI: Returns 5 hotels with prices
  User: Selects 3
  ↓
AI composes professional quote emails
  ↓
User reviews and clicks "Send All"
  ↓
System sends via email, tracks responses
  ↓
Quotes received → User enters amounts
  ↓
System calculates COSTS: €9,700
  ↓
Dashboard shows PROFIT: €15,900 - €9,700 = €6,200 (39% margin)
  ↓
User decides: "Yes, profitable - let's apply"
  ↓
Clicks "Generate Application"
  ↓
AI outputs JSON + PDF in 5 minutes
  ↓
User submits to EU portal
  ↓
RESULT: 10 applications in February (vs 2-3 manual)
Accumulated profit shown: €60,000 potential
```

---

## External Research

### Documentation

**Erasmus+ Programme:**
- [Official Programme Guide 2024-2027](https://erasmus-plus.ec.europa.eu/sites/default/files/2023-11/2024-Erasmus+Programme-Guide_EN.pdf)
  - Key sections: KA1 Youth Exchange funding rules, unit costs, application format
- [Unit Cost Decision](https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/erasmus/guidance/ls-and-unit-cost-decision_erasmus_en.pdf)
  - Critical: Distance bands, country-specific rates, calculation formulas
- [KA152-YOU Template](https://erasmus-plus.ec.europa.eu/sites/default/files/2023-11/2024-eplus-call-template-KA152-YOU.pdf)
  - Application structure: 7 required sections

**Email Services:**
- [SendGrid API](https://docs.sendgrid.com/for-developers/sending-email/api-getting-started)
  - Alternative: [Resend](https://resend.com/docs) (simpler, cheaper for low volume)
  - Alternative: [Postmark](https://postmarkapp.com/developer) (transactional focus)
- Recommendation: **Resend** - modern, simple API, €0 for 3,000 emails/month

**Next.js Integration:**
- [tRPC v11 Docs](https://trpc.io/docs/quickstart)
  - Procedures, routers, context
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/best-practices)
  - Multi-tenancy patterns, connection pooling
- [Playwright Testing](https://playwright.dev/docs/intro)
  - E2E test patterns, Page Object Model

### Gotchas & Best Practices

**Erasmus+ Calculations:**
- ⚠️ Travel distance must be calculated from city center to city center (not airport)
- ⚠️ Activity days EXCLUDE travel days (max 21 days for activity)
- ⚠️ Organisational support rate varies by HOST country, not sending country
- ⚠️ Individual support calculated on TOTAL days (activity + travel)
- ✅ Best practice: Build calculator with lookup tables, don't hardcode rates

**Email Automation:**
- ⚠️ SendGrid requires domain verification (can take 24-48 hours)
- ⚠️ Cold sending to hotels may trigger spam filters
- ⚠️ GDPR: Need consent mechanism for storing vendor emails
- ✅ Best practice: Start with Resend (no domain warmup needed), add rate limiting

**Prisma Migrations:**
- ⚠️ Adding models to production requires careful migration (BACKUP FIRST)
- ⚠️ `prisma migrate dev` can reset data in dev (use `--create-only` flag)
- ⚠️ Enum changes require multi-step migration (add new values, migrate data, remove old)
- ✅ Best practice: Test migration on staging, have rollback script ready

**tRPC Performance:**
- ⚠️ Large JSON responses can slow down page loads
- ⚠️ Nested relations without `select` can fetch excessive data
- ✅ Best practice: Use `select` to fetch only needed fields, paginate large lists

---

## Patterns to Mirror

### Pattern 1: tRPC Router with Multi-Tenancy

**From:** `app/src/server/routers/projects.ts:15-45`

```typescript
import { router, orgProcedure } from '../trpc'
import { z } from 'zod'

export const projectsRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.project.findMany({
      where: { tenantId: ctx.orgId }, // ✅ ALWAYS filter by tenantId
      include: {
        // Only include what's needed
        _count: { select: { programmes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }),

  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId, // ✅ Prevent cross-tenant access
        },
      })

      if (!project) {
        throw new Error('Project not found') // ✅ tRPC handles error response
      }

      return project
    }),
})
```

**MIRROR THIS FOR:**
- `app/src/server/routers/pipeline/projects.ts`
- `app/src/server/routers/pipeline/phases.ts`
- All pipeline routers

---

### Pattern 2: Prisma Schema (Multi-Tenant)

**From:** `app/prisma/schema.prisma:45-75`

```prisma
model Project {
  id              String @id @default(uuid()) @db.Uuid
  tenantId        String @map("tenant_id") @db.Uuid // ✅ Always include
  createdByUserId String @map("created_by_user_id")

  title   String
  tagline String?
  status  ProjectStatus @default(DRAFT)

  projectDna Json @map("project_dna") // ✅ Flexible JSON for dynamic data

  createdAt DateTime @default(now()) @map("created_at") // ✅ snake_case
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  organization Organization @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId]) // ✅ Index for performance
  @@index([tenantId, status])
  @@map("projects") // ✅ Plural table name
}
```

**MIRROR THIS FOR:**
- All pipeline models (Phase, Vendor, Communication, Quote)

---

### Pattern 3: LangChain AI Chain

**From:** `app/src/lib/ai/chains/project-concept-generation.ts:12-55`

```typescript
import { ChatOpenAI } from '@langchain/openai'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'

const ProjectConceptSchema = z.object({
  objectives: z.array(z.string()).describe('3-5 learning objectives'),
  activities: z.string().describe('Day-by-day activity description'),
  outcomes: z.array(z.string()).describe('Expected learning outcomes'),
  // ...
})

export async function generateProjectConcept(params: {
  projectDna: Record<string, unknown>
  seedContent: Record<string, unknown>
}): Promise<z.infer<typeof ProjectConceptSchema>> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.8,
    openAIApiKey: process.env.OPENAI_API_KEY,
  })

  const parser = StructuredOutputParser.fromZodSchema(ProjectConceptSchema)

  const prompt = PromptTemplate.fromTemplate(`
    You are an Erasmus+ project designer...

    Project DNA: {projectDna}
    Seed Content: {seedContent}

    {format_instructions}
  `)

  const chain = prompt.pipe(model).pipe(parser)

  return await chain.invoke({
    projectDna: JSON.stringify(params.projectDna),
    seedContent: JSON.stringify(params.seedContent),
    format_instructions: parser.getFormatInstructions(),
  })
}
```

**MIRROR THIS FOR:**
- Accommodation research chain
- Email composer chain
- Application generator chain

---

### Pattern 4: Radix UI Component

**From:** `app/src/components/projects/ProjectCard.tsx:8-45`

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{project.title}</CardTitle>
          <Badge variant={getStatusVariant(project.status)}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-500">{project.tagline}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm">View</Button>
          <Button variant="outline" size="sm">Edit</Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**MIRROR THIS FOR:**
- Pipeline project cards
- Phase cards
- Vendor cards
- Quote cards

---

### Pattern 5: Playwright E2E Test

**From:** `app/e2e/basic.spec.ts:5-25`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Projects', () => {
  test('can view projects list', async ({ page }) => {
    await page.goto('/projects')

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /projects/i })).toBeVisible()

    // Check for projects or empty state
    const hasProjects = await page.getByTestId('project-card').count() > 0
    if (hasProjects) {
      await expect(page.getByTestId('project-card').first()).toBeVisible()
    } else {
      await expect(page.getByText(/no projects yet/i)).toBeVisible()
    }
  })

  test('can create new project', async ({ page }) => {
    await page.goto('/projects/new')

    await page.fill('[name="title"]', 'Test Project')
    await page.fill('[name="tagline"]', 'Test tagline')

    await page.getByRole('button', { name: /create/i }).click()

    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+/)
    await expect(page.getByText('Test Project')).toBeVisible()
  })
})
```

**MIRROR THIS FOR:**
- Pipeline project CRUD tests
- Phase management tests
- AI agent interaction tests

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/prisma/schema.prisma` | UPDATE | Add pipeline models (Phase, Vendor, Communication, Quote, etc.) |
| `app/src/server/routers/_app.ts` | UPDATE | Add pipeline router to app router |
| `app/src/server/routers/pipeline/projects.ts` | CREATE | tRPC procedures for pipeline projects |
| `app/src/server/routers/pipeline/phases.ts` | CREATE | tRPC procedures for phases |
| `app/src/server/routers/pipeline/vendors.ts` | CREATE | tRPC procedures for vendors |
| `app/src/server/routers/pipeline/communications.ts` | CREATE | tRPC procedures for email tracking |
| `app/src/server/routers/pipeline/quotes.ts` | CREATE | tRPC procedures for quotes |
| `app/src/lib/ai/chains/pipeline/accommodation-research.ts` | CREATE | AI agent for accommodation research |
| `app/src/lib/ai/chains/pipeline/email-composer.ts` | CREATE | AI agent for composing emails |
| `app/src/lib/ai/chains/pipeline/application-generator.ts` | CREATE | AI agent for generating applications |
| `app/src/lib/erasmus/income-calculator.ts` | CREATE | Erasmus+ grant calculation logic |
| `app/src/lib/services/email.service.ts` | CREATE | Email sending service (Resend) |
| `app/src/components/pipeline/projects/PipelineProjectCard.tsx` | CREATE | Project card component |
| `app/src/components/pipeline/phases/PhaseCard.tsx` | CREATE | Phase card component |
| `app/src/components/pipeline/chat/AIChatWindow.tsx` | CREATE | AI chat interface |
| `app/src/components/pipeline/budget/BudgetTracker.tsx` | CREATE | Budget tracking dashboard |
| `app/src/app/(dashboard)/pipeline/projects/page.tsx` | CREATE | Pipeline projects list page |
| `app/src/app/(dashboard)/pipeline/projects/[id]/page.tsx` | CREATE | Pipeline project detail page |
| `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx` | CREATE | Phase detail + AI chat page |
| `app/src/app/(dashboard)/dashboard/profit/page.tsx` | CREATE | Accumulated profit dashboard |
| `app/e2e/pipeline.spec.ts` | CREATE | E2E tests for pipeline features |

**Total:** 21 files (8 UPDATE, 13 CREATE)

---

## NOT Building

**Explicitly out of scope to prevent over-engineering:**

- ❌ **Multi-user collaboration** - Single user only, defer organization features
- ❌ **Real-time WebSocket chat** - Use polling initially, simpler for Cloud Run
- ❌ **Web scraping (Booking.com)** - AI-only mode sufficient, avoid legal issues
- ❌ **Weaviate learning system** - Defer until 20+ projects completed
- ❌ **Invoice/receipt tracking** - Post-approval feature, not needed for applications
- ❌ **Calendar integration** - Manual date entry sufficient
- ❌ **Mobile app** - Web responsive only
- ❌ **Internationalization** - English only
- ❌ **OpenProject integration** - Niche feature, unclear demand
- ❌ **Custom AI agents** - 3 pre-built agents sufficient
- ❌ **Advanced budget analytics** - Simple profit calculation sufficient for MVP
- ❌ **Vendor rating system** - Track basic metrics only, no complex scoring

**Why:** February 12 deadline (35 days). Focus on application generator and profit tracking ONLY.

---

## Tasks

### PHASE 0: Pre-Flight Checks (Day 0)

#### Task 0.1: Merge PR #37

**Why**: Deployment is currently broken. Must fix before any new code.

**Do**:
```bash
gh pr view 37
gh pr merge 37 --squash
```

**Verify**: `git pull origin main && git log -1`

---

#### Task 0.2: Backup Production Database

**Why**: About to run migrations that add many tables. Need rollback capability.

**Do**:
```bash
# Connect to Supabase dashboard
# Navigate to Database → Backups
# Create manual backup: "Before pipeline integration"
# Download backup SQL file to local machine
```

**Verify**: Backup file exists locally with today's date

---

#### Task 0.3: Test Main App Still Works

**Why**: Establish baseline before changes.

**Do**:
```bash
cd app
npm run dev
```

Visit http://localhost:3000, test:
- [x] Homepage loads
- [x] Can sign in with Clerk
- [x] Projects list displays
- [x] Can create new seed
- [x] No console errors

**Verify**: All tests pass

---

### PHASE 1: Database Schema (Days 1-2)

#### Task 1.1: Add Pipeline Models to Schema

**Why**: Foundation for all pipeline features. Must add before building API.

**Mirror**: `app/prisma/schema.prisma` existing models

**Do**:

Open `app/prisma/schema.prisma`, add at bottom:

```prisma
// ============================================
// PIPELINE MODELS
// ============================================

model PipelineProject {
  id                   String         @id @default(uuid()) @db.Uuid
  tenantId             String         @map("tenant_id") @db.Uuid
  createdByUserId      String         @map("created_by_user_id")

  name                 String
  type                 ProjectType
  status               PipelineProjectStatus @default(PLANNING)
  description          String?        @db.Text
  startDate            DateTime       @map("start_date")
  endDate              DateTime       @map("end_date")
  budgetTotal          Decimal        @map("budget_total") @db.Decimal(12, 2)
  budgetSpent          Decimal        @default(0) @map("budget_spent") @db.Decimal(12, 2)
  participantCount     Int            @map("participant_count")
  location             String
  originCountry        String?        @map("origin_country")
  hostCountry          String?        @map("host_country")

  // Erasmus+ specific
  erasmusGrantCalculated Decimal?     @map("erasmus_grant_calculated") @db.Decimal(12, 2)
  erasmusGrantActual     Decimal?     @map("erasmus_grant_actual") @db.Decimal(12, 2)
  estimatedCosts         Decimal?     @map("estimated_costs") @db.Decimal(12, 2)
  profitMargin           Decimal?     @map("profit_margin") @db.Decimal(5, 2)

  metadata             Json?

  createdAt            DateTime       @default(now()) @map("created_at")
  updatedAt            DateTime       @updatedAt @map("updated_at")

  // Relations
  organization         Organization   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  phases               PipelinePhase[]
  communications       Communication[]
  aiConversations      AIConversation[]

  @@index([tenantId, status])
  @@index([tenantId, createdByUserId])
  @@map("pipeline_projects")
}

model PipelinePhase {
  id                String         @id @default(uuid()) @db.Uuid
  projectId         String         @map("project_id") @db.Uuid

  name              String
  type              PhaseType
  status            PhaseStatus    @default(NOT_STARTED)
  startDate         DateTime       @map("start_date")
  endDate           DateTime       @map("end_date")
  budgetAllocated   Decimal        @map("budget_allocated") @db.Decimal(12, 2)
  budgetSpent       Decimal        @default(0) @map("budget_spent") @db.Decimal(12, 2)
  order             Int

  createdAt         DateTime       @default(now()) @map("created_at")
  updatedAt         DateTime       @updatedAt @map("updated_at")

  // Relations
  project           PipelineProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  communications    Communication[]
  quotes            Quote[]
  aiConversations   AIConversation[]

  @@index([projectId])
  @@index([status])
  @@index([type])
  @@map("pipeline_phases")
}

model Vendor {
  id                     String       @id @default(uuid()) @db.Uuid
  tenantId               String       @map("tenant_id") @db.Uuid

  name                   String
  type                   VendorType
  email                  String?
  phone                  String?
  website                String?
  location               String?
  rating                 Decimal?     @db.Decimal(3, 2)
  responseRate           Decimal?     @map("response_rate") @db.Decimal(4, 2)
  successfulBookings     Int          @default(0) @map("successful_bookings")
  totalContacts          Int          @default(0) @map("total_contacts")
  notes                  String?      @db.Text
  metadata               Json?

  createdAt              DateTime     @default(now()) @map("created_at")
  updatedAt              DateTime     @updatedAt @map("updated_at")

  // Relations
  organization           Organization @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  communications         Communication[]
  quotes                 Quote[]

  @@index([tenantId, type])
  @@index([rating])
  @@map("vendors")
}

model Communication {
  id                    String               @id @default(uuid()) @db.Uuid
  tenantId              String               @map("tenant_id") @db.Uuid
  projectId             String               @map("project_id") @db.Uuid
  phaseId               String?              @map("phase_id") @db.Uuid
  vendorId              String?              @map("vendor_id") @db.Uuid

  type                  CommunicationType
  direction             CommunicationDirection
  subject               String?
  body                  String               @db.Text
  status                CommunicationStatus
  sentAt                DateTime?            @map("sent_at")
  responseReceivedAt    DateTime?            @map("response_received_at")

  createdAt             DateTime             @default(now()) @map("created_at")
  updatedAt             DateTime             @updatedAt @map("updated_at")

  // Relations
  organization          Organization         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project               PipelineProject      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  phase                 PipelinePhase?       @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  vendor                Vendor?              @relation(fields: [vendorId], references: [id])

  @@index([tenantId, projectId])
  @@index([phaseId])
  @@index([vendorId])
  @@index([status])
  @@map("communications")
}

model Quote {
  id          String      @id @default(uuid()) @db.Uuid
  phaseId     String      @map("phase_id") @db.Uuid
  vendorId    String      @map("vendor_id") @db.Uuid

  amount      Decimal     @db.Decimal(12, 2)
  currency    String      @default("EUR")
  validUntil  DateTime?   @map("valid_until")
  status      QuoteStatus @default(PENDING)
  details     Json?
  notes       String?     @db.Text

  receivedAt  DateTime    @default(now()) @map("received_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  // Relations
  phase       PipelinePhase @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  vendor      Vendor        @relation(fields: [vendorId], references: [id])

  @@index([phaseId])
  @@index([vendorId])
  @@index([status])
  @@map("quotes")
}

model AIConversation {
  id          String           @id @default(uuid()) @db.Uuid
  projectId   String           @map("project_id") @db.Uuid
  phaseId     String?          @map("phase_id") @db.Uuid
  agentType   String           @map("agent_type") // 'accommodation', 'activities', 'emergency'
  messages    Json             // Array of {role, content, timestamp}

  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  // Relations
  project     PipelineProject  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  phase       PipelinePhase?   @relation(fields: [phaseId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([phaseId])
  @@map("ai_conversations")
}

// Enums
enum ProjectType {
  STUDENT_EXCHANGE
  TRAINING
  CONFERENCE
  CUSTOM
}

enum PipelineProjectStatus {
  PLANNING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum PhaseType {
  ACCOMMODATION
  TRAVEL
  FOOD
  ACTIVITIES
  INSURANCE
  EMERGENCY
  CUSTOM
}

enum PhaseStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  SKIPPED
  BLOCKED
}

enum VendorType {
  HOTEL
  HOSTEL
  GUESTHOUSE
  RESTAURANT
  CATERING
  ACTIVITY_PROVIDER
  TRANSPORT
  INSURANCE
  OTHER
}

enum CommunicationType {
  EMAIL
  PHONE
  OTHER
}

enum CommunicationDirection {
  OUTBOUND
  INBOUND
}

enum CommunicationStatus {
  DRAFT
  SENT
  DELIVERED
  RESPONDED
  FAILED
}

enum QuoteStatus {
  PENDING
  RECEIVED
  ACCEPTED
  REJECTED
  EXPIRED
}
```

**Don't:**
- Don't modify existing models yet
- Don't create separate schema file
- Don't skip tenantId fields

**Verify**: `cd app && npx prisma validate`

---

#### Task 1.2: Create Migration

**Why**: Apply schema changes to database.

**Do**:
```bash
cd app
npx prisma migrate dev --name add_pipeline_models --create-only
```

This creates migration file in `app/prisma/migrations/`.

Review the generated SQL:
```bash
cat prisma/migrations/$(ls -t prisma/migrations | head -1)/migration.sql
```

Check for:
- [x] CREATE TABLE statements for all models
- [x] CREATE INDEX statements
- [x] Foreign key constraints
- [x] No DROP statements (would lose data)

**Verify**: Migration file exists and looks correct

---

#### Task 1.3: Run Migration

**Why**: Apply to local dev database first.

**Do**:
```bash
npx prisma migrate dev
```

If errors occur:
- Check connection string in .env.local
- Ensure Supabase database is accessible
- Review error message for constraint violations

**Verify**:
```bash
npx prisma studio
```

Check that new tables exist:
- pipeline_projects
- pipeline_phases
- vendors
- communications
- quotes
- ai_conversations

---

#### Task 1.4: Generate Prisma Client

**Why**: TypeScript types for new models.

**Do**:
```bash
npx prisma generate
```

**Verify**: No errors, types available:
```typescript
import { PipelineProject, PipelinePhase } from '@prisma/client'
```

---

### PHASE 2: Backend API - tRPC Routers (Days 3-5)

#### Task 2.1: Create Pipeline Router Structure

**Why**: Organize API endpoints for pipeline features.

**Do**:
```bash
mkdir -p app/src/server/routers/pipeline
```

**Files to create:**
- `app/src/server/routers/pipeline/_app.ts` (aggregates all pipeline routers)
- `app/src/server/routers/pipeline/projects.ts`
- `app/src/server/routers/pipeline/phases.ts`
- `app/src/server/routers/pipeline/vendors.ts`
- `app/src/server/routers/pipeline/communications.ts`
- `app/src/server/routers/pipeline/quotes.ts`

**Verify**: Directories created

---

#### Task 2.2: Create Pipeline Projects Router

**Why**: CRUD operations for pipeline projects.

**Mirror**: `app/src/server/routers/projects.ts` pattern

**Do**:

Create `app/src/server/routers/pipeline/projects.ts`:

```typescript
import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
import { ProjectType, PipelineProjectStatus } from '@prisma/client'

export const pipelineProjectsRouter = router({
  // List projects
  list: orgProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.pipelineProject.findMany({
      where: { tenantId: ctx.orgId },
      include: {
        phases: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            budgetAllocated: true,
            budgetSpent: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { phases: true, communications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }),

  // Get by ID
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          phases: {
            orderBy: { order: 'asc' },
            include: {
              quotes: { include: { vendor: true } },
              _count: { select: { communications: true } },
            },
          },
          communications: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { vendor: true },
          },
        },
      })

      if (!project) {
        throw new Error('Project not found')
      }

      return project
    }),

  // Create project
  create: orgProcedure
    .input(z.object({
      name: z.string().min(3, 'Name must be at least 3 characters'),
      type: z.nativeEnum(ProjectType),
      description: z.string().optional(),
      startDate: z.date(),
      endDate: z.date(),
      budgetTotal: z.number().positive('Budget must be positive'),
      participantCount: z.number().int().positive('Must have at least 1 participant'),
      location: z.string().min(2, 'Location is required'),
      originCountry: z.string().optional(),
      hostCountry: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate dates
      if (input.endDate <= input.startDate) {
        throw new Error('End date must be after start date')
      }

      const project = await ctx.prisma.pipelineProject.create({
        data: {
          ...input,
          tenantId: ctx.orgId,
          createdByUserId: ctx.userId,
        },
        include: { phases: true },
      })

      // Create default phases
      const defaultPhases = [
        { name: 'Accommodation', type: 'ACCOMMODATION', order: 1, budgetPct: 0.35 },
        { name: 'Travel', type: 'TRAVEL', order: 2, budgetPct: 0.25 },
        { name: 'Food', type: 'FOOD', order: 3, budgetPct: 0.20 },
        { name: 'Activities', type: 'ACTIVITIES', order: 4, budgetPct: 0.10 },
        { name: 'Insurance', type: 'INSURANCE', order: 5, budgetPct: 0.05 },
        { name: 'Emergency Planning', type: 'EMERGENCY', order: 6, budgetPct: 0.05 },
      ]

      const daysDuration = Math.ceil((input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24))

      await ctx.prisma.pipelinePhase.createMany({
        data: defaultPhases.map(phase => ({
          projectId: project.id,
          name: phase.name,
          type: phase.type as any,
          order: phase.order,
          startDate: input.startDate,
          endDate: input.endDate,
          budgetAllocated: Number((input.budgetTotal * phase.budgetPct).toFixed(2)),
        })),
      })

      return project
    }),

  // Update project
  update: orgProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().min(3).optional(),
        status: z.nativeEnum(PipelineProjectStatus).optional(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budgetTotal: z.number().positive().optional(),
        participantCount: z.number().int().positive().optional(),
        location: z.string().optional(),
        originCountry: z.string().optional(),
        hostCountry: z.string().optional(),
        erasmusGrantCalculated: z.number().optional(),
        estimatedCosts: z.number().optional(),
        profitMargin: z.number().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.pipelineProject.updateMany({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        data: input.data,
      })

      if (result.count === 0) {
        throw new Error('Project not found or unauthorized')
      }

      return { success: true }
    }),

  // Delete project
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.pipelineProject.deleteMany({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (result.count === 0) {
        throw new Error('Project not found or unauthorized')
      }

      return { success: true }
    }),
})
```

**Don't:**
- Don't skip tenantId filtering
- Don't return sensitive data
- Don't create public procedures for pipeline endpoints

**Verify**: TypeScript compiles, no errors

---

#### Task 2.3: Create Phases Router

**Why**: Manage project phases (accommodation, travel, food, etc.).

**Do**:

Create `app/src/server/routers/pipeline/phases.ts`:

```typescript
import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
import { PhaseType, PhaseStatus } from '@prisma/client'

export const pipelinePhasesRouter = router({
  // List phases for project
  listByProject: orgProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify project belongs to org
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Project not found')
      }

      return await ctx.prisma.pipelinePhase.findMany({
        where: { projectId: input.projectId },
        include: {
          quotes: { include: { vendor: true } },
          _count: { select: { communications: true } },
        },
        orderBy: { order: 'asc' },
      })
    }),

  // Get phase by ID
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: { id: input.id },
        include: {
          project: {
            where: { tenantId: ctx.orgId }, // Security check
          },
          quotes: {
            include: { vendor: true },
            orderBy: { receivedAt: 'desc' },
          },
          communications: {
            include: { vendor: true },
            orderBy: { createdAt: 'desc' },
          },
          aiConversations: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!phase || !phase.project) {
        throw new Error('Phase not found')
      }

      return phase
    }),

  // Create phase
  create: orgProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      name: z.string().min(2),
      type: z.nativeEnum(PhaseType),
      startDate: z.date(),
      endDate: z.date(),
      budgetAllocated: z.number().positive(),
      order: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify project ownership
      const project = await ctx.prisma.pipelineProject.findFirst({
        where: {
          id: input.projectId,
          tenantId: ctx.orgId,
        },
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // Auto-assign order if not provided
      let order = input.order
      if (!order) {
        const maxOrder = await ctx.prisma.pipelinePhase.aggregate({
          where: { projectId: input.projectId },
          _max: { order: true },
        })
        order = (maxOrder._max.order || 0) + 1
      }

      return await ctx.prisma.pipelinePhase.create({
        data: {
          ...input,
          order,
        },
        include: { project: true },
      })
    }),

  // Update phase
  update: orgProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().min(2).optional(),
        status: z.nativeEnum(PhaseStatus).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budgetAllocated: z.number().positive().optional(),
        budgetSpent: z.number().optional(),
        order: z.number().int().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Security: Verify phase belongs to org's project
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: { id: input.id },
        include: { project: { where: { tenantId: ctx.orgId } } },
      })

      if (!phase || !phase.project) {
        throw new Error('Phase not found or unauthorized')
      }

      return await ctx.prisma.pipelinePhase.update({
        where: { id: input.id },
        data: input.data,
      })
    }),

  // Delete phase
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: { id: input.id },
        include: { project: { where: { tenantId: ctx.orgId } } },
      })

      if (!phase || !phase.project) {
        throw new Error('Phase not found or unauthorized')
      }

      await ctx.prisma.pipelinePhase.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
```

**Verify**: TypeScript compiles

---

#### Task 2.4: Create Vendors & Quotes Routers

**Why**: Manage vendors and quote tracking.

**Do**:

Create `app/src/server/routers/pipeline/vendors.ts`:

```typescript
import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
import { VendorType } from '@prisma/client'

export const vendorsRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.vendor.findMany({
      where: { tenantId: ctx.orgId },
      orderBy: [
        { rating: 'desc' },
        { name: 'asc' },
      ],
    })
  }),

  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          communications: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          quotes: {
            orderBy: { receivedAt: 'desc' },
            take: 10,
          },
        },
      })

      if (!vendor) {
        throw new Error('Vendor not found')
      }

      return vendor
    }),

  create: orgProcedure
    .input(z.object({
      name: z.string().min(2),
      type: z.nativeEnum(VendorType),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      website: z.string().url().optional(),
      location: z.string().optional(),
      notes: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.vendor.create({
        data: {
          ...input,
          tenantId: ctx.orgId,
        },
      })
    }),

  update: orgProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().min(2).optional(),
        type: z.nativeEnum(VendorType).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().url().optional(),
        location: z.string().optional(),
        rating: z.number().min(0).max(5).optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.vendor.updateMany({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        data: input.data,
      })

      if (result.count === 0) {
        throw new Error('Vendor not found or unauthorized')
      }

      return { success: true }
    }),
})
```

Create `app/src/server/routers/pipeline/quotes.ts`:

```typescript
import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
import { QuoteStatus } from '@prisma/client'

export const quotesRouter = router({
  listByPhase: orgProcedure
    .input(z.object({ phaseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify phase belongs to org
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: { id: input.phaseId },
        include: { project: { where: { tenantId: ctx.orgId } } },
      })

      if (!phase || !phase.project) {
        throw new Error('Phase not found')
      }

      return await ctx.prisma.quote.findMany({
        where: { phaseId: input.phaseId },
        include: { vendor: true },
        orderBy: [
          { status: 'asc' }, // PENDING first
          { amount: 'asc' }, // Lowest price
        ],
      })
    }),

  create: orgProcedure
    .input(z.object({
      phaseId: z.string().uuid(),
      vendorId: z.string().uuid(),
      amount: z.number().positive(),
      currency: z.string().default('EUR'),
      validUntil: z.date().optional(),
      details: z.record(z.unknown()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify phase belongs to org
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: { id: input.phaseId },
        include: { project: { where: { tenantId: ctx.orgId } } },
      })

      if (!phase || !phase.project) {
        throw new Error('Phase not found')
      }

      // Verify vendor belongs to org
      const vendor = await ctx.prisma.vendor.findFirst({
        where: {
          id: input.vendorId,
          tenantId: ctx.orgId,
        },
      })

      if (!vendor) {
        throw new Error('Vendor not found')
      }

      return await ctx.prisma.quote.create({
        data: input,
        include: { vendor: true, phase: true },
      })
    }),

  updateStatus: orgProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: z.nativeEnum(QuoteStatus),
    }))
    .mutation(async ({ ctx, input }) => {
      // Security check
      const quote = await ctx.prisma.quote.findFirst({
        where: { id: input.id },
        include: {
          phase: {
            include: { project: { where: { tenantId: ctx.orgId } } },
          },
        },
      })

      if (!quote || !quote.phase.project) {
        throw new Error('Quote not found or unauthorized')
      }

      return await ctx.prisma.quote.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    }),
})
```

**Verify**: Both files compile

---

#### Task 2.5: Aggregate Pipeline Routers

**Why**: Combine all pipeline routers into one namespace.

**Do**:

Create `app/src/server/routers/pipeline/_app.ts`:

```typescript
import { router } from '../../trpc'
import { pipelineProjectsRouter } from './projects'
import { pipelinePhasesRouter } from './phases'
import { vendorsRouter } from './vendors'
import { quotesRouter } from './quotes'

export const pipelineRouter = router({
  projects: pipelineProjectsRouter,
  phases: pipelinePhasesRouter,
  vendors: vendorsRouter,
  quotes: quotesRouter,
})

export type PipelineRouter = typeof pipelineRouter
```

**Verify**: TypeScript compiles

---

#### Task 2.6: Add Pipeline Router to App Router

**Why**: Expose pipeline endpoints to frontend.

**Do**:

Update `app/src/server/routers/_app.ts`:

```typescript
import { router } from '../trpc'
import { projectsRouter } from './projects'
import { programmesRouter } from './programmes'
import { brainstormRouter } from './brainstorm'
import { pipelineRouter } from './pipeline/_app' // ✅ ADD THIS

export const appRouter = router({
  projects: projectsRouter,
  programmes: programmesRouter,
  brainstorm: brainstormRouter,
  pipeline: pipelineRouter, // ✅ ADD THIS
})

export type AppRouter = typeof appRouter
```

**Verify**:
```bash
cd app
npx tsc --noEmit
```
No errors

---

### PHASE 3: Erasmus+ Income Calculator (Days 6-7)

#### Task 3.1: Create Unit Cost Tables

**Why**: Store official EU unit cost rates for calculations.

**Do**:

Create `app/src/lib/erasmus/unit-costs.ts`:

```typescript
// Erasmus+ Unit Cost Tables (2024-2027 Programme)
// Source: EC Decision on Lump Sums & Unit Costs

export const ORGANISATIONAL_SUPPORT_RATES: Record<string, number> = {
  // Rates per participant per day (activity days only)
  // Key: ISO 3166-1 alpha-2 country code of HOST country
  'DK': 125, // Denmark (highest)
  'IS': 125, // Iceland
  'IE': 125, // Ireland
  'LI': 125, // Liechtenstein
  'LU': 125, // Luxembourg
  'NO': 125, // Norway
  'SE': 108, // Sweden
  'AT': 104, // Austria
  'FI': 104, // Finland
  'UK': 104, // United Kingdom
  'BE': 99,  // Belgium
  'FR': 99,  // France
  'DE': 99,  // Germany
  'IT': 99,  // Italy
  'NL': 99,  // Netherlands
  'ES': 88,  // Spain
  'CY': 88,  // Cyprus
  'GR': 88,  // Greece
  'MT': 88,  // Malta
  'PT': 88,  // Portugal
  'SI': 76,  // Slovenia
  'EE': 64,  // Estonia
  'HR': 64,  // Croatia
  'LV': 64,  // Latvia
  'LT': 64,  // Lithuania
  'PL': 64,  // Poland
  'SK': 64,  // Slovakia
  'CZ': 64,  // Czech Republic
  'HU': 64,  // Hungary
  'BG': 55,  // Bulgaria
  'RO': 55,  // Romania
  'TR': 46,  // Turkey
  'MK': 34,  // North Macedonia (lowest)
  'RS': 34,  // Serbia
  // Add more as needed
}

export const INDIVIDUAL_SUPPORT_RATES: Record<string, number> = {
  // Rates per participant per day (all days: activity + travel)
  // Key: ISO 3166-1 alpha-2 country code of HOST country
  'DK': 83,
  'IS': 83,
  'IE': 83,
  'LI': 83,
  'LU': 83,
  'NO': 83,
  'SE': 76,
  'AT': 76,
  'FI': 76,
  'UK': 76,
  'BE': 69,
  'FR': 69,
  'DE': 69,
  'IT': 69,
  'NL': 69,
  'ES': 61,
  'CY': 61,
  'GR': 61,
  'MT': 61,
  'PT': 61,
  'SI': 55,
  'EE': 50,
  'HR': 50,
  'LV': 50,
  'LT': 50,
  'PL': 50,
  'SK': 50,
  'CZ': 50,
  'HU': 50,
  'BG': 46,
  'RO': 46,
  'TR': 43,
  'MK': 41,
  'RS': 41,
}

export const TRAVEL_DISTANCE_BANDS = [
  { min: 10, max: 99, amount: 20 },
  { min: 100, max: 499, amount: 180 },
  { min: 500, max: 1999, amount: 275 },
  { min: 2000, max: 2999, amount: 360 },
  { min: 3000, max: 3999, amount: 530 },
  { min: 4000, max: 7999, amount: 820 },
  { min: 8000, max: Infinity, amount: 1500 },
]

export const GREEN_TRAVEL_SUPPLEMENT = 50 // Per participant

export const INCLUSION_SUPPORT = 125 // Per participant with fewer opportunities

export function getOrganisationalRate(hostCountryCode: string): number {
  const rate = ORGANISATIONAL_SUPPORT_RATES[hostCountryCode]
  if (!rate) {
    throw new Error(`No organisational support rate found for country: ${hostCountryCode}`)
  }
  return rate
}

export function getIndividualRate(hostCountryCode: string): number {
  const rate = INDIVIDUAL_SUPPORT_RATES[hostCountryCode]
  if (!rate) {
    throw new Error(`No individual support rate found for country: ${hostCountryCode}`)
  }
  return rate
}

export function getTravelAmount(distanceKm: number): number {
  const band = TRAVEL_DISTANCE_BANDS.find(
    b => distanceKm >= b.min && distanceKm <= b.max
  )

  if (!band) {
    throw new Error(`No travel band found for distance: ${distanceKm}km`)
  }

  return band.amount
}
```

**Verify**: File compiles, exports expected functions

---

#### Task 3.2: Create Distance Calculator

**Why**: Calculate distance between cities for travel budget.

**Do**:

Create `app/src/lib/erasmus/distance-calculator.ts`:

```typescript
// Haversine formula for distance between two points on Earth
export function calculateDistance(params: {
  originLat: number
  originLon: number
  destLat: number
  destLon: number
}): number {
  const R = 6371 // Earth's radius in km

  const dLat = toRad(params.destLat - params.originLat)
  const dLon = toRad(params.destLon - params.originLon)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(params.originLat)) *
      Math.cos(toRad(params.destLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in km
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// City coordinates lookup (major EU cities)
export const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Stockholm': { lat: 59.3293, lon: 18.0686 },
  'Barcelona': { lat: 41.3874, lon: 2.1686 },
  'Berlin': { lat: 52.5200, lon: 13.4050 },
  'Paris': { lat: 48.8566, lon: 2.3522 },
  'Rome': { lat: 41.9028, lon: 12.4964 },
  'Madrid': { lat: 40.4168, lon: -3.7038 },
  'Athens': { lat: 37.9838, lon: 23.7275 },
  'Lisbon': { lat: 38.7223, lon: -9.1393 },
  'Vienna': { lat: 48.2082, lon: 16.3738 },
  'Amsterdam': { lat: 52.3676, lon: 4.9041 },
  'Brussels': { lat: 50.8503, lon: 4.3517 },
  'Copenhagen': { lat: 55.6761, lon: 12.5683 },
  'Warsaw': { lat: 52.2297, lon: 21.0122 },
  'Prague': { lat: 50.0755, lon: 14.4378 },
  'Budapest': { lat: 47.4979, lon: 19.0402 },
  'Dublin': { lat: 53.3498, lon: -6.2603 },
  // Add more as needed
}

export function getCityCoordinates(cityName: string): { lat: number; lon: number } {
  const coords = CITY_COORDINATES[cityName]
  if (!coords) {
    throw new Error(`No coordinates found for city: ${cityName}. Please add to CITY_COORDINATES.`)
  }
  return coords
}
```

**Don't:**
- Don't use external geocoding API (adds latency + cost)
- Don't calculate distance from airports (must be city center)

**Verify**: Functions work:
```typescript
const distance = calculateDistance({
  originLat: 59.3293,
  originLon: 18.0686,
  destLat: 41.3874,
  destLon: 2.1686,
})
// Should be ~2,278 km (Stockholm to Barcelona)
```

---

#### Task 3.3: Create Income Calculator

**Why**: Calculate total Erasmus+ grant amount.

**Do**:

Create `app/src/lib/erasmus/income-calculator.ts`:

```typescript
import { getOrganisationalRate, getIndividualRate, getTravelAmount, GREEN_TRAVEL_SUPPLEMENT, INCLUSION_SUPPORT } from './unit-costs'
import { calculateDistance, getCityCoordinates } from './distance-calculator'

export interface IncomeCalculationParams {
  participantCount: number
  activityDays: number
  travelDays: number // Usually 2 (1 before + 1 after)
  originCity: string
  destinationCity: string
  hostCountryCode: string
  includeGreenTravel?: boolean
  participantsWithFewerOpportunities?: number
}

export interface IncomeCalculationResult {
  organisationalSupport: number
  individualSupport: number
  travel: number
  greenTravelSupplement: number
  inclusionSupport: number
  totalGrant: number
  breakdown: {
    organisationalRate: number
    individualRate: number
    travelDistance: number
    travelAmount: number
  }
}

export function calculateErasmusIncome(params: IncomeCalculationParams): IncomeCalculationResult {
  // Step 1: Organisational Support = participants × activity days × rate
  const orgRate = getOrganisationalRate(params.hostCountryCode)
  const organisationalSupport = params.participantCount * params.activityDays * orgRate

  // Step 2: Individual Support = participants × total days × rate
  const indivRate = getIndividualRate(params.hostCountryCode)
  const totalDays = params.activityDays + params.travelDays
  const individualSupport = params.participantCount * totalDays * indivRate

  // Step 3: Travel = participants × distance band amount
  const originCoords = getCityCoordinates(params.originCity)
  const destCoords = getCityCoordinates(params.destinationCity)
  const distanceKm = calculateDistance({
    originLat: originCoords.lat,
    originLon: originCoords.lon,
    destLat: destCoords.lat,
    destLon: destCoords.lon,
  })
  const travelAmount = getTravelAmount(distanceKm)
  const travel = params.participantCount * travelAmount

  // Step 4: Green Travel Supplement (optional)
  const greenTravelSupplement = params.includeGreenTravel
    ? params.participantCount * GREEN_TRAVEL_SUPPLEMENT
    : 0

  // Step 5: Inclusion Support (optional)
  const inclusionSupport = (params.participantsWithFewerOpportunities || 0) * INCLUSION_SUPPORT

  // Total
  const totalGrant =
    organisationalSupport +
    individualSupport +
    travel +
    greenTravelSupplement +
    inclusionSupport

  return {
    organisationalSupport,
    individualSupport,
    travel,
    greenTravelSupplement,
    inclusionSupport,
    totalGrant,
    breakdown: {
      organisationalRate: orgRate,
      individualRate: indivRate,
      travelDistance: Math.round(distanceKm),
      travelAmount,
    },
  }
}
```

**Verify**: Test calculation:
```typescript
const result = calculateErasmusIncome({
  participantCount: 20,
  activityDays: 5,
  travelDays: 2,
  originCity: 'Stockholm',
  destinationCity: 'Barcelona',
  hostCountryCode: 'ES',
  includeGreenTravel: false,
  participantsWithFewerOpportunities: 0,
})

// Expected (approx):
// Organisational: 20 × 5 × 88 = 8,800
// Individual: 20 × 7 × 61 = 8,540
// Travel: 20 × 275 (500-1999 band) = 5,500
// Total: ~22,840
```

---

#### Task 3.4: Add Calculator to tRPC Router

**Why**: Expose calculator to frontend.

**Do**:

Create `app/src/server/routers/pipeline/calculator.ts`:

```typescript
import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
import { calculateErasmusIncome } from '@/lib/erasmus/income-calculator'

export const calculatorRouter = router({
  calculateIncome: orgProcedure
    .input(z.object({
      projectId: z.string().uuid().optional(),
      participantCount: z.number().int().positive(),
      activityDays: z.number().int().min(5).max(21),
      travelDays: z.number().int().min(1).max(6).default(2),
      originCity: z.string().min(2),
      destinationCity: z.string().min(2),
      hostCountryCode: z.string().length(2),
      includeGreenTravel: z.boolean().default(false),
      participantsWithFewerOpportunities: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = calculateErasmusIncome(input)

      // Optionally save to project
      if (input.projectId) {
        await ctx.prisma.pipelineProject.updateMany({
          where: {
            id: input.projectId,
            tenantId: ctx.orgId,
          },
          data: {
            erasmusGrantCalculated: result.totalGrant,
          },
        })
      }

      return result
    }),
})
```

Add to pipeline router in `app/src/server/routers/pipeline/_app.ts`:

```typescript
import { calculatorRouter } from './calculator'

export const pipelineRouter = router({
  projects: pipelineProjectsRouter,
  phases: pipelinePhasesRouter,
  vendors: vendorsRouter,
  quotes: quotesRouter,
  calculator: calculatorRouter, // ✅ ADD THIS
})
```

**Verify**: tRPC compiles, calculator endpoint available

---

## Validation Strategy

### Automated Checks

**Run after EVERY task:**

```bash
cd app

# 1. Type check
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Build
npm run build

# 4. Prisma validate
npx prisma validate

# 5. Generate Prisma types
npx prisma generate
```

All must pass before moving to next task.

---

### New Tests to Write

| Test File | Test Case | What It Validates |
|-----------|-----------|-------------------|
| `app/src/lib/erasmus/income-calculator.test.ts` | Calculate income for Stockholm → Barcelona | Calculator returns correct grant amount |
| `app/src/lib/erasmus/distance-calculator.test.ts` | Calculate distance between major cities | Haversine formula accurate within 5% |
| `app/e2e/pipeline-projects.spec.ts` | Create pipeline project with default phases | Project + 6 phases created successfully |
| `app/e2e/pipeline-income.spec.ts` | Calculate Erasmus+ income and save to project | Calculator UI works, amount stored in DB |
| `app/e2e/pipeline-phases.spec.ts` | Add/edit/delete phases | Phase CRUD operations work |
| `app/e2e/pipeline-chat.spec.ts` | Chat with AccommodationAgent | AI agent responds with suggestions |
| `app/e2e/pipeline-profit.spec.ts` | View profit dashboard | Accumulated profit displays correctly |

---

### Manual Validation

**After Phase 1 (Database):**
```bash
cd app
npx prisma studio
```

- [x] Open Prisma Studio
- [x] Check new tables exist (pipeline_projects, pipeline_phases, etc.)
- [x] Verify indexes created
- [x] Check foreign key constraints

**After Phase 2 (Backend API):**
```bash
cd app
npm run dev
```

Open http://localhost:3000/api/trpc (tRPC playground)

Test endpoints manually:
```typescript
// Create project
trpc.pipeline.projects.create.mutate({
  name: "Test Barcelona Exchange",
  type: "STUDENT_EXCHANGE",
  startDate: new Date("2026-06-01"),
  endDate: new Date("2026-06-07"),
  budgetTotal: 50000,
  participantCount: 20,
  location: "Barcelona, Spain",
  hostCountry: "ES",
})

// List projects
trpc.pipeline.projects.list.query()

// Calculate income
trpc.pipeline.calculator.calculateIncome.mutate({
  participantCount: 20,
  activityDays: 5,
  travelDays: 2,
  originCity: "Stockholm",
  destinationCity: "Barcelona",
  hostCountryCode: "ES",
})
```

Expected:
- [x] Project created with ID returned
- [x] 6 default phases auto-created
- [x] Income calculation returns ~€22,840

**After Phase 3 (Income Calculator):**

Test calculator accuracy against official EU calculator:
- https://webgate.ec.europa.eu/erasmus-esc/index/youth/home

Test 3 scenarios:
1. Stockholm → Barcelona (20 participants, 5 days)
2. Berlin → Athens (15 participants, 7 days)
3. Paris → Warsaw (25 participants, 10 days)

Compare results (should match within €100):
- [x] Scenario 1: Our calculator vs EU calculator
- [x] Scenario 2: Our calculator vs EU calculator
- [x] Scenario 3: Our calculator vs EU calculator

---

### Edge Cases to Test

**Income Calculator:**
- [ ] Activity days = 5 (minimum)
- [ ] Activity days = 21 (maximum)
- [ ] Distance < 100km (lowest band)
- [ ] Distance > 8,000km (highest band)
- [ ] Host country with no rate → Should throw error
- [ ] City not in CITY_COORDINATES → Should throw error with helpful message
- [ ] Green travel enabled vs disabled
- [ ] Participants with fewer opportunities = 0 vs > 0

**tRPC Procedures:**
- [ ] Try to access other org's project → Should throw "not found"
- [ ] Try to create project with endDate before startDate → Should throw error
- [ ] Try to create phase with budget > project total → Should succeed (warning in UI)
- [ ] Delete project with phases → Should cascade delete phases
- [ ] Update project that doesn't exist → Should throw error

**Database:**
- [ ] Create project without tenantId → Should fail (constraint)
- [ ] Create phase without project → Should fail (FK constraint)
- [ ] Create quote without vendor → Should fail (FK constraint)

---

### Regression Check

**Before deploying, verify existing features still work:**

```bash
cd app
npm run test # Run Playwright E2E tests
```

Check these user flows:
- [x] Sign in with Clerk
- [x] View projects list
- [x] Create new seed
- [x] Turn seed into project
- [x] View project detail
- [x] Generate programme

All should work identically to before integration.

---

## Risks

### Technical Risks

**Database Migration Failure:**
- Risk: Production migration fails, data corruption
- Mitigation: Test on staging first, backup database, have rollback script
- Rollback: Restore from backup, revert migration

**Income Calculator Inaccuracy:**
- Risk: Calculations don't match EU official calculator
- Mitigation: Test against 10+ scenarios, validate with EU docs
- Fix: Update unit cost tables, adjust formulas

**Performance Degradation:**
- Risk: New queries slow down app
- Mitigation: Use indexes, optimize queries with `select`, test with 1000+ records
- Fix: Add more indexes, implement pagination

**Email Deliverability:**
- Risk: Vendor emails go to spam, SendGrid blocks account
- Mitigation: Start with Resend (better deliverability), add rate limiting
- Fix: Warm up domain, reduce send rate, use transactional templates

---

## Summary

This plan integrates the project-pipeline system into the main Open Horizon app to create a unified Erasmus+ business platform. The implementation follows a phased approach:

1. **Database** - Add pipeline models with multi-tenancy
2. **Backend API** - Convert Fastify routes to tRPC procedures
3. **Income Calculator** - Calculate Erasmus+ grants from official EU rules
4. **AI Agents** - Migrate accommodation, activities, emergency agents
5. **Email Automation** - Compose and send quote requests via Resend
6. **Frontend** - Build pipeline UI with Radix components
7. **Profit Dashboard** - Track income vs costs, show accumulated profit
8. **Application Generator** - Generate KA1 Youth Exchange applications

**Timeline:** 4 weeks (32 days)
**Target:** Ship by February 9, 2026 (3 days before deadline)
**Success Metric:** Generate 5-10 applications by February 12

---

## Files Created (Summary)

**Database:**
- `app/prisma/migrations/XXX_add_pipeline_models/migration.sql`

**Backend:**
- `app/src/server/routers/pipeline/_app.ts`
- `app/src/server/routers/pipeline/projects.ts`
- `app/src/server/routers/pipeline/phases.ts`
- `app/src/server/routers/pipeline/vendors.ts`
- `app/src/server/routers/pipeline/quotes.ts`
- `app/src/server/routers/pipeline/calculator.ts`

**Libraries:**
- `app/src/lib/erasmus/unit-costs.ts`
- `app/src/lib/erasmus/distance-calculator.ts`
- `app/src/lib/erasmus/income-calculator.ts`

**Tests:**
- `app/src/lib/erasmus/income-calculator.test.ts`
- `app/src/lib/erasmus/distance-calculator.test.ts`
- `app/e2e/pipeline-projects.spec.ts`
- `app/e2e/pipeline-income.spec.ts`
- `app/e2e/pipeline-phases.spec.ts`

**Total:** 16 new files, 2 modified files

---

**PLAN COMPLETE - DO NOT IMPLEMENT**

This plan is ready for handoff to implementation agent.
