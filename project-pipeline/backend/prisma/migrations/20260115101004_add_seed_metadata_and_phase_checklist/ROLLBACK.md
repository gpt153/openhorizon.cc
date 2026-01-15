# Rollback Instructions

## Migration: add_seed_metadata_and_phase_checklist

**WARNING**: Only perform rollback if absolutely necessary. Test thoroughly on development environment first.

## Rollback SQL

Execute the following SQL to rollback this migration:

```sql
-- Drop indexes
DROP INDEX IF EXISTS "idx_phase_checklist";
DROP INDEX IF EXISTS "idx_seed_metadata";

-- Drop Phase table columns
ALTER TABLE "Phase" DROP COLUMN IF EXISTS "generation_context";
ALTER TABLE "Phase" DROP COLUMN IF EXISTS "auto_generated";
-- Revert checklist to plain JSON (from JSONB)
ALTER TABLE "Phase" ALTER COLUMN "checklist" SET DATA TYPE JSON USING "checklist"::json;

-- Drop Seed table columns
ALTER TABLE "Seed" DROP COLUMN IF EXISTS "completeness";
ALTER TABLE "Seed" DROP COLUMN IF EXISTS "metadata";
```

## Steps to Rollback

### 1. Create Rollback Migration

```bash
cd project-pipeline/backend
npx prisma migrate create rollback_seed_metadata_and_phase_checklist
```

### 2. Edit the Generated Migration File

Replace the contents with the rollback SQL above.

### 3. Apply Rollback Migration

```bash
npx prisma migrate dev
```

### 4. Regenerate Prisma Client

```bash
npx prisma generate
```

### 5. Verify Database State

```bash
npx prisma migrate status
```

## Data Loss Warning

⚠️ **Data Loss**: Rolling back will permanently delete:
- All `metadata` JSON data in Seed records
- All `completeness` values in Seed records
- All `auto_generated` flags in Phase records
- All `generation_context` JSON data in Phase records

**Checklist data will NOT be lost** - only the column type changes from JSONB back to JSON.

## Alternative: Soft Rollback

If you want to preserve data but disable the feature:

1. DO NOT drop the columns
2. Update application code to ignore these fields
3. Create a backup of the data first:

```sql
-- Backup metadata
CREATE TABLE seed_metadata_backup AS
SELECT id, metadata, completeness FROM "Seed" WHERE metadata IS NOT NULL;

-- Backup phase generation context
CREATE TABLE phase_generation_backup AS
SELECT id, auto_generated, generation_context FROM "Phase" WHERE generation_context IS NOT NULL;
```

## Schema Revert

Don't forget to revert `prisma/schema.prisma`:

### Seed Model - Remove these lines:
```prisma
// Rich metadata for intelligent elaboration (Issue #96)
metadata     Json? @db.JsonB
completeness Int?
...
@@index([metadata], type: Gin)
```

### Phase Model - Remove these lines:
```prisma
// Auto-generation tracking (Issue #96)
auto_generated     Boolean @default(false)
generation_context Json?   @db.JsonB
...
@@index([checklist], type: Gin)
```

And change:
```prisma
checklist        Json?       @db.JsonB
```

Back to:
```prisma
checklist        Json?
```

## Testing After Rollback

1. Test seed creation and elaboration
2. Test phase creation and updates
3. Ensure no TypeScript errors from removed types
4. Run full test suite: `npm test`

## Support

If you encounter issues during rollback, contact the development team or create a GitHub issue.
