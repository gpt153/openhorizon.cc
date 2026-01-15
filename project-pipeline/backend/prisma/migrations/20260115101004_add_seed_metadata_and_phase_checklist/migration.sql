-- Migration: Add Seed Metadata and Phase Checklist Enhancement
-- Issue: #100 (Part of #96 - Intelligent Seed Elaboration System)
-- Description: Add rich metadata to Seed table and enhanced checklist to Phase table

-- 1. Seed Table Enhancements
-- Add metadata JSONB column to store rich project data
ALTER TABLE "Seed" ADD COLUMN "metadata" JSONB;

-- Add completeness column (nullable integer)
ALTER TABLE "Seed" ADD COLUMN "completeness" INTEGER;

-- Add GIN index for metadata queries (for better JSONB query performance)
CREATE INDEX "idx_seed_metadata" ON "Seed" USING GIN ("metadata");

-- 2. Phase Table Enhancements
-- Alter existing checklist column to explicitly use JSONB type
ALTER TABLE "Phase" ALTER COLUMN "checklist" SET DATA TYPE JSONB USING "checklist"::jsonb;

-- Add auto_generated flag to track AI-generated phases
ALTER TABLE "Phase" ADD COLUMN "auto_generated" BOOLEAN NOT NULL DEFAULT false;

-- Add generation_context JSONB column to store context about how phase was generated
ALTER TABLE "Phase" ADD COLUMN "generation_context" JSONB;

-- Add GIN index for checklist queries
CREATE INDEX "idx_phase_checklist" ON "Phase" USING GIN ("checklist");

-- Note: No data migration needed as these are all new nullable fields or have defaults
-- Existing seeds will have NULL metadata and completeness
-- Existing phases will have auto_generated=false and NULL generation_context
