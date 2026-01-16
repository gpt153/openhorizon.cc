# Implementation Plan: Seed → Pipeline Integration
**Date:** 2026-01-14 (Stockholm time)
**Related:** SYSTEM-ARCHITECTURE-ANALYSIS-2026-01-14.md

---

## Goal

Integrate the Seeds system with the Pipeline system so that "Turn into Project" creates a PipelineProject instead of navigating to the OLD Project wizard.

---

## Prerequisites

- Research report completed ✅
- User confirmation of approach
- OLD `/projects` system can be archived
- No active projects need migration (or migration plan ready)

---

## Implementation Steps

### Phase 1: Create Backend Integration (3-4 hours)

#### 1.1 Create Seed → Pipeline Conversion Function

**File:** `app/src/server/routers/pipeline/projects.ts`
**Add new tRPC route:**

```typescript
createFromSeed: orgProcedure
  .input(z.object({
    seedId: z.string().uuid(),
    // Optional overrides
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    location: z.string().optional(),
    budgetTotal: z.number().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // 1. Fetch seed from database
    const seed = await ctx.prisma.seed.findFirst({
      where: {
        id: input.seedId,
        tenantId: ctx.orgId,
      }
    })

    if (!seed) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Seed not found'
      })
    }

    // 2. Extract data from seed
    const seedVersion = seed.currentVersion as any || seed
    const title = seedVersion.title || seed.title
    const description = seedVersion.description || seed.description

    // 3. Calculate defaults
    const startDate = input.startDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    const endDate = input.endDate || new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days duration
    const budgetTotal = input.budgetTotal || 50000 // Default €50k
    const participantCount = 30 // Default
    const location = input.location || 'TBD'

    // 4. Create pipeline project
    const project = await ctx.prisma.pipelineProject.create({
      data: {
        tenantId: ctx.orgId,
        createdByUserId: ctx.userId,
        name: title,
        description: description,
        type: 'CUSTOM',
        status: 'PLANNING',
        startDate,
        endDate,
        budgetTotal,
        budgetSpent: 0,
        participantCount,
        location,
        originCountry: 'Sweden', // TODO: Get from user profile
        hostCountry: null,
        metadata: {
          sourceType: 'seed',
          sourceSeedId: seed.id,
          createdVia: 'seed-conversion'
        }
      }
    })

    // 5. Generate default phases
    const daysTotal = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const phaseBudget = budgetTotal / 4 // Split budget across 4 phases

    await ctx.prisma.pipelinePhase.createMany({
      data: [
        {
          projectId: project.id,
          name: 'Travel Arrangements',
          type: 'TRAVEL',
          status: 'NOT_STARTED',
          startDate: new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000), // 2 weeks before
          endDate: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week before
          budgetAllocated: phaseBudget,
          budgetSpent: 0,
          order: 1,
        },
        {
          projectId: project.id,
          name: 'Accommodation Booking',
          type: 'ACCOMMODATION',
          status: 'NOT_STARTED',
          startDate: new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before
          endDate: new Date(startDate.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days before
          budgetAllocated: phaseBudget * 1.5, // Accommodation gets more budget
          budgetSpent: 0,
          order: 2,
        },
        {
          projectId: project.id,
          name: 'Food & Catering',
          type: 'FOOD',
          status: 'NOT_STARTED',
          startDate: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week before
          endDate: startDate,
          budgetAllocated: phaseBudget * 0.8,
          budgetSpent: 0,
          order: 3,
        },
        {
          projectId: project.id,
          name: 'Activities Planning',
          type: 'ACTIVITIES',
          status: 'NOT_STARTED',
          startDate,
          endDate,
          budgetAllocated: phaseBudget * 0.7,
          budgetSpent: 0,
          order: 4,
        }
      ]
    })

    // 6. Mark seed as "converted"
    await ctx.prisma.seed.update({
      where: { id: seed.id },
      data: {
        metadata: {
          convertedToPipeline: true,
          pipelineProjectId: project.id,
          convertedAt: new Date().toISOString()
        }
      }
    })

    return {
      success: true,
      projectId: project.id,
      project
    }
  })
```

**Estimated time:** 2 hours

#### 1.2 Add Database Field for Metadata

**File:** `app/prisma/schema.prisma`
**Update Seed model (line 351):**

```prisma
model Seed {
  // ... existing fields ...

  // Add metadata field (if doesn't exist)
  metadata Json? // Store conversion info

  // ... rest of model ...
}
```

**Run migration:**
```bash
npx prisma migrate dev --name add_seed_metadata
```

**Estimated time:** 30 minutes

### Phase 2: Update Frontend (2 hours)

#### 2.1 Update Seed Detail Page

**File:** `app/src/app/(dashboard)/seeds/[id]/page.tsx`
**Replace lines 85-88:**

```tsx
// OLD:
<Button onClick={() => router.push('/projects/new')} variant="default">
  <ArrowRight className="mr-2 h-5 w-5" />
  Turn into Project
</Button>

// NEW:
<Button
  onClick={handleConvertToPipeline}
  disabled={convertMutation.isPending}
  variant="default"
>
  {convertMutation.isPending ? (
    <>
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Creating Project...
    </>
  ) : (
    <>
      <ArrowRight className="mr-2 h-5 w-5" />
      Turn into Pipeline Project
    </>
  )}
</Button>
```

**Add mutation and handler:**

```typescript
const convertMutation = trpc.pipeline.projects.createFromSeed.useMutation({
  onSuccess: (data) => {
    toast.success('Project created successfully!')
    router.push(`/pipeline/projects/${data.projectId}`)
  },
  onError: (error) => {
    toast.error(`Failed to create project: ${error.message}`)
  }
})

const handleConvertToPipeline = async () => {
  try {
    await convertMutation.mutateAsync({
      seedId: seed.id
    })
  } catch (error) {
    console.error('Conversion failed:', error)
  }
}
```

**Estimated time:** 1 hour

#### 2.2 Add Conversion Dialog (Optional Enhancement)

**Create:** `app/src/components/seeds/ConvertToPipelineDialog.tsx`

```tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function ConvertToPipelineDialog({
  open,
  onOpenChange,
  seedTitle,
  onConvert
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  seedTitle: string
  onConvert: (data: { location: string; budgetTotal: number }) => void
}) {
  const [location, setLocation] = useState('Barcelona, Spain')
  const [budgetTotal, setBudgetTotal] = useState(50000)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Pipeline Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Project Name</Label>
            <Input value={seedTitle} disabled />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Barcelona, Spain"
            />
          </div>
          <div>
            <Label>Total Budget (€)</Label>
            <Input
              type="number"
              value={budgetTotal}
              onChange={(e) => setBudgetTotal(Number(e.target.value))}
            />
          </div>
          <Button
            onClick={() => onConvert({ location, budgetTotal })}
            className="w-full"
          >
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Estimated time:** 1 hour (optional)

### Phase 3: Archive OLD Project System (1-2 hours)

#### 3.1 Rename OLD Routes

```bash
# Rename directory
mv app/src/app/\(dashboard\)/projects app/src/app/\(dashboard\)/projects-legacy

# Update route references in navigation
# File: app/src/components/navigation/MainNav.tsx (or similar)
```

#### 3.2 Add Deprecation Notice

**File:** `app/src/app/(dashboard)/projects-legacy/page.tsx`
**Add banner at top:**

```tsx
<div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
  <h3 className="font-semibold text-yellow-900">⚠️ Legacy System</h3>
  <p className="mt-1 text-sm text-yellow-800">
    This project planner has been replaced by the <Link href="/pipeline/projects" className="underline">Pipeline System</Link>.
    These projects are read-only and will be archived soon.
  </p>
</div>
```

#### 3.3 Update Navigation

**File:** Navigation component (find via grep)
**Remove or update "Projects" link:**

```tsx
// OLD:
<NavLink href="/projects">Projects</NavLink>

// NEW (remove completely):
// ... removed ...

// OR mark as legacy:
<NavLink href="/projects-legacy">
  Projects (Legacy)
  <Badge variant="warning">Deprecated</Badge>
</NavLink>
```

**Estimated time:** 1-2 hours

### Phase 4: Update Documentation (1 hour)

#### 4.1 Update CLAUDE.md

**File:** `CLAUDE.md`
**Update project description:**

```markdown
## Project Overview

openhorizon.cc - Erasmus+ Project Pipeline Management System

**Main Features:**
- Seeds System: AI-powered project idea generation
- Pipeline System: Budget tracking, vendor management, logistics
- AI Agents: Automated research for Food, Accommodation, Travel
- Budget Calculator: Erasmus+ 2024-2027 unit costs
- Quote Generation: SendGrid email integration

**Project Flow:**
1. Generate Seeds (/brainstorm)
2. Elaborate & refine (/seeds/{id})
3. Convert to Pipeline Project (NEW!)
4. Manage phases with AI agents (/pipeline/projects/{id})
5. Track budget & expenses
6. Export reports (PDF/Excel/ZIP)

**Legacy System (Deprecated):**
- Old Project Builder (/projects-legacy) - Read-only, will be archived
```

#### 4.2 Create Migration Guide

**File:** `docs/SEEDS-TO-PIPELINE-MIGRATION.md`
**Content:** User guide for new flow

**Estimated time:** 1 hour

### Phase 5: Testing (2-3 hours)

#### 5.1 Manual Testing Checklist

```
[ ] Generate new seed via /brainstorm
[ ] Save seed to garden
[ ] Navigate to /seeds/{id}
[ ] Click "Turn into Pipeline Project"
[ ] Verify project created in Pipeline
[ ] Verify 4 default phases created
[ ] Verify budget allocated correctly
[ ] Test Food Agent on Food phase
[ ] Test Accommodation Agent
[ ] Test Travel Agent
[ ] Verify budget tracking works
[ ] Check seed marked as "converted" in database
```

#### 5.2 Edge Cases to Test

```
[ ] Convert same seed twice (should warn/prevent?)
[ ] Convert seed with missing data
[ ] Convert seed with very long title/description
[ ] Permission errors (wrong tenant)
[ ] Database errors (rollback transaction?)
```

#### 5.3 Automated Tests (Optional)

**File:** `app/tests/integration/seed-to-pipeline.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test('convert seed to pipeline project', async ({ page }) => {
  await page.goto('/brainstorm')
  // ... generate seed ...
  // ... save seed ...
  // ... navigate to seed detail ...

  await page.click('text=Turn into Pipeline Project')
  await page.waitForURL(/\/pipeline\/projects\//)

  await expect(page.locator('h1')).toContainText('Project created from seed')
})
```

**Estimated time:** 2-3 hours

---

## Total Estimated Time: 9-12 hours

**Breakdown:**
- Backend (3-4 hours)
- Frontend (2-3 hours)
- Archival (1-2 hours)
- Documentation (1 hour)
- Testing (2-3 hours)

---

## Rollout Strategy

### Step 1: Feature Flag (Optional)
Add feature flag to enable/disable new flow during testing.

### Step 2: Deploy to Dev (oh.153.se)
1. Implement all changes
2. Deploy to dev server
3. Test thoroughly
4. Get user feedback

### Step 3: Deploy to Production (app.openhorizon.cc)
1. Merge to main
2. Deploy via Cloud Build
3. Monitor for errors
4. Announce to users

### Step 4: Archive OLD System
1. Wait 2 weeks for feedback
2. Move OLD projects to read-only
3. Remove from navigation
4. Full archive after 1 month

---

## Risks & Mitigation

### Risk 1: Data Loss
**Mitigation:** Transaction-based creation, rollback on error

### Risk 2: Existing OLD Projects
**Mitigation:** Keep OLD system read-only, add export functionality

### Risk 3: User Confusion
**Mitigation:** Clear messaging, documentation, announcement

### Risk 4: Performance Issues
**Mitigation:** Database indexes on seed.tenantId, optimize queries

---

## Success Criteria

- ✅ "Turn into Project" creates PipelineProject
- ✅ Default phases generated automatically
- ✅ Budget allocated correctly
- ✅ AI agents work on new projects
- ✅ No errors in production logs
- ✅ User can complete full flow: Seed → Pipeline → AI agents
- ✅ OLD system archived or deprecated

---

## Questions Before Implementation

1. Should we allow converting the same seed multiple times?
2. Should we add a preview/confirmation dialog before creating project?
3. What should default location be? (TBD, user's org location, or ask?)
4. Should we migrate existing OLD projects to Pipeline format?
5. Can we delete OLD system completely or need read-only access?

---

**Plan created by:** Claude Code SCAR Bot
**Stockholm time:** 2026-01-14
**Estimated effort:** 9-12 hours (1-2 days)
