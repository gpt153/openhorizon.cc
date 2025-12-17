-- Seed dummy organization for development/testing with auth disabled
-- Run this against the production database to enable the app to work

-- Insert dummy organization (idempotent - only inserts if not exists)
INSERT INTO organizations (id, name, slug, "subscriptionTier", created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Development Organization',
    'dev-org',
    'FREE',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the organization exists
SELECT id, name, slug, "subscriptionTier" FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
