# Development Workflow - OpenHorizon

Complete guide for implementing features from GitHub issues to production deployment using SCAR (Remote Coding Agent).

## Overview

This project uses a **three-tier deployment workflow**:

```
Feature Branch → Staging → Production
     ↓              ↓           ↓
   Dev Test    Staging Test   Live
```

## Branch Strategy

| Branch | Purpose | Deployed To | Auto-Deploy |
|--------|---------|-------------|-------------|
| `feature-*` | Feature development | Local dev only | No |
| `staging` | Integration testing | Cloud Run staging (optional) | No |
| `main` | Production | openhorizon.cc + app.openhorizon.cc | **✅ Yes** |

## Complete Workflow

### 1. Create Issue on GitHub

Create a GitHub issue describing the feature:

```markdown
Title: Add dark mode toggle
Description: Users should be able to toggle between light and dark themes...
```

### 2. Plan Feature (SCAR Command)

On the GitHub issue, comment:

```
@scar /command-invoke plan-feature-github "Add dark mode toggle"
```

**What SCAR Does:**
1. Analyzes codebase for patterns
2. Researches dependencies and best practices
3. Creates comprehensive implementation plan
4. Creates feature branch: `feature-add-dark-mode`
5. Commits plan to `.agents/plans/add-dark-mode.md`
6. Pushes feature branch to GitHub

**Output:** SCAR comments with plan summary and branch details

### 3. Implement Feature (SCAR Command)

On the same GitHub issue, comment:

```
@scar /command-invoke execute-github .agents/plans/add-dark-mode.md feature-add-dark-mode
```

**What SCAR Does:**
1. Checks out feature branch
2. Implements all tasks from plan
3. **Tests in local dev environment** (see testing section below)
4. **Iterates until all tests pass**
5. Commits changes incrementally
6. Creates PR from `feature-add-dark-mode` → `staging`

**Output:** SCAR comments with implementation summary and PR link

### 4. Test in Local Dev (Done by SCAR)

**SCAR automatically runs these validations before creating PR:**

```bash
# 1. Start local dev server
cd app
npm run dev &
DEV_PID=$!
sleep 10  # Wait for server to start

# 2. Verify app loads
curl -f http://localhost:3000 || { echo "Dev server failed to start"; exit 1; }

# 3. Run linting
npm run lint

# 4. Run type checking (if TypeScript)
npx tsc --noEmit

# 5. Run Playwright E2E tests (CRITICAL)
cd app
npx playwright test
# Must pass - validates actual UI/UX works

# 6. Stop dev server
kill $DEV_PID
```

**Success Criteria:**
- ✅ Dev server starts without errors
- ✅ App loads successfully at localhost
- ✅ All linting passes
- ✅ All type checks pass
- ✅ All tests pass
- ✅ No console errors visible

**If ANY validation fails:**
- SCAR fixes the issue
- Reruns validations
- Iterates until all pass
- Only then creates PR

### 5. Review & Merge PR to Staging

**Manual Step (You):**

1. Review the PR on GitHub
2. Check SCAR's validation results
3. Optionally test manually
4. Merge PR: `feature-add-dark-mode` → `staging`

### 6. Deploy to Staging (Optional)

If you want to test on Cloud Run before production:

```bash
# Deploy app to staging
cd app
gcloud run deploy openhorizon-app-staging \
  --source . \
  --region=europe-west1 \
  --project=openhorizon-cc \
  --tag=staging \
  --no-traffic  # Staging URL only

# Deploy landing to staging
cd ../landing
gcloud run deploy openhorizon-landing-staging \
  --source . \
  --region=europe-west1 \
  --project=openhorizon-cc \
  --tag=staging \
  --no-traffic
```

**Test staging URLs:**
- App: `https://staging---openhorizon-app-<hash>.run.app`
- Landing: `https://staging---openhorizon-landing-<hash>.run.app`

### 7. Promote to Production (AUTOMATIC)

**After staging validation (or if skipping staging):**

1. Create PR: `staging` → `main`
2. Review changes one last time
3. **Merge to main** ← This triggers automatic deployment!

**What Happens Automatically:**

GitHub Actions workflow triggers on merge to main:
1. ✅ Builds and deploys landing page to Cloud Run
2. ✅ Builds and deploys app to Cloud Run
3. ✅ Verifies both deployments succeeded
4. ✅ Reports status in Actions tab

**Deployment Status:**
- Watch deployment: https://github.com/gpt153/openhorizon.cc/actions
- Landing page: https://openhorizon.cc
- Application: https://app.openhorizon.cc

**Deployment Settings:**
- Landing: 512Mi RAM, 1 CPU, 0-10 instances
- App: 1Gi RAM, 1 CPU, 0-10 instances
- Region: europe-west1
- Build: Automatic from source

**Manual Deployment (if needed):**

If you need to deploy without merging (rare):

```bash
# Trigger workflow manually via GitHub CLI
gh workflow run deploy-production.yml

# Or deploy manually via gcloud
cd app
gcloud run deploy openhorizon-app \
  --source . \
  --region=europe-west1 \
  --project=openhorizon-cc \
  --allow-unauthenticated

cd ../landing
gcloud run deploy openhorizon-landing \
  --source . \
  --region=europe-west1 \
  --project=openhorizon-cc \
  --allow-unauthenticated
```

## SCAR Testing Requirements

### Before Creating PR

SCAR **MUST** complete all of these before creating a PR:

#### 1. Local Dev Server Test

```bash
# Start dev server
cd app
npm run dev &
DEV_PID=$!

# Wait for server
echo "Waiting for dev server..."
for i in {1..30}; do
  if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Dev server is running"
    break
  fi
  sleep 2
done

# Test endpoint
curl -f http://localhost:3000 || { echo "❌ Dev server failed"; kill $DEV_PID; exit 1; }

# Cleanup
kill $DEV_PID
```

#### 2. Code Quality

```bash
# Linting
npm run lint
# Must exit 0

# TypeScript (if applicable)
npx tsc --noEmit
# Must exit 0
```

#### 3. Tests (if they exist)

```bash
# Unit/integration tests
npm test
# Must all pass

# E2E tests (if Playwright configured)
npx playwright test
# Must all pass
```

#### 4. Build Test

```bash
# Verify production build works
npm run build
# Must exit 0
```

### Iteration Logic

If ANY validation fails:

```
1. SCAR identifies the error
2. SCAR fixes the code
3. SCAR commits the fix
4. SCAR reruns ALL validations
5. Repeat until all pass
```

**Maximum Iterations:** 5 attempts
- If still failing after 5 attempts, SCAR comments on issue:
  ```
  ❌ Unable to resolve validation errors after 5 attempts.
  Latest error: <error details>
  Manual intervention required.
  ```

## Environment Setup

### Local Development

```bash
# Install dependencies
npm install

# Run app (port 3000)
npm run dev:app

# Run landing (port 3001)
npm run dev:landing
```

### Environment Variables

Create `.env.local` for local testing:

```env
# Database (use Supabase dev instance)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk (TEST keys for local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Supabase (dev instance)
NEXT_PUBLIC_SUPABASE_URL="https://dev-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# OpenAI (use same key)
OPENAI_API_KEY="sk-proj-..."

# App URL (local)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Troubleshooting

### Dev Server Won't Start

```bash
# Check port availability
lsof -i :3000
# Kill if occupied
kill -9 $(lsof -t -i :3000)

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Tests Failing

```bash
# Clear all caches
rm -rf node_modules .next
npm install
npm test
```

### Build Errors

```bash
# Check TypeScript errors
npx tsc --noEmit

# Check for missing dependencies
npm install
```

## Quick Reference

### SCAR Commands on GitHub Issues

| Command | Purpose | Example |
|---------|---------|---------|
| `/command-invoke plan-feature-github` | Create implementation plan | `@scar /command-invoke plan-feature-github "Add user auth"` |
| `/command-invoke execute-github` | Implement feature from plan | `@scar /command-invoke execute-github .agents/plans/user-auth.md feature-user-auth` |

### Manual Commands

```bash
# Create staging branch (already done)
git checkout -b staging
git push -u origin staging

# Deploy to production
cd app && gcloud run deploy openhorizon-app --source . --region=europe-west1 --project=openhorizon-cc

# View logs
gcloud run logs read openhorizon-app --region=europe-west1 --project=openhorizon-cc --limit=50
```

## Success Checklist

Before each production deployment:

- [ ] Feature planned with SCAR
- [ ] Feature implemented with SCAR
- [ ] All local dev tests passed
- [ ] PR reviewed and merged to staging
- [ ] Staging tested (if using staging deployment)
- [ ] PR from staging merged to main
- [ ] Production deployment executed
- [ ] Production site verified working

---

**Key Principle:** SCAR handles all development and testing. You only review PRs and deploy to production.
