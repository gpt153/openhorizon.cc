-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('KA1', 'KA2', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'FINALIZED');

-- CreateTable
CREATE TABLE "ApplicationForm" (
    "id" TEXT NOT NULL,
    "phase_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "form_type" "FormType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "form_data" JSONB NOT NULL,
    "generated_narratives" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "finalized_at" TIMESTAMP(3),

    CONSTRAINT "ApplicationForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationForm_phase_id_idx" ON "ApplicationForm"("phase_id");

-- CreateIndex
CREATE INDEX "ApplicationForm_project_id_idx" ON "ApplicationForm"("project_id");

-- CreateIndex
CREATE INDEX "ApplicationForm_status_idx" ON "ApplicationForm"("status");

-- CreateIndex
CREATE INDEX "ApplicationForm_created_by_idx" ON "ApplicationForm"("created_by");

-- AddForeignKey
ALTER TABLE "ApplicationForm" ADD CONSTRAINT "ApplicationForm_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationForm" ADD CONSTRAINT "ApplicationForm_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
