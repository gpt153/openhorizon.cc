-- Add SendGrid tracking fields to Communication table
-- Migration: add_sendgrid_tracking
-- Date: 2025-01-12

ALTER TABLE "communications"
ADD COLUMN IF NOT EXISTS "sendgrid_message_id" TEXT,
ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "opened_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "open_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "click_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "bounced_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "bounce_reason" TEXT,
ADD COLUMN IF NOT EXISTS "tracking_metadata" JSONB;

-- Add index on sendgrid_message_id for webhook lookups
CREATE INDEX IF NOT EXISTS "communications_sendgrid_message_id_idx"
ON "communications"("sendgrid_message_id");

-- Add new status values to CommunicationStatus enum
DO $$ BEGIN
  ALTER TYPE "CommunicationStatus" ADD VALUE IF NOT EXISTS 'OPENED';
  ALTER TYPE "CommunicationStatus" ADD VALUE IF NOT EXISTS 'BOUNCED';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'communications'
  AND column_name IN (
    'sendgrid_message_id',
    'delivered_at',
    'opened_at',
    'open_count',
    'click_count',
    'bounced_at',
    'bounce_reason',
    'tracking_metadata'
  );
