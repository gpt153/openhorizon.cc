-- Add metadata and completeness fields to Seed model
-- Migration for Issue #174: Frontend UI Verification & Completion

-- Add completeness field (0-100 percentage)
ALTER TABLE "seeds"
ADD COLUMN "completeness" INTEGER NOT NULL DEFAULT 0;

-- Add metadata field (Rich seed metadata from PRD)
ALTER TABLE "seeds"
ADD COLUMN "metadata" JSONB;

-- Add comment for documentation
COMMENT ON COLUMN "seeds"."completeness" IS 'Elaboration completeness percentage (0-100)';
COMMENT ON COLUMN "seeds"."metadata" IS 'Rich seed metadata including participants, budget, duration, etc. (PRD Section 1.2)';
