# Supabase Database Setup SQL

Run this SQL in your Supabase SQL Editor to create all database tables for the Open Horizon Project Companion.

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BASIC', 'PRO');
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF', 'PARTNER', 'PARTICIPANT', 'GUARDIAN');
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'CONCEPT', 'PLANNING', 'APPLICATION_DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "GenerationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- Create organizations table
CREATE TABLE "organizations" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_organization_memberships table
CREATE TABLE "user_organization_memberships" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_organization_memberships_organization_id_fkey"
        FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
    CONSTRAINT "user_organization_memberships_user_id_organization_id_key"
        UNIQUE ("user_id", "organization_id")
);

CREATE INDEX "user_organization_memberships_user_id_idx" ON "user_organization_memberships"("user_id");
CREATE INDEX "user_organization_memberships_organization_id_idx" ON "user_organization_memberships"("organization_id");

-- Create projects table
CREATE TABLE "projects" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "project_dna" JSONB NOT NULL,
    "objectives" JSONB,
    "target_group_description" TEXT,
    "activity_outline" JSONB,
    "learning_outcomes" JSONB,
    "inclusion_plan_overview" TEXT,
    "partner_profile" TEXT,
    "estimated_budget_range" JSONB,
    "sustainability_narrative" TEXT,
    "impact_narrative" TEXT,
    "erasmus_action" TEXT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "participant_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_tenant_id_fkey"
        FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE INDEX "projects_tenant_id_status_idx" ON "projects"("tenant_id", "status");
CREATE INDEX "projects_tenant_id_created_by_user_id_idx" ON "projects"("tenant_id", "created_by_user_id");

-- Create project_generation_sessions table
CREATE TABLE "project_generation_sessions" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "tenant_id" UUID NOT NULL,
    "project_id" UUID,
    "user_id" TEXT NOT NULL,
    "session_data" JSONB NOT NULL,
    "ai_model" TEXT NOT NULL,
    "generation_status" "GenerationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_generation_sessions_tenant_id_fkey"
        FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
    CONSTRAINT "project_generation_sessions_project_id_fkey"
        FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL
);

CREATE INDEX "project_generation_sessions_tenant_id_user_id_idx" ON "project_generation_sessions"("tenant_id", "user_id");
CREATE INDEX "project_generation_sessions_project_id_idx" ON "project_generation_sessions"("project_id");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON "organizations"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON "projects"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_generation_sessions_updated_at BEFORE UPDATE ON "project_generation_sessions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## What This Creates

### Tables
1. **organizations** - Multi-tenant organizations with subscription tiers
2. **user_organization_memberships** - Links Clerk users to organizations with roles
3. **projects** - Erasmus+ youth exchange projects with AI-generated content
4. **project_generation_sessions** - Tracks AI generation sessions for auditing

### Features
- ✅ UUID primary keys for all tables
- ✅ Multi-tenant architecture with `tenant_id` in all relevant tables
- ✅ Foreign key constraints with CASCADE deletes for data integrity
- ✅ Indexes for performance optimization
- ✅ Automatic `updated_at` timestamp triggers
- ✅ JSONB fields for flexible AI-generated content storage

## After Running This SQL

Once you've executed this SQL in Supabase, run:

```bash
npx prisma generate
```

This will sync the Prisma client with your database schema and you'll be ready to start using the database in your application.
