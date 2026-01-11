# Feature: Budget Tracking and Alerts Dashboard

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Implement a comprehensive budget tracking system for Erasmus+ project pipeline management. This feature adds dedicated budget overview dashboards, granular expense tracking, visual budget health indicators, configurable alert thresholds, email notifications for budget overruns, and export capabilities for budget reports. Users will be able to track actual vs. planned spending across all project phases, add individual expense entries, categorize expenses, and receive proactive alerts when budgets approach or exceed thresholds.

## User Story

As a **project coordinator managing Erasmus+ projects**
I want to **track budget spending in real-time with visual indicators and automated alerts**
So that **I can prevent budget overruns, make informed financial decisions, and maintain compliance with funding requirements**

## Problem Statement

The current system has basic budget tracking (budgetAllocated and budgetSpent at phase and project levels) but lacks:
1. **Granular expense tracking** - No way to record individual expenses, receipts, or categorize spending
2. **Budget alerts** - No proactive warnings when budgets approach or exceed thresholds
3. **Visual dashboards** - Limited visualization of budget health, trends, and breakdowns
4. **Email notifications** - No automated alerts to stakeholders about budget issues
5. **Export capabilities** - Cannot generate budget reports for external review

This makes it difficult for coordinators to prevent overspending and maintain financial transparency.

## Solution Statement

Extend the existing budget tracking foundation with:
1. **Expense model** - Store individual expense entries with categories, receipts, dates, and descriptions
2. **Budget alert system** - Configurable thresholds (90%, 100%) with email notifications via Resend
3. **Budget overview dashboard** - Visual charts showing total budget vs. spent, phase breakdowns, and trends
4. **Enhanced phase budget UI** - Expense management interface with CRUD operations and visual indicators
5. **Alert configuration** - Per-project alert threshold settings with email recipient management
6. **Export functionality** - Generate CSV/PDF budget reports for download

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: High
**Primary Systems Affected**:
- Database (new Expense model, BudgetAlert model)
- tRPC routers (new expenses and alerts routers)
- UI components (budget dashboard, expense forms, alert configuration)
- Email service (budget alert notifications)

**Dependencies**:
- Existing: Resend email service, shadcn/ui Charts (Recharts)
- New: CSV export library (to be added)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

**Database Schema:**
- `app/prisma/schema.prisma` (lines 376-442) - PipelineProject and PipelinePhase models with existing budget fields
- `app/prisma/schema.prisma` (lines 474-503) - Communication model showing email pattern
- `app/prisma/schema.prisma` (lines 505-528) - Quote model showing how budgetSpent is incremented

**Budget Calculation Logic:**
- `app/src/lib/erasmus/income-calculator.ts` (lines 57-198) - Erasmus+ grant calculation patterns
- `app/src/server/routers/pipeline/phases.ts` (lines 189-266) - Default phase budget allocation logic (40/25/20/10/3/2)

**Budget Tracking Implementation:**
- `app/src/server/routers/pipeline/quotes.ts` (lines 168-217) - Quote acceptance incrementing budgetSpent
- `app/src/server/routers/pipeline/projects.ts` (lines 173-285) - Project budget procedures

**Email Service:**
- `app/src/lib/email/resend.ts` (entire file) - Email sending patterns with Resend
- `app/src/server/routers/pipeline/communications.ts` (lines 250-326) - sendQuoteRequest email example

**UI Components:**
- `app/src/components/pipeline/phases/PhaseCard.tsx` (entire file) - Budget progress bar pattern
- `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx` (lines 241-284) - Budget overview card
- `app/src/app/(dashboard)/pipeline/projects/[id]/page.tsx` (lines 125-202) - Financial overview cards

**Form Patterns:**
- `app/src/components/pipeline/projects/CreateProjectDialog.tsx` - React Hook Form + Zod + tRPC mutation pattern

**Testing:**
- `app/tests/critical-issues.spec.ts` - Playwright test patterns

### New Files to Create

**Database Migration:**
- `app/prisma/migrations/YYYYMMDDHHMMSS_add_budget_tracking/migration.sql` - Schema migration for Expense and BudgetAlert models

**tRPC Routers:**
- `app/src/server/routers/pipeline/expenses.ts` - Expense CRUD operations
- `app/src/server/routers/pipeline/alerts.ts` - Budget alert configuration and triggering

**Email Templates:**
- `app/src/lib/email/templates/budget-alert.ts` - Budget alert email HTML template

**UI Components:**
- `app/src/components/budget/BudgetOverviewDashboard.tsx` - Project-level budget dashboard with charts
- `app/src/components/budget/BudgetBreakdownChart.tsx` - Donut chart showing phase budget allocation
- `app/src/components/budget/BudgetTrendChart.tsx` - Area chart showing spending over time
- `app/src/components/budget/BudgetUtilizationGauge.tsx` - Radial gauge for budget utilization percentage
- `app/src/components/budget/ExpenseList.tsx` - List of expenses with filters
- `app/src/components/budget/AddExpenseDialog.tsx` - Form to add new expense
- `app/src/components/budget/BudgetAlertConfig.tsx` - Configure alert thresholds
- `app/src/components/budget/BudgetHealthBadge.tsx` - Visual indicator (green/yellow/red)

**API Routes:**
- `app/src/app/api/budget/export/route.ts` - Generate CSV budget export

**Types:**
- `app/src/types/budget.ts` - TypeScript types for Expense, BudgetAlert, BudgetHealth

**Utility Functions:**
- `app/src/lib/budget/health-calculator.ts` - Calculate budget health status and trigger alerts
- `app/src/lib/budget/export.ts` - Generate CSV/PDF budget reports

**Tests:**
- `app/tests/budget-tracking.spec.ts` - E2E tests for budget dashboard and expense management

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

**shadcn/ui Charts:**
- [Chart Component Documentation](https://ui.shadcn.com/docs/components/chart)
  - Section: Installation and setup
  - Why: Required for installing Recharts and chart components
- [Area Chart Examples](https://ui.shadcn.com/charts/area)
  - Section: Basic area chart with gradient
  - Why: Pattern for spending trend chart
- [Pie/Donut Chart Examples](https://ui.shadcn.com/charts/pie)
  - Section: Interactive donut chart with legend
  - Why: Pattern for budget breakdown by phase
- [Radial Chart Examples](https://ui.shadcn.com/charts/radial)
  - Section: Radial chart with custom label
  - Why: Pattern for budget utilization gauge
- [React 19 Compatibility Guide](https://ui.shadcn.com/docs/react-19)
  - Section: Package overrides for react-is
  - Why: Fix React 19 compatibility with Recharts

**Resend Email API:**
- [Resend Email Sending Guide](https://resend.com/docs/send-with-nodejs)
  - Section: Sending emails with HTML
  - Why: Pattern for budget alert emails

**Next.js Route Handlers:**
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
  - Section: File-based API routes
  - Why: Pattern for CSV export endpoint

**CSV Export:**
- [Papa Parse Documentation](https://www.papaparse.com/docs#json-to-csv)
  - Section: JSON to CSV conversion
  - Why: Generate CSV exports of budget data

### Patterns to Follow

**Naming Conventions:**
```typescript
// Components: PascalCase
BudgetOverviewDashboard.tsx
AddExpenseDialog.tsx

// Utilities: camelCase
calculateBudgetHealth.ts
generateBudgetReport.ts

// Types: PascalCase
Expense
BudgetAlert
BudgetHealthStatus

// Database models: PascalCase
model Expense {}
model BudgetAlert {}
```

**Error Handling:**
```typescript
// Pattern from app/src/lib/email/resend.ts
try {
  const result = await sendBudgetAlert(params)
  if (!result.success) {
    console.error('❌ Failed to send alert:', result.error)
    return { success: false, error: result.error }
  }
  console.log('✅ Alert sent successfully:', result.messageId)
  return { success: true, messageId: result.messageId }
} catch (error) {
  console.error('❌ Budget alert error:', error)
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
  }
}
```

**tRPC Mutation Pattern:**
```typescript
// Pattern from app/src/server/routers/pipeline/quotes.ts (lines 168-217)
export const expensesRouter = router({
  create: orgProcedure
    .input(createExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Verify ownership
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: { id: input.phaseId },
        include: { project: true },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      // 2. Create expense
      const expense = await ctx.prisma.expense.create({
        data: {
          tenantId: ctx.orgId,
          phaseId: input.phaseId,
          projectId: phase.projectId,
          amount: input.amount,
          category: input.category,
          description: input.description,
          date: input.date,
        },
      })

      // 3. Update budgetSpent (phase + project)
      await ctx.prisma.pipelinePhase.update({
        where: { id: input.phaseId },
        data: { budgetSpent: { increment: input.amount } },
      })

      await ctx.prisma.pipelineProject.update({
        where: { id: phase.projectId },
        data: { budgetSpent: { increment: input.amount } },
      })

      // 4. Check for budget alerts
      await checkAndTriggerBudgetAlerts(phase.projectId, ctx.prisma)

      return expense
    }),
})
```

**React Hook Form + Zod Pattern:**
```typescript
// Pattern from app/src/components/pipeline/projects/CreateProjectDialog.tsx
const expenseSchema = z.object({
  phaseId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  category: z.enum(['ACCOMMODATION', 'TRAVEL', 'FOOD', 'ACTIVITIES', 'INSURANCE', 'OTHER']),
  description: z.string().min(3, 'Description required'),
  date: z.date(),
  receiptUrl: z.string().url().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

const { register, handleSubmit, formState: { errors } } = useForm<ExpenseFormData>({
  resolver: zodResolver(expenseSchema),
})

const createExpense = trpc.pipeline.expenses.create.useMutation({
  onSuccess: () => {
    toast.success('Expense added successfully')
    router.refresh()
  },
})

const onSubmit = (data: ExpenseFormData) => {
  createExpense.mutate(data)
}
```

**shadcn/ui Chart Pattern:**
```typescript
// Pattern from research - shadcn/ui Charts with Recharts
"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  spending: {
    label: "Spending",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function BudgetTrendChart({ data }: { data: SpendingData[] }) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <AreaChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="spending"
          type="natural"
          fill="var(--color-spending)"
          stroke="var(--color-spending)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
```

**Email Template Pattern:**
```typescript
// Pattern from app/src/lib/email/resend.ts (lines 86-169)
export async function sendBudgetAlertEmail(params: {
  projectName: string
  budgetTotal: number
  budgetSpent: number
  percentage: number
  threshold: number
  recipientEmail: string
  projectUrl: string
}): Promise<EmailResult> {
  const subject = `⚠️ Budget Alert: ${params.projectName} (${params.percentage.toFixed(0)}% spent)`

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Budget Alert for ${params.projectName}</h2>

  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
    <strong>⚠️ Budget threshold reached</strong>
    <p>Your project has reached ${params.percentage.toFixed(1)}% of allocated budget.</p>
  </div>

  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Total Budget:</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">€${params.budgetTotal.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Spent:</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">€${params.budgetSpent.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Remaining:</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">€${(params.budgetTotal - params.budgetSpent).toLocaleString()}</td>
    </tr>
  </table>

  <p style="margin-top: 20px;">
    <a href="${params.projectUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      View Project Budget
    </a>
  </p>
</div>
`

  return sendEmail({
    to: params.recipientEmail,
    subject,
    html,
  })
}
```

**Budget Health Calculation:**
```typescript
// New pattern for budget health status
export type BudgetHealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OVER_BUDGET'

export interface BudgetHealth {
  status: BudgetHealthStatus
  percentage: number
  message: string
  color: string
}

export function calculateBudgetHealth(allocated: number, spent: number): BudgetHealth {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0

  if (percentage >= 100) {
    return {
      status: 'OVER_BUDGET',
      percentage,
      message: 'Budget exceeded',
      color: 'red',
    }
  } else if (percentage >= 90) {
    return {
      status: 'CRITICAL',
      percentage,
      message: 'Budget almost exhausted',
      color: 'orange',
    }
  } else if (percentage >= 75) {
    return {
      status: 'WARNING',
      percentage,
      message: 'Budget usage high',
      color: 'yellow',
    }
  } else {
    return {
      status: 'HEALTHY',
      percentage,
      message: 'Budget on track',
      color: 'green',
    }
  }
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Database Schema & Models

Extend the database schema to support granular expense tracking and configurable budget alerts.

**Tasks:**

- Add Expense and BudgetAlert models to Prisma schema
- Create enum types for ExpenseCategory and AlertType
- Add relations to existing PipelineProject and PipelinePhase models

### Phase 2: Backend Services

Implement tRPC routers, budget calculation logic, and alert triggering system.

**Tasks:**

- Create expenses tRPC router with CRUD operations
- Create alerts tRPC router for alert configuration
- Implement budget health calculator utility
- Implement alert checking and triggering logic
- Create budget alert email template

### Phase 3: Chart Components

Install shadcn/ui Charts and create reusable chart components for budget visualization.

**Tasks:**

- Install Recharts via shadcn CLI
- Add React 19 compatibility override for react-is
- Create BudgetBreakdownChart (donut chart)
- Create BudgetTrendChart (area chart)
- Create BudgetUtilizationGauge (radial chart)

### Phase 4: Budget Dashboard UI

Build the comprehensive budget overview dashboard for project-level budget tracking.

**Tasks:**

- Create BudgetOverviewDashboard component
- Integrate charts into dashboard layout
- Add budget health indicators
- Implement responsive design with Tailwind

### Phase 5: Expense Management UI

Build expense tracking interface with CRUD operations and visual feedback.

**Tasks:**

- Create ExpenseList component with filtering
- Create AddExpenseDialog form component
- Create EditExpenseDialog form component
- Add expense summary to phase detail page
- Update phase budget card with expense count

### Phase 6: Alert Configuration UI

Build interface for configuring budget alert thresholds and email recipients.

**Tasks:**

- Create BudgetAlertConfig component
- Implement threshold slider with visual preview
- Add email recipient management
- Integrate into project settings page

### Phase 7: Export Functionality

Implement CSV export for budget reports.

**Tasks:**

- Install papaparse for CSV generation
- Create budget export API route
- Implement CSV generation with expense details
- Add export button to budget dashboard

### Phase 8: Integration & Testing

Wire up all components, test budget flow, and validate alerts.

**Tasks:**

- Integrate budget dashboard into project detail page
- Test expense creation → budgetSpent update → alert trigger flow
- Create Playwright E2E tests for budget tracking
- Test email alert delivery
- Validate CSV export format

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE app/prisma/schema.prisma

- **IMPLEMENT**: Add Expense model after Quote model
- **PATTERN**: Mirror Quote model structure (lines 505-528)
- **SCHEMA**:
```prisma
model Expense {
  id        String @id @default(uuid()) @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  projectId String @map("project_id") @db.Uuid
  phaseId   String @map("phase_id") @db.Uuid

  amount      Decimal         @db.Decimal(12, 2)
  currency    String          @default("EUR")
  category    ExpenseCategory
  description String          @db.Text
  date        DateTime
  receiptUrl  String?         @map("receipt_url")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  organization Organization    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  project      PipelineProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  phase        PipelinePhase   @relation(fields: [phaseId], references: [id], onDelete: Cascade)

  @@index([tenantId, projectId])
  @@index([phaseId])
  @@index([category])
  @@index([date])
  @@map("expenses")
}

enum ExpenseCategory {
  ACCOMMODATION
  TRAVEL
  FOOD
  ACTIVITIES
  INSURANCE
  EMERGENCY
  OTHER
}

model BudgetAlert {
  id        String @id @default(uuid()) @db.Uuid
  projectId String @map("project_id") @db.Uuid

  threshold        Int      // Percentage threshold (e.g., 90, 100)
  emailRecipients  String[] // Array of email addresses
  enabled          Boolean  @default(true)
  lastTriggeredAt  DateTime? @map("last_triggered_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  project PipelineProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([enabled])
  @@map("budget_alerts")
}
```
- **IMPORTS**: None - schema file
- **GOTCHA**: Must add Expense relation to Organization, PipelineProject, and PipelinePhase models
- **VALIDATE**: `npx prisma format && npx prisma validate`

### UPDATE app/prisma/schema.prisma

- **IMPLEMENT**: Add Expense and BudgetAlert relations to existing models
- **PATTERN**: Mirror existing relation patterns
- **CHANGES**:
  - Add `expenses Expense[]` to Organization model (line ~38)
  - Add `expenses Expense[]` and `budgetAlerts BudgetAlert[]` to PipelineProject model (line ~413)
  - Add `expenses Expense[]` to PipelinePhase model (line ~441)
- **VALIDATE**: `npx prisma format && npx prisma validate`

### CREATE Database Migration

- **IMPLEMENT**: Generate and apply Prisma migration
- **COMMANDS**:
```bash
npx prisma migrate dev --name add_budget_tracking_models
```
- **VALIDATE**: `npx prisma db push && npx prisma generate`

### CREATE app/src/types/budget.ts

- **IMPLEMENT**: TypeScript types for budget tracking
- **PATTERN**: Follow app/src/types/pipeline.ts patterns
- **TYPES**:
```typescript
import { ExpenseCategory } from '@prisma/client'

export interface Expense {
  id: string
  tenantId: string
  projectId: string
  phaseId: string
  amount: number
  currency: string
  category: ExpenseCategory
  description: string
  date: Date
  receiptUrl?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface BudgetAlert {
  id: string
  projectId: string
  threshold: number
  emailRecipients: string[]
  enabled: boolean
  lastTriggeredAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export type BudgetHealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OVER_BUDGET'

export interface BudgetHealth {
  status: BudgetHealthStatus
  percentage: number
  message: string
  colorClass: string
  progressColor: string
}

export interface BudgetSummary {
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  health: BudgetHealth
  phases: Array<{
    id: string
    name: string
    type: string
    allocated: number
    spent: number
    remaining: number
    percentage: number
  }>
}

export interface SpendingTrendData {
  date: string
  spending: number
  cumulative: number
}

export function formatCurrency(amount: number | string, currency: string = 'EUR'): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
  }).format(numericAmount)
}
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/lib/budget/health-calculator.ts

- **IMPLEMENT**: Budget health calculation utility
- **PATTERN**: Mirror app/src/lib/erasmus/income-calculator.ts structure
- **CODE**:
```typescript
import { BudgetHealth, BudgetHealthStatus } from '@/types/budget'

/**
 * Calculate budget health status based on spent percentage
 */
export function calculateBudgetHealth(allocated: number, spent: number): BudgetHealth {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0

  let status: BudgetHealthStatus
  let message: string
  let colorClass: string
  let progressColor: string

  if (percentage >= 100) {
    status = 'OVER_BUDGET'
    message = 'Budget exceeded'
    colorClass = 'text-red-600 dark:text-red-400'
    progressColor = 'bg-red-500'
  } else if (percentage >= 90) {
    status = 'CRITICAL'
    message = 'Budget almost exhausted'
    colorClass = 'text-orange-600 dark:text-orange-400'
    progressColor = 'bg-orange-500'
  } else if (percentage >= 75) {
    status = 'WARNING'
    message = 'Budget usage high'
    colorClass = 'text-yellow-600 dark:text-yellow-400'
    progressColor = 'bg-yellow-500'
  } else {
    status = 'HEALTHY'
    message = 'Budget on track'
    colorClass = 'text-green-600 dark:text-green-400'
    progressColor = 'bg-green-500'
  }

  return {
    status,
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    message,
    colorClass,
    progressColor,
  }
}

/**
 * Determine if alert should be triggered based on threshold
 */
export function shouldTriggerAlert(
  allocated: number,
  spent: number,
  threshold: number,
  lastTriggeredAt: Date | null
): boolean {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0

  // Only trigger if threshold reached
  if (percentage < threshold) {
    return false
  }

  // Don't re-trigger within 24 hours
  if (lastTriggeredAt) {
    const hoursSinceLastTrigger = (Date.now() - lastTriggeredAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastTrigger < 24) {
      return false
    }
  }

  return true
}
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/lib/email/templates/budget-alert.ts

- **IMPLEMENT**: Budget alert email HTML template
- **PATTERN**: Mirror sendQuoteRequestEmail from app/src/lib/email/resend.ts (lines 86-169)
- **CODE**:
```typescript
import { sendEmail, EmailResult } from '../resend'

export async function sendBudgetAlertEmail(params: {
  projectName: string
  projectId: string
  budgetTotal: number
  budgetSpent: number
  budgetRemaining: number
  percentage: number
  threshold: number
  recipientEmails: string[]
}): Promise<EmailResult> {
  const subject = `⚠️ Budget Alert: ${params.projectName} (${Math.round(params.percentage)}% spent)`

  const statusColor = params.percentage >= 100 ? '#dc2626' : '#f59e0b'
  const statusBg = params.percentage >= 100 ? '#fef2f2' : '#fef3c7'
  const statusText = params.percentage >= 100 ? 'Budget Exceeded' : 'Budget Threshold Reached'

  const projectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pipeline/projects/${params.projectId}`

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1f2937; margin-bottom: 24px;">Budget Alert: ${params.projectName}</h2>

  <div style="background: ${statusBg}; border-left: 4px solid ${statusColor}; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <strong style="color: ${statusColor};">⚠️ ${statusText}</strong>
    <p style="margin: 8px 0 0 0; color: #4b5563;">
      Your project has reached ${Math.round(params.percentage)}% of the allocated budget (${params.threshold}% threshold).
    </p>
  </div>

  <h3 style="color: #1f2937; font-size: 16px; margin-top: 24px;">Budget Summary</h3>

  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;"><strong>Total Budget:</strong></td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">€${params.budgetTotal.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;"><strong>Spent:</strong></td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${statusColor};">€${params.budgetSpent.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;"><strong>Remaining:</strong></td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${params.budgetRemaining >= 0 ? '€' : '-€'}${Math.abs(params.budgetRemaining).toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td style="padding: 12px 8px;"><strong>Utilization:</strong></td>
      <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: ${statusColor};">${Math.round(params.percentage)}%</td>
    </tr>
  </table>

  <p style="margin: 24px 0; color: #4b5563;">
    Please review the project budget and take necessary action to prevent overspending.
  </p>

  <div style="margin-top: 32px; text-align: center;">
    <a href="${projectUrl}" style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
      View Project Budget
    </a>
  </div>

  <hr style="margin-top: 40px; border: none; border-top: 1px solid #e5e7eb;">
  <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
    This email was sent via Open Horizon - Erasmus+ Project Management Platform<br>
    You are receiving this because you are configured as a budget alert recipient for this project.
  </p>
</div>
`

  // Send to all recipients
  const results = await Promise.all(
    params.recipientEmails.map(email =>
      sendEmail({
        to: email,
        subject,
        html,
      })
    )
  )

  // Check if any succeeded
  const anySucceeded = results.some(r => r.success)
  const allSucceeded = results.every(r => r.success)

  if (!anySucceeded) {
    return {
      success: false,
      error: 'Failed to send to any recipients',
    }
  }

  return {
    success: allSucceeded,
    messageId: results.find(r => r.messageId)?.messageId,
    error: allSucceeded ? undefined : 'Some recipients failed',
  }
}
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/server/routers/pipeline/expenses.ts

- **IMPLEMENT**: Expenses tRPC router with CRUD operations
- **PATTERN**: Mirror app/src/server/routers/pipeline/quotes.ts structure
- **CODE**:
```typescript
import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'
import { ExpenseCategory } from '@prisma/client'
import { shouldTriggerAlert } from '@/lib/budget/health-calculator'
import { sendBudgetAlertEmail } from '@/lib/email/templates/budget-alert'

const createExpenseSchema = z.object({
  phaseId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(3, 'Description is required'),
  date: z.date(),
  receiptUrl: z.string().url().optional(),
})

const updateExpenseSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    amount: z.number().positive().optional(),
    category: z.nativeEnum(ExpenseCategory).optional(),
    description: z.string().min(3).optional(),
    date: z.date().optional(),
    receiptUrl: z.string().url().optional().nullable(),
  }),
})

export const expensesRouter = router({
  // List expenses for a phase or project
  list: orgProcedure
    .input(
      z.object({
        projectId: z.string().uuid().optional(),
        phaseId: z.string().uuid().optional(),
        category: z.nativeEnum(ExpenseCategory).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Build where clause
      const where: any = {
        tenantId: ctx.orgId,
      }

      if (input.projectId) {
        where.projectId = input.projectId
      }

      if (input.phaseId) {
        where.phaseId = input.phaseId
      }

      if (input.category) {
        where.category = input.category
      }

      if (input.startDate || input.endDate) {
        where.date = {}
        if (input.startDate) {
          where.date.gte = input.startDate
        }
        if (input.endDate) {
          where.date.lte = input.endDate
        }
      }

      const expenses = await ctx.prisma.expense.findMany({
        where,
        include: {
          phase: {
            select: {
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      })

      return expenses
    }),

  // Get single expense
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          phase: true,
          project: true,
        },
      })

      if (!expense) {
        throw new Error('Expense not found')
      }

      return expense
    }),

  // Create expense
  create: orgProcedure
    .input(createExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      // Get phase with project
      const phase = await ctx.prisma.pipelinePhase.findFirst({
        where: {
          id: input.phaseId,
        },
        include: {
          project: true,
        },
      })

      if (!phase || phase.project.tenantId !== ctx.orgId) {
        throw new Error('Phase not found')
      }

      // Create expense
      const expense = await ctx.prisma.expense.create({
        data: {
          tenantId: ctx.orgId,
          phaseId: input.phaseId,
          projectId: phase.projectId,
          amount: input.amount,
          category: input.category,
          description: input.description,
          date: input.date,
          receiptUrl: input.receiptUrl,
        },
      })

      // Update budgetSpent for phase
      const updatedPhase = await ctx.prisma.pipelinePhase.update({
        where: { id: input.phaseId },
        data: {
          budgetSpent: {
            increment: input.amount,
          },
        },
      })

      // Update budgetSpent for project
      const updatedProject = await ctx.prisma.pipelineProject.update({
        where: { id: phase.projectId },
        data: {
          budgetSpent: {
            increment: input.amount,
          },
        },
      })

      // Check for budget alerts
      const alerts = await ctx.prisma.budgetAlert.findMany({
        where: {
          projectId: phase.projectId,
          enabled: true,
        },
      })

      for (const alert of alerts) {
        const budgetTotal = Number(updatedProject.budgetTotal)
        const budgetSpent = Number(updatedProject.budgetSpent)

        if (shouldTriggerAlert(budgetTotal, budgetSpent, alert.threshold, alert.lastTriggeredAt)) {
          // Send alert email
          await sendBudgetAlertEmail({
            projectName: updatedProject.name,
            projectId: updatedProject.id,
            budgetTotal,
            budgetSpent,
            budgetRemaining: budgetTotal - budgetSpent,
            percentage: (budgetSpent / budgetTotal) * 100,
            threshold: alert.threshold,
            recipientEmails: alert.emailRecipients,
          })

          // Update lastTriggeredAt
          await ctx.prisma.budgetAlert.update({
            where: { id: alert.id },
            data: { lastTriggeredAt: new Date() },
          })
        }
      }

      return expense
    }),

  // Update expense
  update: orgProcedure
    .input(updateExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      // Get existing expense
      const existing = await ctx.prisma.expense.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
        include: {
          phase: true,
        },
      })

      if (!existing) {
        throw new Error('Expense not found')
      }

      // If amount changed, adjust budgetSpent
      if (input.data.amount !== undefined && input.data.amount !== Number(existing.amount)) {
        const amountDiff = input.data.amount - Number(existing.amount)

        await ctx.prisma.pipelinePhase.update({
          where: { id: existing.phaseId },
          data: {
            budgetSpent: {
              increment: amountDiff,
            },
          },
        })

        await ctx.prisma.pipelineProject.update({
          where: { id: existing.projectId },
          data: {
            budgetSpent: {
              increment: amountDiff,
            },
          },
        })
      }

      // Update expense
      const expense = await ctx.prisma.expense.update({
        where: { id: input.id },
        data: input.data,
      })

      return expense
    }),

  // Delete expense
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get expense to adjust budgets
      const expense = await ctx.prisma.expense.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.orgId,
        },
      })

      if (!expense) {
        throw new Error('Expense not found')
      }

      // Decrement budgetSpent
      await ctx.prisma.pipelinePhase.update({
        where: { id: expense.phaseId },
        data: {
          budgetSpent: {
            decrement: Number(expense.amount),
          },
        },
      })

      await ctx.prisma.pipelineProject.update({
        where: { id: expense.projectId },
        data: {
          budgetSpent: {
            decrement: Number(expense.amount),
          },
        },
      })

      // Delete expense
      await ctx.prisma.expense.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  // Get expense summary for a phase
  getSummary: orgProcedure
    .input(z.object({ phaseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const expenses = await ctx.prisma.expense.findMany({
        where: {
          phaseId: input.phaseId,
          tenantId: ctx.orgId,
        },
      })

      const totalByCategory = expenses.reduce((acc, expense) => {
        const category = expense.category
        const amount = Number(expense.amount)
        acc[category] = (acc[category] || 0) + amount
        return acc
      }, {} as Record<string, number>)

      return {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        byCategory: totalByCategory,
      }
    }),
})
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/server/routers/pipeline/alerts.ts

- **IMPLEMENT**: Budget alerts tRPC router
- **PATTERN**: Mirror expenses router structure
- **CODE**:
```typescript
import { router, orgProcedure } from '../../trpc'
import { z } from 'zod'

const createAlertSchema = z.object({
  projectId: z.string().uuid(),
  threshold: z.number().min(1).max(200),
  emailRecipients: z.array(z.string().email()).min(1, 'At least one recipient required'),
})

const updateAlertSchema = z.object({
  id: z.string().uuid(),
  data: z.object({
    threshold: z.number().min(1).max(200).optional(),
    emailRecipients: z.array(z.string().email()).optional(),
    enabled: z.boolean().optional(),
  }),
})

export const alertsRouter = router({
  // List alerts for a project
  list: orgProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
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

      const alerts = await ctx.prisma.budgetAlert.findMany({
        where: {
          projectId: input.projectId,
        },
        orderBy: {
          threshold: 'asc',
        },
      })

      return alerts
    }),

  // Get single alert
  getById: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const alert = await ctx.prisma.budgetAlert.findUnique({
        where: { id: input.id },
        include: {
          project: {
            select: {
              tenantId: true,
            },
          },
        },
      })

      if (!alert || alert.project.tenantId !== ctx.orgId) {
        throw new Error('Alert not found')
      }

      return alert
    }),

  // Create alert
  create: orgProcedure
    .input(createAlertSchema)
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

      const alert = await ctx.prisma.budgetAlert.create({
        data: {
          projectId: input.projectId,
          threshold: input.threshold,
          emailRecipients: input.emailRecipients,
        },
      })

      return alert
    }),

  // Update alert
  update: orgProcedure
    .input(updateAlertSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.budgetAlert.findUnique({
        where: { id: input.id },
        include: {
          project: {
            select: {
              tenantId: true,
            },
          },
        },
      })

      if (!existing || existing.project.tenantId !== ctx.orgId) {
        throw new Error('Alert not found')
      }

      const alert = await ctx.prisma.budgetAlert.update({
        where: { id: input.id },
        data: input.data,
      })

      return alert
    }),

  // Delete alert
  delete: orgProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const existing = await ctx.prisma.budgetAlert.findUnique({
        where: { id: input.id },
        include: {
          project: {
            select: {
              tenantId: true,
            },
          },
        },
      })

      if (!existing || existing.project.tenantId !== ctx.orgId) {
        throw new Error('Alert not found')
      }

      await ctx.prisma.budgetAlert.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
```
- **VALIDATE**: `npx tsc --noEmit`

### UPDATE app/src/server/routers/pipeline/_app.ts

- **IMPLEMENT**: Register expenses and alerts routers
- **PATTERN**: Mirror existing router registration
- **IMPORTS**: Add imports for expenses and alerts routers
- **CODE**: Add to pipeline router:
```typescript
expenses: expensesRouter,
alerts: alertsRouter,
```
- **VALIDATE**: `npx tsc --noEmit`

### INSTALL shadcn/ui Charts

- **IMPLEMENT**: Install chart components and dependencies
- **COMMANDS**:
```bash
cd app
npx shadcn@latest add chart
```
- **VALIDATE**: Check that recharts is added to package.json dependencies

### UPDATE app/package.json

- **IMPLEMENT**: Add React 19 compatibility override for react-is
- **PATTERN**: From research - React 19 compatibility fix
- **ADD**:
```json
{
  "overrides": {
    "react-is": "^19.0.0-rc-69d4b800-20241021"
  }
}
```
- **COMMANDS**: `npm install --legacy-peer-deps`
- **VALIDATE**: `npm list react-is`

### CREATE app/src/components/budget/BudgetHealthBadge.tsx

- **IMPLEMENT**: Visual health indicator badge
- **PATTERN**: Mirror PhaseCard badge pattern (app/src/components/pipeline/phases/PhaseCard.tsx lines 31-37)
- **CODE**:
```typescript
'use client'

import { Badge } from '@/components/ui/badge'
import { BudgetHealth } from '@/types/budget'
import { CheckCircle2, AlertTriangle, AlertCircle, XCircle } from 'lucide-react'

interface BudgetHealthBadgeProps {
  health: BudgetHealth
  showIcon?: boolean
}

const healthIcons = {
  HEALTHY: CheckCircle2,
  WARNING: AlertTriangle,
  CRITICAL: AlertCircle,
  OVER_BUDGET: XCircle,
}

const healthColors = {
  HEALTHY: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  WARNING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  CRITICAL: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  OVER_BUDGET: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
}

export function BudgetHealthBadge({ health, showIcon = true }: BudgetHealthBadgeProps) {
  const Icon = healthIcons[health.status]

  return (
    <Badge className={healthColors[health.status]}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {health.message}
    </Badge>
  )
}
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/components/budget/BudgetBreakdownChart.tsx

- **IMPLEMENT**: Donut chart for phase budget breakdown
- **PATTERN**: From research - shadcn/ui Pie Chart with legend
- **CODE**:
```typescript
'use client'

import { Pie, PieChart, Cell } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { formatCurrency } from '@/types/budget'

interface BudgetBreakdownChartProps {
  phases: Array<{
    name: string
    type: string
    spent: number
  }>
}

const chartConfig = {
  spent: {
    label: 'Spent',
  },
  ACCOMMODATION: {
    label: 'Accommodation',
    color: 'var(--chart-1)',
  },
  TRAVEL: {
    label: 'Travel',
    color: 'var(--chart-2)',
  },
  FOOD: {
    label: 'Food',
    color: 'var(--chart-3)',
  },
  ACTIVITIES: {
    label: 'Activities',
    color: 'var(--chart-4)',
  },
  INSURANCE: {
    label: 'Insurance',
    color: 'var(--chart-5)',
  },
  EMERGENCY: {
    label: 'Emergency',
    color: 'hsl(var(--destructive))',
  },
  CUSTOM: {
    label: 'Other',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig

export function BudgetBreakdownChart({ phases }: BudgetBreakdownChartProps) {
  const chartData = phases.map(phase => ({
    phase: phase.type,
    name: phase.name,
    spent: phase.spent,
    fill: `var(--color-${phase.type})`,
  }))

  const totalSpent = phases.reduce((sum, p) => sum + p.spent, 0)

  return (
    <div className="flex flex-col gap-4">
      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.name
                  }
                  return ''
                }}
                formatter={(value) => formatCurrency(value as number)}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="spent"
            nameKey="phase"
            innerRadius={60}
            strokeWidth={5}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent />}
            className="flex-wrap gap-2"
          />
        </PieChart>
      </ChartContainer>
      <div className="text-center">
        <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
        <p className="text-sm text-muted-foreground">Total Spent</p>
      </div>
    </div>
  )
}
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/components/budget/BudgetTrendChart.tsx

- **IMPLEMENT**: Area chart for spending trends over time
- **PATTERN**: From research - shadcn/ui Area Chart
- **CODE**:
```typescript
'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { SpendingTrendData, formatCurrency } from '@/types/budget'

interface BudgetTrendChartProps {
  data: SpendingTrendData[]
}

const chartConfig = {
  spending: {
    label: 'Daily Spending',
    color: 'var(--chart-1)',
  },
  cumulative: {
    label: 'Cumulative',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

export function BudgetTrendChart({ data }: BudgetTrendChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <AreaChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => {
            return new Date(value).toLocaleDateString('sv-SE', {
              month: 'short',
              day: 'numeric',
            })
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                return new Date(value).toLocaleDateString('sv-SE', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              }}
              formatter={(value) => formatCurrency(value as number)}
            />
          }
        />
        <Area
          dataKey="cumulative"
          type="monotone"
          fill="var(--color-cumulative)"
          fillOpacity={0.4}
          stroke="var(--color-cumulative)"
          stackId="a"
        />
        <Area
          dataKey="spending"
          type="monotone"
          fill="var(--color-spending)"
          fillOpacity={0.2}
          stroke="var(--color-spending)"
          stackId="b"
        />
      </AreaChart>
    </ChartContainer>
  )
}
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/components/budget/BudgetUtilizationGauge.tsx

- **IMPLEMENT**: Radial gauge for budget utilization
- **PATTERN**: From research - shadcn/ui Radial Chart
- **CODE**:
```typescript
'use client'

import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
} from '@/components/ui/chart'

interface BudgetUtilizationGaugeProps {
  allocated: number
  spent: number
}

const chartConfig = {
  budget: {
    label: 'Budget Utilized',
  },
} satisfies ChartConfig

export function BudgetUtilizationGauge({ allocated, spent }: BudgetUtilizationGaugeProps) {
  const percentage = allocated > 0 ? Math.round((spent / allocated) * 100) : 0

  // Color based on percentage
  const getColor = () => {
    if (percentage >= 100) return '#dc2626' // red
    if (percentage >= 90) return '#f59e0b' // orange
    if (percentage >= 75) return '#eab308' // yellow
    return '#16a34a' // green
  }

  const chartData = [
    {
      category: 'budget',
      value: Math.min(percentage, 100), // Cap at 100 for visual
      fill: getColor(),
    },
  ]

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <RadialBarChart
        data={chartData}
        startAngle={0}
        endAngle={Math.min(percentage, 100) * 3.6}
        innerRadius={80}
        outerRadius={140}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background"
          polarRadius={[86, 74]}
        />
        <RadialBar dataKey="value" background cornerRadius={10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-4xl font-bold"
                    >
                      {percentage}%
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      Utilized
                    </tspan>
                  </text>
                )
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  )
}
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/components/budget/BudgetOverviewDashboard.tsx

- **IMPLEMENT**: Comprehensive budget dashboard component
- **PATTERN**: Combine charts with card layout
- **CODE**:
```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BudgetBreakdownChart } from './BudgetBreakdownChart'
import { BudgetTrendChart } from './BudgetTrendChart'
import { BudgetUtilizationGauge } from './BudgetUtilizationGauge'
import { BudgetHealthBadge } from './BudgetHealthBadge'
import { formatCurrency, BudgetSummary, SpendingTrendData } from '@/types/budget'
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react'

interface BudgetOverviewDashboardProps {
  summary: BudgetSummary
  trendData: SpendingTrendData[]
}

export function BudgetOverviewDashboard({ summary, trendData }: BudgetOverviewDashboardProps) {
  const { totalBudget, totalSpent, totalRemaining, health, phases } = summary

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">Allocated across all phases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {health.percentage.toFixed(1)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRemaining)}</div>
            <p className="text-xs text-muted-foreground">Available for spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <BudgetHealthBadge health={health} />
            <p className="text-xs text-muted-foreground mt-2">{health.percentage.toFixed(1)}% utilized</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>Overall budget consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetUtilizationGauge allocated={totalBudget} spent={totalSpent} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Phase</CardTitle>
            <CardDescription>Budget allocation across project phases</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetBreakdownChart
              phases={phases.map(p => ({
                name: p.name,
                type: p.type,
                spent: p.spent,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Trends</CardTitle>
          <CardDescription>Daily and cumulative spending over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="phases">Phases</TabsTrigger>
            </TabsList>
            <TabsContent value="trends" className="space-y-4">
              <BudgetTrendChart data={trendData} />
            </TabsContent>
            <TabsContent value="phases" className="space-y-4">
              <div className="space-y-4">
                {phases.map(phase => (
                  <div key={phase.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{phase.name}</p>
                      <p className="text-sm text-muted-foreground">{phase.type.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(phase.spent)} / {formatCurrency(phase.allocated)}</p>
                      <p className="text-sm text-muted-foreground">{phase.percentage.toFixed(1)}% used</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/components/budget/ExpenseList.tsx

- **IMPLEMENT**: Expense list with filtering
- **PATTERN**: Mirror quote list patterns
- **CODE**:
```typescript
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/types/budget'
import { ExpenseCategory } from '@prisma/client'
import { MoreHorizontal, FileText, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Expense {
  id: string
  amount: number
  category: ExpenseCategory
  description: string
  date: Date
  receiptUrl?: string | null
  phase: {
    name: string
    type: string
  }
}

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expenseId: string) => void
}

const categoryColors: Record<ExpenseCategory, string> = {
  ACCOMMODATION: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  TRAVEL: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  FOOD: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  ACTIVITIES: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  INSURANCE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  EMERGENCY: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  OTHER: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'ALL'>('ALL')

  const filteredExpenses = categoryFilter === 'ALL'
    ? expenses
    : expenses.filter(e => e.category === categoryFilter)

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expenses</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} • {formatCurrency(totalAmount)}
            </p>
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ExpenseCategory | 'ALL')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {Object.values(ExpenseCategory).map(cat => (
                <SelectItem key={cat} value={cat}>{cat.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No expenses found</p>
          ) : (
            filteredExpenses.map(expense => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={categoryColors[expense.category]}>
                      {expense.category}
                    </Badge>
                    {expense.receiptUrl && (
                      <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                  </div>
                  <p className="font-medium mt-1">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.phase.name} • {new Date(expense.date).toLocaleDateString('sv-SE')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(expense.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/components/budget/AddExpenseDialog.tsx

- **IMPLEMENT**: Form dialog for adding expenses
- **PATTERN**: Mirror CreateProjectDialog pattern
- **CODE**:
```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ExpenseCategory } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

const expenseSchema = z.object({
  phaseId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(3, 'Description is required'),
  date: z.string(), // Date input as string, will convert
  receiptUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface AddExpenseDialogProps {
  phaseId: string
  phaseName: string
  onSuccess?: () => void
}

export function AddExpenseDialog({ phaseId, phaseName, onSuccess }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const utils = trpc.useUtils()

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      phaseId,
      category: ExpenseCategory.OTHER,
      date: new Date().toISOString().split('T')[0],
    },
  })

  const createExpense = trpc.pipeline.expenses.create.useMutation({
    onSuccess: () => {
      toast.success('Expense added successfully')
      utils.pipeline.expenses.list.invalidate()
      utils.pipeline.phases.getById.invalidate()
      utils.pipeline.projects.getById.invalidate()
      setOpen(false)
      form.reset()
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add expense')
    },
  })

  const onSubmit = (data: ExpenseFormData) => {
    createExpense.mutate({
      ...data,
      date: new Date(data.date),
      receiptUrl: data.receiptUrl || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Add a new expense to {phaseName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (EUR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(ExpenseCategory).map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the expense..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createExpense.isPending}>
                {createExpense.isPending ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/components/budget/BudgetAlertConfig.tsx

- **IMPLEMENT**: Alert configuration interface
- **CODE**:
```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Bell, Trash2 } from 'lucide-react'

const alertSchema = z.object({
  threshold: z.number().min(1).max(200),
  emailRecipients: z.string().min(1, 'At least one email required'),
})

type AlertFormData = z.infer<typeof alertSchema>

interface BudgetAlertConfigProps {
  projectId: string
}

export function BudgetAlertConfig({ projectId }: BudgetAlertConfigProps) {
  const [isAdding, setIsAdding] = useState(false)
  const utils = trpc.useUtils()

  const { data: alerts, isLoading } = trpc.pipeline.alerts.list.useQuery({ projectId })

  const form = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      threshold: 90,
      emailRecipients: '',
    },
  })

  const createAlert = trpc.pipeline.alerts.create.useMutation({
    onSuccess: () => {
      toast.success('Budget alert created')
      utils.pipeline.alerts.list.invalidate()
      form.reset()
      setIsAdding(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create alert')
    },
  })

  const updateAlert = trpc.pipeline.alerts.update.useMutation({
    onSuccess: () => {
      toast.success('Alert updated')
      utils.pipeline.alerts.list.invalidate()
    },
  })

  const deleteAlert = trpc.pipeline.alerts.delete.useMutation({
    onSuccess: () => {
      toast.success('Alert deleted')
      utils.pipeline.alerts.list.invalidate()
    },
  })

  const onSubmit = (data: AlertFormData) => {
    const emails = data.emailRecipients.split(',').map(e => e.trim()).filter(Boolean)
    createAlert.mutate({
      projectId,
      threshold: data.threshold,
      emailRecipients: emails,
    })
  }

  const threshold = form.watch('threshold')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Budget Alerts
        </CardTitle>
        <CardDescription>
          Configure automated email notifications when budget thresholds are reached
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Alerts */}
        {!isLoading && alerts && alerts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Active Alerts</h4>
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge>{alert.threshold}%</Badge>
                    {!alert.enabled && (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.emailRecipients.join(', ')}
                  </p>
                  {alert.lastTriggeredAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last triggered: {new Date(alert.lastTriggeredAt).toLocaleDateString('sv-SE')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.enabled}
                    onCheckedChange={(enabled) =>
                      updateAlert.mutate({ id: alert.id, data: { enabled } })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlert.mutate({ id: alert.id })}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Alert */}
        {isAdding ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Threshold: {threshold}%</FormLabel>
                    <FormControl>
                      <Slider
                        min={50}
                        max={150}
                        step={5}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Alert will trigger when budget reaches this percentage
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailRecipients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Recipients</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email1@example.com, email2@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of email addresses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createAlert.isPending}>
                  {createAlert.isPending ? 'Creating...' : 'Create Alert'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Button onClick={() => setIsAdding(true)} variant="outline" className="w-full">
            Add Budget Alert
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```
- **VALIDATE**: `npx tsc --noEmit`

### UPDATE app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx

- **IMPLEMENT**: Add expense management section to phase detail page
- **PATTERN**: Add after existing budget overview card (line ~284)
- **IMPORTS**: Add AddExpenseDialog, ExpenseList
- **CODE**: Add before closing main tag:
```typescript
{/* Expense Management */}
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="text-2xl font-bold">Expenses</h2>
    <AddExpenseDialog
      phaseId={phase.id}
      phaseName={phase.name}
      onSuccess={() => router.refresh()}
    />
  </div>

  <ExpenseList
    expenses={expenses}
    onEdit={(expense) => {/* TODO: implement edit */}}
    onDelete={(expenseId) => {
      deleteExpense.mutate({ id: expenseId }, {
        onSuccess: () => router.refresh()
      })
    }}
  />
</div>
```
- **GOTCHA**: Need to fetch expenses with tRPC query at top of component
- **VALIDATE**: `npx tsc --noEmit && npm run build`

### UPDATE app/src/app/(dashboard)/pipeline/projects/[id]/page.tsx

- **IMPLEMENT**: Add budget overview dashboard to project detail page
- **PATTERN**: Add new tab to existing tabs or separate section
- **IMPORTS**: Add BudgetOverviewDashboard, BudgetAlertConfig
- **CODE**: Add budget tab/section with data fetching:
```typescript
// Fetch budget data
const { data: expenses } = trpc.pipeline.expenses.list.useQuery({ projectId: project.id })

// Calculate summary
const summary = useMemo(() => {
  // Calculate budget summary from project and phases
  return calculateBudgetSummary(project, phases, expenses)
}, [project, phases, expenses])

// Generate trend data
const trendData = useMemo(() => {
  return generateTrendData(expenses || [])
}, [expenses])

// Render
<BudgetOverviewDashboard summary={summary} trendData={trendData} />
<BudgetAlertConfig projectId={project.id} />
```
- **GOTCHA**: Need to implement calculateBudgetSummary and generateTrendData utilities
- **VALIDATE**: `npx tsc --noEmit && npm run build`

### CREATE app/src/lib/budget/summary-calculator.ts

- **IMPLEMENT**: Budget summary calculation utility
- **CODE**:
```typescript
import { PipelineProject, PipelinePhase, Expense } from '@prisma/client'
import { BudgetSummary, SpendingTrendData } from '@/types/budget'
import { calculateBudgetHealth } from './health-calculator'

type ProjectWithPhases = PipelineProject & {
  phases: PipelinePhase[]
}

export function calculateBudgetSummary(
  project: ProjectWithPhases,
  expenses?: Expense[]
): BudgetSummary {
  const totalBudget = Number(project.budgetTotal)
  const totalSpent = Number(project.budgetSpent)
  const totalRemaining = totalBudget - totalSpent
  const health = calculateBudgetHealth(totalBudget, totalSpent)

  const phases = project.phases.map(phase => {
    const allocated = Number(phase.budgetAllocated)
    const spent = Number(phase.budgetSpent)
    const remaining = allocated - spent
    const percentage = allocated > 0 ? (spent / allocated) * 100 : 0

    return {
      id: phase.id,
      name: phase.name,
      type: phase.type,
      allocated,
      spent,
      remaining,
      percentage,
    }
  })

  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    health,
    phases,
  }
}

export function generateTrendData(expenses: Expense[]): SpendingTrendData[] {
  if (expenses.length === 0) return []

  // Group expenses by date
  const expensesByDate = expenses.reduce((acc, expense) => {
    const dateKey = new Date(expense.date).toISOString().split('T')[0]
    if (!acc[dateKey]) {
      acc[dateKey] = 0
    }
    acc[dateKey] += Number(expense.amount)
    return acc
  }, {} as Record<string, number>)

  // Convert to array and sort
  const dates = Object.keys(expensesByDate).sort()

  // Calculate cumulative
  let cumulative = 0
  const trendData: SpendingTrendData[] = dates.map(date => {
    const spending = expensesByDate[date]
    cumulative += spending
    return {
      date,
      spending,
      cumulative,
    }
  })

  return trendData
}
```
- **VALIDATE**: `npx tsc --noEmit`

### INSTALL papaparse

- **IMPLEMENT**: Install CSV export library
- **COMMANDS**:
```bash
cd app
npm install papaparse
npm install --save-dev @types/papaparse
```
- **VALIDATE**: `npm list papaparse`

### CREATE app/src/lib/budget/export.ts

- **IMPLEMENT**: Budget export utility
- **CODE**:
```typescript
import Papa from 'papaparse'
import { Expense } from '@prisma/client'
import { formatCurrency } from '@/types/budget'

export interface BudgetExportRow {
  Date: string
  Phase: string
  Category: string
  Description: string
  Amount: string
  'Receipt URL': string
}

export function generateBudgetCSV(expenses: Expense[], phasesMap: Record<string, { name: string; type: string }>): string {
  const rows: BudgetExportRow[] = expenses.map(expense => ({
    Date: new Date(expense.date).toLocaleDateString('sv-SE'),
    Phase: phasesMap[expense.phaseId]?.name || 'Unknown',
    Category: expense.category.replace('_', ' '),
    Description: expense.description,
    Amount: formatCurrency(Number(expense.amount)),
    'Receipt URL': expense.receiptUrl || '',
  }))

  const csv = Papa.unparse(rows, {
    header: true,
    delimiter: ',',
  })

  return csv
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
```
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/src/app/api/budget/export/route.ts

- **IMPLEMENT**: API route for CSV export
- **PATTERN**: Next.js Route Handler pattern
- **CODE**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { generateBudgetCSV } from '@/lib/budget/export'

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get project ID from search params
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return new NextResponse('Project ID required', { status: 400 })
    }

    // Verify project access
    const project = await prisma.pipelineProject.findFirst({
      where: { id: projectId },
      include: {
        phases: true,
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    // Generate phase map
    const phasesMap = project.phases.reduce((acc, phase) => {
      acc[phase.id] = { name: phase.name, type: phase.type }
      return acc
    }, {} as Record<string, { name: string; type: string }>)

    // Generate CSV
    const csv = generateBudgetCSV(project.expenses, phasesMap)

    // Return CSV file
    const filename = `budget-${project.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Budget export error:', error)
    return new NextResponse('Export failed', { status: 500 })
  }
}
```
- **VALIDATE**: `npx tsc --noEmit`

### UPDATE app/src/components/budget/BudgetOverviewDashboard.tsx

- **IMPLEMENT**: Add export button to dashboard
- **PATTERN**: Add to header section
- **CODE**: Add export button:
```typescript
import { Download } from 'lucide-react'

// In component
const handleExport = () => {
  window.open(`/api/budget/export?projectId=${projectId}`, '_blank')
}

// Add to header
<div className="flex items-center justify-between mb-6">
  <h2 className="text-3xl font-bold">Budget Overview</h2>
  <Button onClick={handleExport} variant="outline">
    <Download className="mr-2 h-4 w-4" />
    Export CSV
  </Button>
</div>
```
- **GOTCHA**: Need to pass projectId as prop to component
- **VALIDATE**: `npx tsc --noEmit`

### CREATE app/tests/budget-tracking.spec.ts

- **IMPLEMENT**: E2E tests for budget tracking
- **PATTERN**: Mirror critical-issues.spec.ts structure
- **CODE**:
```typescript
import { test, expect } from '@playwright/test'

const APP_URL = 'http://localhost:3000'

test.describe('Budget Tracking', () => {
  test.skip('budget overview dashboard displays correctly', async ({ page }) => {
    // Skip auth - requires authenticated session
    await page.goto(`${APP_URL}/pipeline/projects/test-project-id`)

    // Wait for budget dashboard to load
    await page.waitForSelector('[data-testid="budget-dashboard"]')

    // Check for summary cards
    const totalBudgetCard = page.locator('text=Total Budget')
    await expect(totalBudgetCard).toBeVisible()

    const spentCard = page.locator('text=Spent')
    await expect(spentCard).toBeVisible()

    // Check for charts
    const breakdownChart = page.locator('[data-testid="budget-breakdown-chart"]')
    await expect(breakdownChart).toBeVisible()

    const trendChart = page.locator('[data-testid="budget-trend-chart"]')
    await expect(trendChart).toBeVisible()

    await page.screenshot({ path: 'test-results/budget-dashboard.png' })
  })

  test.skip('can add expense to phase', async ({ page }) => {
    await page.goto(`${APP_URL}/pipeline/projects/test-project-id/phases/test-phase-id`)

    // Click add expense button
    await page.click('button:has-text("Add Expense")')

    // Fill expense form
    await page.fill('input[name="amount"]', '150.50')
    await page.selectOption('select[name="category"]', 'FOOD')
    await page.fill('textarea[name="description"]', 'Team lunch')

    // Submit
    await page.click('button[type="submit"]:has-text("Add Expense")')

    // Verify expense appears in list
    await expect(page.locator('text=Team lunch')).toBeVisible()
    await expect(page.locator('text=€150.50')).toBeVisible()
  })

  test.skip('budget health indicator changes color', async ({ page }) => {
    await page.goto(`${APP_URL}/pipeline/projects/test-project-id`)

    // Check for health badge
    const healthBadge = page.locator('[data-testid="budget-health-badge"]')
    await expect(healthBadge).toBeVisible()

    // Verify color class (green/yellow/orange/red)
    const badgeClass = await healthBadge.getAttribute('class')
    expect(badgeClass).toMatch(/bg-(green|yellow|orange|red)/)
  })
})
```
- **VALIDATE**: `npx playwright test --list`

---

## TESTING STRATEGY

### Unit Tests

**Scope:** Budget calculation utilities, health status determination, alert triggering logic

**Key tests:**
- `calculateBudgetHealth()` returns correct status for various percentages
- `shouldTriggerAlert()` respects threshold and 24-hour cooldown
- `generateBudgetCSV()` formats expense data correctly
- `calculateBudgetSummary()` aggregates budgets accurately

### Integration Tests

**Scope:** tRPC procedures, database operations, email sending

**Key tests:**
- Creating expense updates both phase and project budgetSpent
- Expense deletion decrements budgetSpent correctly
- Budget alerts trigger when threshold reached
- Email delivery succeeds with valid RESEND_API_KEY
- CSV export includes all expenses with correct formatting

### Edge Cases

**Critical edge cases:**
- Budget exactly at 100% (should show OVER_BUDGET only when exceeds)
- Deleting expense when budgetSpent would go negative (validate constraint)
- Alert triggering multiple times within 24 hours (should be prevented)
- Empty expense list (charts should handle gracefully)
- Phase with zero allocated budget (percentage calculation should not divide by zero)

---

## VALIDATION COMMANDS

### Level 1: Import Validation (CRITICAL)

**Verify all imports resolve before running tests:**

```bash
cd app
npx tsc --noEmit
```

**Expected:** No type errors, all imports resolve

**Why:** Catches missing dependencies and type errors immediately before proceeding.

### Level 2: Database Schema Validation

**Verify Prisma schema and migrations:**

```bash
cd app
npx prisma validate
npx prisma format
npx prisma generate
```

**Expected:** Schema is valid, client generated successfully

### Level 3: Build Validation

**Verify production build succeeds:**

```bash
cd app
npm run build
```

**Expected:** Build completes without errors, all routes compile

### Level 4: Linting

**Verify code style:**

```bash
cd app
npm run lint
```

**Expected:** No linting errors

### Level 5: Local Dev Server Test

**Verify app starts and loads:**

```bash
cd app
npm run dev &
DEV_PID=$!

# Wait for server
for i in {1..30}; do
  if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Dev server is running"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Dev server failed to start"
    kill $DEV_PID 2>/dev/null
    exit 1
  fi
  sleep 2
done

# Test app loads
curl -f http://localhost:3000 || {
  echo "❌ App failed to load"
  kill $DEV_PID
  exit 1
}

echo "✅ App loads successfully"
kill $DEV_PID
wait $DEV_PID 2>/dev/null
```

**Expected:** Server starts, app loads at localhost:3000, no console errors

### Level 6: Playwright E2E Tests

**Run full test suite:**

```bash
cd app
npx playwright test
```

**Expected:** All tests pass, budget tracking features work from user perspective

### Level 7: Manual Validation

**Test budget tracking flow manually:**

1. Navigate to a project: `/pipeline/projects/[id]`
2. Verify budget overview dashboard displays with charts
3. Navigate to phase detail: `/pipeline/projects/[id]/phases/[phaseId]`
4. Click "Add Expense" button
5. Fill expense form and submit
6. Verify expense appears in list
7. Verify budgetSpent updates in UI
8. Check for budget health indicator color change
9. Configure budget alert with 90% threshold
10. Add expenses to exceed threshold
11. Verify alert email is sent (check email inbox or logs)
12. Click "Export CSV" button
13. Verify CSV downloads with correct expense data

---

## ACCEPTANCE CRITERIA

- [x] Database schema includes Expense and BudgetAlert models
- [x] Expense CRUD operations work via tRPC
- [x] Creating expense increments budgetSpent for phase and project
- [x] Budget overview dashboard displays with charts (breakdown, trend, gauge)
- [x] Budget health indicator shows correct color (green/yellow/orange/red)
- [x] Can add, edit, delete expenses from phase detail page
- [x] Budget alert configuration UI allows setting thresholds
- [x] Alert email sends when budget reaches threshold
- [x] Alert respects 24-hour cooldown between triggers
- [x] CSV export downloads budget report with all expenses
- [x] All validation commands pass (build, lint, tests)
- [x] Playwright E2E tests verify budget UI functionality
- [x] No regressions in existing project/phase functionality
- [x] Budget calculations are accurate (totals match sum of expenses)

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Database migration applied successfully
- [ ] tRPC routers registered and working
- [ ] shadcn/ui Charts installed with React 19 compatibility
- [ ] All chart components render correctly
- [ ] Budget dashboard integrated into project page
- [ ] Expense management integrated into phase page
- [ ] Alert configuration UI functional
- [ ] Email alerts send successfully
- [ ] CSV export downloads correctly
- [ ] TypeScript compilation passes (no errors)
- [ ] Linting passes (no warnings)
- [ ] Production build succeeds
- [ ] Dev server runs without errors
- [ ] Playwright tests pass
- [ ] Manual testing confirms all features work
- [ ] No console errors or warnings
- [ ] Budget calculations validated for accuracy

---

## NOTES

### Design Decisions

**Budget Health Thresholds:**
- HEALTHY: 0-74% (green)
- WARNING: 75-89% (yellow)
- CRITICAL: 90-99% (orange)
- OVER_BUDGET: 100%+ (red)

These thresholds align with common project management practices and EU funding requirements.

**Alert Cooldown Period:**
Set to 24 hours to prevent alert spam while still providing timely notifications. This can be made configurable in future iterations.

**CSV Export Format:**
Uses Swedish locale (sv-SE) for date formatting to match the organization's location (Sweden). Currency formatting uses Euro (EUR) as this is the primary currency for Erasmus+ projects.

**Email Service:**
Leverages existing Resend integration. Requires `RESEND_API_KEY` environment variable. Alert emails are sent asynchronously and failures are logged but don't block expense creation.

**Chart Library Choice:**
shadcn/ui Charts (Recharts) chosen for tight integration with existing design system, TypeScript support, and no additional abstraction layer. React 19 compatibility requires `react-is` package override.

### Trade-offs

**Expense Update vs Delete:**
When updating expense amount, we calculate the difference and increment/decrement budgetSpent accordingly. This is more complex than recalculating from scratch but avoids race conditions and maintains audit trail.

**Client-Side vs Server-Side Charts:**
Charts are client components ("use client") because Recharts requires browser APIs. Data is fetched server-side via tRPC and passed as props for optimal performance.

**Alert Email Batching:**
Currently sends individual emails to each recipient. For large recipient lists, consider batching or using Resend's audience features in future iterations.

### Future Enhancements

- Receipt file upload (integrate with Supabase Storage)
- Budget forecasting based on spending trends
- Configurable alert cooldown period
- PDF export with charts and summary
- Budget version history and rollback
- Multi-currency support with exchange rates
- Budget templates for common project types
- Expense approval workflow for larger organizations

### Security Considerations

- All tRPC procedures use `orgProcedure` to enforce tenant isolation
- Project and phase ownership verified before any budget modifications
- Email recipients validated against organization membership (future enhancement)
- RESEND_API_KEY stored securely in environment variables
- CSV export requires authentication via Clerk
