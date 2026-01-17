# Deployment Fix Instructions - Urgent

**Issue:** User registration fails with 500 error on deployed system
**Root Cause:** Invalid enum value in auth.routes.ts (Line 42)
**Severity:** CRITICAL - Blocks all user functionality
**Fix Time:** 15 minutes

---

## The Bug

**File:** `/project-pipeline/backend/src/auth/auth.routes.ts`
**Line:** 42

```typescript
// CURRENT (BROKEN):
const user = await prisma.user.create({
  data: {
    email: data.email,
    password_hash,
    name: data.name,
    role: 'USER'  // ❌ ERROR: 'USER' is not in the Role enum
  },
  ...
})
```

**Error:** Prisma throws validation error because 'USER' is not a valid Role enum value.

**Valid values:** `ADMIN`, `COORDINATOR`, `TEAM_MEMBER`, `VIEWER`

---

## Quick Fix (Option 1 - RECOMMENDED)

Change line 42 to use a valid enum value:

```typescript
// FIXED:
const user = await prisma.user.create({
  data: {
    email: data.email,
    password_hash,
    name: data.name,
    role: 'VIEWER'  // ✅ FIXED: VIEWER is valid and appropriate for new users
  },
  ...
})
```

**Steps:**
```bash
# 1. Edit the file
vim project-pipeline/backend/src/auth/auth.routes.ts
# Change line 42: role: 'USER' → role: 'VIEWER'

# 2. Commit and push
git add project-pipeline/backend/src/auth/auth.routes.ts
git commit -m "fix: use valid VIEWER role instead of invalid USER role in registration"
git push origin main

# 3. Trigger Cloud Build (automatic on push to main)
# Or manually:
gcloud builds submit --config=cloudbuild-pipeline.yaml

# 4. Wait 2-3 minutes for deployment
# 5. Test registration again
```

---

## Alternative Fix (Option 2)

Add 'USER' to the Role enum, then migrate:

```prisma
// prisma/schema.prisma - Add USER to Role enum
enum Role {
  ADMIN
  COORDINATOR
  TEAM_MEMBER
  VIEWER
  USER  // ADD THIS LINE
}
```

**Steps:**
```bash
# 1. Edit schema
vim project-pipeline/backend/prisma/schema.prisma
# Add USER to Role enum

# 2. Create migration
cd project-pipeline/backend
npx prisma migrate dev --name add_user_role

# 3. Commit all changes (schema + migration)
git add prisma/
git commit -m "feat: add USER role to schema"
git push origin main

# 4. After deployment, run migration on production
export DATABASE_URL="postgresql://postgres.jnwlzawkfqcxdtkhwokd:Lurk7.Passivism.Serving@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?schema=pipeline"
npx prisma migrate deploy

# 5. Test registration
```

**Note:** Option 1 is faster and requires no database migration.

---

## After Fix - Update API Keys

Once registration works, update environment variables:

```bash
# Get current API keys from secrets
ANTHROPIC_KEY=$(cat ~/.archon/.secrets/global.env | grep ANTHROPIC_API_KEY | cut -d= -f2)
OPENAI_KEY=$(cat ~/.archon/.secrets/global.env | grep OPENAI_API_KEY | cut -d= -f2)

# Update Cloud Run service
gcloud run services update openhorizon-pipeline \
  --region=europe-west1 \
  --update-env-vars ANTHROPIC_API_KEY=$ANTHROPIC_KEY \
  --update-env-vars OPENAI_API_KEY=$OPENAI_KEY
```

Or via Cloud Console:
1. Go to Cloud Run service "openhorizon-pipeline"
2. Click "Edit & Deploy New Revision"
3. Expand "Variables & Secrets"
4. Update environment variables:
   - `ANTHROPIC_API_KEY` = `sk-ant-api03-...`
   - `OPENAI_API_KEY` = `sk-proj-...`
5. Click "Deploy"

---

## Verification Steps

After fix is deployed:

```bash
# Test registration
curl -X POST https://openhorizon-pipeline-l626gw63na-ew.a.run.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'

# Expected: 201 Created with user object and JWT token
# {
#   "user": {
#     "id": "...",
#     "email": "test@example.com",
#     "name": "Test User",
#     "role": "VIEWER",
#     "created_at": "..."
#   },
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }
```

---

## Database Verification

The database is already properly set up:

```bash
# Database status: ✅ HEALTHY
# - Connection: Working
# - Schema: In sync
# - Migrations: All applied
# - Tables: All exist (User, Seed, Project, Phase, etc.)

# Verified with:
npx prisma db push --skip-generate
# Output: "The database is already in sync with the Prisma schema."
```

No database work needed - only code fix required.

---

## Summary

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Frontend | ✅ Working | None |
| Backend API | ✅ Running | None |
| Database | ✅ Migrated | None |
| Auth Code | ❌ Broken | **Fix role enum** |
| API Keys | ⚠️ Placeholders | Update after auth fix |

**Critical path:**
1. Fix auth.routes.ts (2 minutes)
2. Commit and push (1 minute)
3. Wait for deployment (3 minutes)
4. Test registration (1 minute)
5. Update API keys (5 minutes)
6. Test complete workflow (5 minutes)

**Total time:** ~17 minutes

---

**Next Steps:**
1. Apply the fix using Option 1 (recommended)
2. Verify registration works
3. Update API keys
4. Run full workflow test (see DEPLOYMENT-VALIDATION-REPORT.md)
