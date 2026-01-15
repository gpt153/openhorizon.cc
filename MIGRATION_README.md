# Database Schema Migration: Seed Metadata and Phase Checklist Enhancement

**Issue**: #100 (Part 4/4 of #96 - Intelligent Seed Elaboration System)
**Migration**: `20260115101004_add_seed_metadata_and_phase_checklist`
**Status**: Ready for Review and Testing

## Overview

This migration adds rich metadata capabilities to the Seed model and enhanced checklist tracking to the Phase model, enabling intelligent elaboration and auto-generation features.

## What Changed

### 1. Seed Table Enhancements

**New Columns**:
- `metadata` (JSONB) - Stores rich project metadata
- `completeness` (Integer, nullable) - Project completeness score (0-100)

**New Index**:
- GIN index on `metadata` for efficient JSONB queries

**Metadata Structure**:
```typescript
{
  participantCount: 30,
  participantCountries: ["Sweden", "Turkey", "Poland"],
  duration: 7,
  startDate: "2026-06-01",
  totalBudget: 15000,
  destination: {
    country: "Spain",
    city: "Barcelona"
  },
  requirements: {
    visas: [{ country: "Turkey", needed: true }],
    insurance: true,
    permits: ["Event permit"]
  },
  activities: [
    { name: "Video editing workshop", duration: "2 days" }
  ],
  erasmusPriorities: ["Digital", "Green"],
  completeness: 85
}
```

### 2. Phase Table Enhancements

**Modified Columns**:
- `checklist` - Explicitly set to JSONB type (was JSON)

**New Columns**:
- `auto_generated` (Boolean, default: false) - Tracks if phase was AI-generated
- `generation_context` (JSONB) - Stores generation metadata

**New Index**:
- GIN index on `checklist` for efficient JSONB queries

**Checklist Structure**:
```typescript
{
  items: [
    {
      id: "book-flights",
      text: "Book flights for 30 participants",
      completed: false,
      deadline: "2026-04-15",
      priority: "high",
      type: "task"
    },
    {
      id: "visa-turkey",
      text: "Turkish participants need Schengen visa",
      completed: false,
      deadline: "2026-04-06",
      priority: "critical",
      type: "warning"
    }
  ]
}
```

## Files Changed

### Schema Files
- ✅ `prisma/schema.prisma` - Updated Seed and Phase models
- ✅ `prisma/migrations/20260115101004_add_seed_metadata_and_phase_checklist/migration.sql` - Migration SQL

### TypeScript Types
- ✅ `src/seeds/seeds.types.ts` - Added `SeedMetadata`, `ChecklistItem`, `PhaseChecklist`, `GenerationContext`

### Scripts
- ✅ `scripts/migrate-seed-metadata.ts` - Optional data migration script

### Documentation
- ✅ `MIGRATION_README.md` - This file
- ✅ `prisma/migrations/.../ROLLBACK.md` - Rollback instructions

## Migration Steps

### Step 1: Review Changes

```bash
cd project-pipeline/backend

# Review Prisma schema changes
git diff prisma/schema.prisma

# Review TypeScript type changes
git diff src/seeds/seeds.types.ts

# Review migration SQL
cat prisma/migrations/20260115101004_add_seed_metadata_and_phase_checklist/migration.sql
```

### Step 2: Test on Development Database

⚠️ **IMPORTANT**: Always test on development database first!

```bash
# Ensure you're connected to development database
echo $DATABASE_URL

# Run migration
npx prisma migrate dev

# Verify migration status
npx prisma migrate status

# Generate Prisma client with new types
npx prisma generate
```

### Step 3: (Optional) Run Data Migration

If you have existing seeds and want to initialize their metadata:

```bash
npx tsx scripts/migrate-seed-metadata.ts
```

This script will:
- Set `metadata.completeness = 0` for all existing seeds
- Set `auto_generated = false` for all existing phases
- Populate minimal metadata from existing fields

### Step 4: Verify Database Schema

```bash
# Check that columns were added
npx prisma studio

# Or use SQL
npx prisma db execute --stdin <<SQL
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('Seed', 'Phase')
AND column_name IN ('metadata', 'completeness', 'auto_generated', 'generation_context', 'checklist');
SQL
```

### Step 5: Run Tests

```bash
npm test
```

## Integration with Other Parts

This migration is **Part 4/4** of Issue #96. It depends on and integrates with:

### Part 1: Backend API (Issue #97)
- Backend will use `SeedMetadata` to store elaborated project data
- Elaboration endpoints will populate the `metadata` field

### Part 2: Frontend UI (Issue #98)
- Frontend will render metadata in a structured form
- Completeness bar will display `completeness` value

### Part 3: Phase Generator (Issue #99)
- Generator will create phases with `auto_generated = true`
- Generator will populate `generation_context` with AI model info
- Generator will create `checklist.items` from seed metadata

## Testing Checklist

Before deploying to production:

- [ ] Migration runs successfully on development database
- [ ] Prisma client regenerates without errors
- [ ] Existing seeds can be queried without errors
- [ ] Existing phases can be queried without errors
- [ ] New seeds can be created with metadata
- [ ] Metadata queries work efficiently (GIN indexes used)
- [ ] Checklist queries work efficiently (GIN indexes used)
- [ ] TypeScript types compile without errors
- [ ] All existing tests pass
- [ ] (Optional) Data migration script runs successfully
- [ ] Rollback procedure tested on development database

## Example Usage

### Creating a Seed with Metadata

```typescript
import { SeedMetadata } from './seeds/seeds.types'

const metadata: SeedMetadata = {
  participantCount: 30,
  participantCountries: ['Sweden', 'Turkey'],
  duration: 7,
  destination: {
    country: 'Spain',
    city: 'Barcelona'
  },
  completeness: 85
}

const seed = await prisma.seed.create({
  data: {
    user_id: userId,
    title: 'Youth Exchange in Barcelona',
    description: '...',
    metadata: metadata,
    completeness: 85
  }
})
```

### Querying Seeds by Metadata

```typescript
// Find seeds for Spain
const spanishSeeds = await prisma.seed.findMany({
  where: {
    metadata: {
      path: ['destination', 'country'],
      equals: 'Spain'
    }
  }
})

// Find seeds with >80% completeness
const completeSeeds = await prisma.seed.findMany({
  where: {
    completeness: {
      gte: 80
    }
  }
})
```

### Creating an Auto-Generated Phase

```typescript
import { GenerationContext, PhaseChecklist } from './seeds/seeds.types'

const checklist: PhaseChecklist = {
  items: [
    {
      id: 'book-flights',
      text: 'Book flights for 30 participants',
      completed: false,
      deadline: '2026-04-15',
      priority: 'high',
      type: 'task'
    }
  ]
}

const context: GenerationContext = {
  generatedBy: 'ai',
  generatedAt: new Date(),
  sourceType: 'seed',
  sourceId: seedId,
  aiModel: 'gpt-4',
  prompt: 'Generate travel phase'
}

const phase = await prisma.phase.create({
  data: {
    // ... standard phase fields
    checklist: checklist,
    auto_generated: true,
    generation_context: context
  }
})
```

## Rollback

See: `prisma/migrations/20260115101004_add_seed_metadata_and_phase_checklist/ROLLBACK.md`

**Summary**:
- Drop new columns and indexes
- Revert `checklist` from JSONB to JSON
- Update Prisma schema
- Regenerate client

## Performance Considerations

### GIN Indexes

This migration adds GIN (Generalized Inverted Index) indexes for JSONB columns:

- **Pros**: Fast queries on nested JSON data
- **Cons**: Slightly slower writes, larger index size
- **Use case**: Efficient for queries like "find all seeds where destination.country = 'Spain'"

### JSONB vs JSON

Changed `checklist` from JSON to JSONB:

- **JSONB**: Binary format, faster queries, supports indexing
- **JSON**: Text format, faster writes, no indexing
- **Impact**: Minimal - checklist queries will be faster

## Known Issues

None at this time.

## Support

For questions or issues:
1. Check rollback documentation
2. Review migration SQL
3. Test on development database
4. Create GitHub issue if problems persist

## Production Deployment

**Before deploying to production**:

1. ✅ All tests pass on staging environment
2. ✅ Data migration tested (if needed)
3. ✅ Rollback procedure documented and tested
4. ✅ Database backup created
5. ✅ Downtime window scheduled (if needed)
6. ✅ Team notified

**Deployment commands**:

```bash
# On production server
cd project-pipeline/backend

# Backup database (CRITICAL!)
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_before_migration.sql

# Run migration
npx prisma migrate deploy

# Verify
npx prisma migrate status

# Regenerate client
npx prisma generate

# Restart backend service
pm2 restart backend  # or your deployment method
```

## Success Criteria

Migration is successful when:

- ✅ Migration runs without errors
- ✅ Metadata JSONB column accepts rich data
- ✅ Checklist JSONB column stores task lists
- ✅ Indexes created for performance
- ✅ Prisma client updated with new types
- ✅ TypeScript types match schema
- ✅ No data loss on existing seeds/phases
- ✅ All tests pass
- ✅ Backend service runs without errors

---

**Migration prepared by**: SCAR (Sam's Coding Agent Remote)
**Date**: 2026-01-15
**Review Status**: Pending
