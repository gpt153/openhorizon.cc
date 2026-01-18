-- CreateEnum
CREATE TYPE "SearchJobType" AS ENUM ('FOOD', 'ACCOMMODATION', 'TRAVEL');

-- CreateEnum
CREATE TYPE "SearchJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "search_jobs" (
    "id" TEXT NOT NULL,
    "type" "SearchJobType" NOT NULL,
    "status" "SearchJobStatus" NOT NULL DEFAULT 'PENDING',
    "organization_id" UUID NOT NULL,
    "project_id" TEXT NOT NULL,
    "search_params" JSONB NOT NULL,
    "results" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_jobs_organization_id_status_idx" ON "search_jobs"("organization_id", "status");

-- CreateIndex
CREATE INDEX "search_jobs_id_organization_id_idx" ON "search_jobs"("id", "organization_id");
