-- CreateEnum
CREATE TYPE "SeedStatus" AS ENUM ('ACTIVE', 'SAVED', 'DISMISSED', 'CONVERTED');

-- CreateTable
CREATE TABLE "Seed" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "approval_likelihood" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "title_formal" TEXT,
    "description_formal" TEXT,
    "approval_likelihood_formal" DOUBLE PRECISION,
    "tags" TEXT[],
    "estimated_duration" INTEGER,
    "estimated_participants" INTEGER,
    "is_saved" BOOLEAN NOT NULL DEFAULT false,
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "elaboration_count" INTEGER NOT NULL DEFAULT 0,
    "current_version" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeedElaboration" (
    "id" TEXT NOT NULL,
    "seed_id" TEXT NOT NULL,
    "conversation_history" JSONB NOT NULL,
    "current_seed_state" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeedElaboration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Seed_user_id_idx" ON "Seed"("user_id");

-- CreateIndex
CREATE INDEX "Seed_is_saved_idx" ON "Seed"("is_saved");

-- CreateIndex
CREATE INDEX "Seed_created_at_idx" ON "Seed"("created_at");

-- CreateIndex
CREATE INDEX "SeedElaboration_seed_id_idx" ON "SeedElaboration"("seed_id");

-- CreateIndex
CREATE UNIQUE INDEX "SeedElaboration_seed_id_key" ON "SeedElaboration"("seed_id");

-- AddForeignKey
ALTER TABLE "Seed" ADD CONSTRAINT "Seed_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeedElaboration" ADD CONSTRAINT "SeedElaboration_seed_id_fkey" FOREIGN KEY ("seed_id") REFERENCES "Seed"("id") ON DELETE CASCADE ON UPDATE CASCADE;
