# Archive Plan: OLD Project Planner
**Date:** 2026-01-14 (Stockholm time)
**Related:** SYSTEM-ARCHITECTURE-ANALYSIS-2026-01-14.md

---

## Goal

Safely archive the OLD Project Planner (`/projects`) to prevent confusion and maintain code clarity going forward.

---

## What to Archive

### Routes
```
app/src/app/(dashboard)/projects/
├── page.tsx                     # List view
├── new/page.tsx                 # Creation wizard
├── [id]/page.tsx                # Project detail
└── [id]/programme/page.tsx      # Programme builder
```

### Backend
```
app/src/server/routers/projects.ts     # tRPC routes
```

### Components
```
app/src/components/project/            # OLD project components (if exists)
```

### Database Models (KEEP but document as legacy)
```
schema.prisma:
- Project model (lines 78-124)
- Programme model (lines 173-195)
- ProgrammeDay model (lines 203-230)
- ProgrammeSession model (lines 232-271)
```

---

## Archival Strategy

### Option A: Move to Archive Directory (RECOMMENDED)

**Pros:**
- Code remains in git history
- Can be restored if needed
- Clear separation
- Doesn't break existing data

**Cons:**
- Takes up space in repo
- Still technically accessible

**Implementation:**
```bash
mkdir -p app/src/app/(dashboard)/archived
mv app/src/app/(dashboard)/projects app/src/app/(dashboard)/archived/projects-legacy

mkdir -p app/src/server/routers/archived
mv app/src/server/routers/projects.ts app/src/server/routers/archived/projects-legacy.ts
```

### Option B: Keep as Read-Only (ALTERNATIVE)

**Pros:**
- Existing OLD projects remain accessible
- Users can export data before deletion
- Gradual migration

**Cons:**
- Code clutter remains
- Maintenance burden
- Can still confuse LLMs

**Implementation:**
1. Add deprecation banner to all pages
2. Disable create/edit functions
3. Show "Export to Pipeline" button
4. Schedule deletion date

### Option C: Complete Removal (NOT RECOMMENDED)

**Pros:**
- Clean codebase
- No confusion

**Cons:**
- Lose existing OLD projects
- No rollback path
- Risky

---

## Recommended Approach: Option A (Move to Archive)

### Step 1: Create Archive Structure

```bash
# Create archive directories
mkdir -p app/src/app/\(dashboard\)/archived
mkdir -p app/src/server/routers/archived
mkdir -p app/src/components/archived
mkdir -p docs/archived
```

### Step 2: Move Files

**Routes:**
```bash
git mv app/src/app/\(dashboard\)/projects \
        app/src/app/\(dashboard\)/archived/projects-legacy
```

**Backend:**
```bash
git mv app/src/server/routers/projects.ts \
        app/src/server/routers/archived/projects-legacy.ts
```

**Components** (if exists):
```bash
if [ -d "app/src/components/project" ]; then
  git mv app/src/components/project \
          app/src/components/archived/project-legacy
fi
```

### Step 3: Add Archive README

**File:** `app/src/app/(dashboard)/archived/README.md`

```markdown
# Archived Code

This directory contains deprecated code that has been replaced by newer systems.

## Projects Legacy (`projects-legacy/`)

**Deprecated:** 2026-01-14
**Replaced by:** `/pipeline/projects`
**Reason:** Complete rewrite with focus on logistics, budget tracking, and AI agents

**Database models still exist:**
- `Project` - Use for read-only access to old projects
- `Programme` - Programme builder (no longer used)

**DO NOT:**
- Add new features to this code
- Reference in new components
- Use as example for new development

**DO:**
- Keep for data export
- Maintain read-only access for users with old projects
- Remove completely after data migration (target: 2026-02-14)

**Last working version:** Commit eeb45a0 (2026-01-14)
```

### Step 4: Update Imports

**Search for imports:**
```bash
grep -r "from.*server/routers/projects" app/src
```

**Update to:**
```typescript
// OLD (remove these)
import { projectRouter } from '@/server/routers/projects'

// NEW (if read-only access needed)
import { projectLegacyRouter } from '@/server/routers/archived/projects-legacy'
```

### Step 5: Update tRPC Router

**File:** `app/src/server/routers/_app.ts` (or similar)

```typescript
// OLD (remove)
export const appRouter = router({
  projects: projectRouter,  // REMOVE THIS
  pipeline: pipelineRouter,
  brainstorm: brainstormRouter,
})

// NEW
export const appRouter = router({
  // projects: projectRouter,  // ARCHIVED 2026-01-14
  pipeline: pipelineRouter,
  brainstorm: brainstormRouter,
})

// OR if keeping read-only:
export const appRouter = router({
  projectsLegacy: projectLegacyRouter,  // Read-only, will be removed 2026-02-14
  pipeline: pipelineRouter,
  brainstorm: brainstormRouter,
})
```

### Step 6: Update Navigation

**File:** Navigation component

```tsx
// OLD (remove)
<NavLink href="/projects" icon={<FolderIcon />}>
  Projects
</NavLink>

// NEW (completely removed from nav)
// ... removed ...

// OR if keeping legacy access:
<details className="nav-legacy-section">
  <summary>Legacy (Archived)</summary>
  <NavLink href="/archived/projects-legacy" icon={<ArchiveIcon />}>
    Projects (Old)
    <Badge variant="warning" size="sm">Archived</Badge>
  </NavLink>
</details>
```

### Step 7: Update Documentation

#### CLAUDE.md

**Add section:**
```markdown
## Archived Systems

### OLD Project Planner (Deprecated 2026-01-14)

**Location:** `/archived/projects-legacy`
**Status:** Archived, read-only
**Replaced by:** Pipeline System (`/pipeline/projects`)

**DO NOT use this system for new development.**

The OLD Project Planner was focused on Erasmus+ application writing (objectives, learning outcomes, programme builder). It has been replaced by the Pipeline System which focuses on logistics, budget tracking, vendor management, and AI agents.

**If you see references to the OLD system:**
- They are outdated
- Update to use Pipeline instead
- Move documentation to archived/
```

#### Create Archive Documentation

**File:** `docs/archived/OLD-PROJECT-PLANNER-REFERENCE.md`

```markdown
# OLD Project Planner Reference (ARCHIVED)

**Archived:** 2026-01-14
**Last working commit:** eeb45a0

## What This System Did

The OLD Project Planner was an Erasmus+ application writing tool that focused on:
- Generating application-ready text
- Programme builder (daily schedules)
- Formal/Informal mode switching
- Learning outcomes and objectives

## Why It Was Archived

1. **Focus mismatch:** Application writing vs. logistics management
2. **Code duplication:** Two complete project systems
3. **User confusion:** Seeds connected to wrong system
4. **Active development:** Pipeline system has all new features

## Database Models (Still Exist)

### Project
```prisma
model Project {
  id              String
  title           String
  projectDna      Json
  objectives      Json?
  programmes      Programme[]
}
```

Used for old projects. Do not create new ones.

### Programme
```prisma
model Programme {
  id        String
  projectId String
  days      ProgrammeDay[]
}
```

Programme builder. No longer used in Pipeline.

## How to Access Old Data

```typescript
// Read-only access to old projects
const oldProjects = await prisma.project.findMany({
  where: { tenantId: orgId },
  include: { programmes: true }
})
```

## Migration to Pipeline

See: `docs/SEEDS-TO-PIPELINE-MIGRATION.md`

**Manual migration needed for:**
- Existing OLD projects (export data, recreate in Pipeline)
- Programme data (no direct equivalent in Pipeline)
```

### Step 8: Git Commit

```bash
git add -A
git commit -m "chore: Archive OLD Project Planner (deprecated 2026-01-14)

The OLD Project Planner (/projects) has been moved to /archived/projects-legacy.
This system is replaced by the Pipeline System (/pipeline/projects).

Changes:
- Move /projects routes to /archived/projects-legacy
- Move projects.ts router to archived/projects-legacy.ts
- Remove from navigation
- Update documentation

Database models (Project, Programme) remain for read-only access to old data.

Related: SYSTEM-ARCHITECTURE-ANALYSIS-2026-01-14.md
Closes: #TBD (create archival issue)"
```

---

## Rollback Plan

If archival causes issues:

```bash
# Restore from git
git revert <commit-hash>

# Or manually restore
git mv app/src/app/\(dashboard\)/archived/projects-legacy \
        app/src/app/\(dashboard\)/projects
```

---

## Data Migration (Optional)

### If User Wants to Migrate Existing OLD Projects

**Script:** `scripts/migrate-old-projects-to-pipeline.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateOldProjectsToPipeline() {
  // 1. Get all OLD projects
  const oldProjects = await prisma.project.findMany({
    include: { programmes: true }
  })

  console.log(`Found ${oldProjects.length} old projects to migrate`)

  // 2. For each old project
  for (const oldProject of oldProjects) {
    console.log(`Migrating: ${oldProject.title}`)

    // 3. Create new Pipeline project
    const pipelineProject = await prisma.pipelineProject.create({
      data: {
        tenantId: oldProject.tenantId,
        createdByUserId: oldProject.createdByUserId,
        name: oldProject.title,
        description: oldProject.tagline || '',
        type: 'CUSTOM',
        status: 'PLANNING',
        startDate: new Date(), // TODO: Extract from programme if available
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        budgetTotal: 50000, // Default
        budgetSpent: 0,
        participantCount: oldProject.participantCount,
        location: 'TBD', // No location in old projects
        metadata: {
          migratedFrom: 'old-project',
          oldProjectId: oldProject.id,
          migratedAt: new Date().toISOString()
        }
      }
    })

    // 4. Create default phases (same as seed conversion)
    await prisma.pipelinePhase.createMany({
      data: [/* ... default phases ... */]
    })

    // 5. Mark old project as migrated
    await prisma.project.update({
      where: { id: oldProject.id },
      data: {
        metadata: {
          migratedToPipeline: true,
          pipelineProjectId: pipelineProject.id,
          migratedAt: new Date().toISOString()
        }
      }
    })

    console.log(`✅ Migrated: ${oldProject.title} → ${pipelineProject.id}`)
  }

  console.log(`\nMigration complete: ${oldProjects.length} projects migrated`)
}

migrateOldProjectsToPipeline()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Run with:**
```bash
tsx scripts/migrate-old-projects-to-pipeline.ts
```

---

## Timeline

### Immediate (Jan 14)
- Move routes to archived/
- Update navigation
- Add deprecation notices
- Update documentation

### Week 1 (Jan 14-21)
- Monitor for issues
- User feedback
- Fix any broken links

### Week 2 (Jan 21-28)
- Data migration (if needed)
- Export functionality for users
- Announce archival date

### Week 4 (Feb 11)
- Make read-only (disable create/edit)
- Show "System Archived" banner

### Week 8 (March 11)
- Complete removal (optional)
- OR keep as read-only indefinitely

---

## Checklist

### Pre-Archive
- [ ] User confirmation of archival approach
- [ ] Backup production database
- [ ] Count existing OLD projects in database
- [ ] Create GitHub issue for archival
- [ ] Create archival branch

### Archive Execution
- [ ] Create archive directories
- [ ] Move route files
- [ ] Move backend files
- [ ] Update imports
- [ ] Update tRPC router
- [ ] Remove from navigation
- [ ] Add deprecation notices
- [ ] Update CLAUDE.md
- [ ] Create archive documentation
- [ ] Test that archived routes still work (if keeping read-only)
- [ ] Test that new Pipeline flow works
- [ ] Git commit with clear message

### Post-Archive
- [ ] Deploy to dev (oh.153.se)
- [ ] Test thoroughly
- [ ] Deploy to production (app.openhorizon.cc)
- [ ] Monitor logs for errors
- [ ] Announce to users
- [ ] Create migration guide for users with old projects

---

## Success Criteria

- ✅ OLD Project routes moved to archived/
- ✅ No references to OLD system in main codebase
- ✅ Navigation updated
- ✅ Documentation updated
- ✅ No errors in production
- ✅ User can still access old data (if read-only approach)
- ✅ Clear path forward (Pipeline only)

---

**Plan created by:** Claude Code SCAR Bot
**Stockholm time:** 2026-01-14
**Estimated effort:** 2-3 hours
