# openhorizon.cc

**Repository:** https://github.com/gpt153/openhorizon.cc.git
**Workspace:** /home/samuel/.archon/workspaces/openhorizon.cc

## Project Overview

Open Horizon is a Swedish nonprofit association creating meaningful international opportunities for young people through Erasmus+ projects. This repository contains two Next.js applications deployed to Google Cloud Run:

- **Landing Page** (openhorizon.cc) - Marketing site for customers/partners
- **Application** (app.openhorizon.cc) - Full AI-powered project management platform

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Supabase)
- **Auth:** Clerk
- **AI:** OpenAI API
- **Deployment:** Google Cloud Run (serverless)

## Monorepo Structure

```
openhorizon.cc/
├── landing/              # Landing page → openhorizon.cc
├── app/                  # Application → app.openhorizon.cc
├── WORKFLOW.md           # Complete development workflow (READ THIS!)
├── DEPLOYMENT.md         # Cloud Run deployment guide
└── package.json          # Workspace root
```

## Development Workflow

**⚠️ CRITICAL: Read `WORKFLOW.md` for complete workflow documentation.**

This project follows a **Plan → Implement → Test → PR → Deploy** workflow managed by SCAR (Remote Coding Agent).

### Quick Start for Features

1. **Create GitHub Issue** describing the feature
2. **Plan Feature:** Comment `@scar /command-invoke plan-feature-github "<feature description>"`
3. **Implement:** Comment `@scar /command-invoke execute-github .agents/plans/<plan-file>.md feature-<branch>`
4. **SCAR automatically:**
   - Implements the feature
   - Tests in local dev environment
   - Iterates until all tests pass
   - Creates PR to `staging` branch

### Available Commands

**Planning & Implementation:**
- `/plan <feature>` - Deep implementation planning with codebase analysis
- `/implement <plan-file>` - Execute implementation plans
- `/commit [target]` - Quick commits with natural language targeting

**GitHub Workflow:**
- `/create-pr [base]` - Create pull request from current branch
- `/review-pr <pr-number>` - Comprehensive PR code review
- `/merge-pr [pr-number]` - Merge PR after validation

**Debugging & Analysis:**
- `/rca <issue>` - Root cause analysis for bugs
- `/fix-rca <rca-file>` - Implement fixes from RCA report

**Project Management:**
- `/prd [filename]` - Create Product Requirements Document
- `/worktree <branch>` - Create git worktrees for parallel development
- `/changelog-entry <description>` - Add CHANGELOG entry
- `/release <version>` - Create GitHub release with tag

### Using Archon

Task management is handled by Archon MCP. Common operations:

```bash
# List all tasks
list_tasks()

# Search tasks
list_tasks(query="authentication")

# Create task
manage_task("create", project_id="...", title="Fix bug", description="...")

# Update task status
manage_task("update", task_id="...", status="doing")
```

## Testing Requirements (CRITICAL)

**Before creating any PR, you MUST:**

### 1. Local Dev Server Test

```bash
# Navigate to app directory
cd app

# Start dev server in background
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "Waiting for dev server to start..."
for i in {1..30}; do
  if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Dev server is running"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Dev server failed to start after 60 seconds"
    kill $DEV_PID 2>/dev/null
    exit 1
  fi
  sleep 2
done

# Test that app loads
curl -f http://localhost:3000 || {
  echo "❌ App failed to load"
  kill $DEV_PID
  exit 1
}

echo "✅ App loads successfully"

# Stop dev server
kill $DEV_PID
wait $DEV_PID 2>/dev/null
```

**Expected:** Server starts, app loads at localhost:3000, no errors

### 2. Code Quality

```bash
# Linting
npm run lint
# Must exit with code 0

# TypeScript type checking
npx tsc --noEmit
# Must exit with code 0
```

### 3. Build Test

```bash
# Production build
npm run build
# Must complete without errors
```

### 4. Tests (if exist)

```bash
# Run test suite
npm test
# All tests must pass

# Playwright E2E tests (if configured)
npx playwright test
# All tests must pass
```

## Iteration Protocol

If ANY validation fails:

1. **Identify the error** - Read error message carefully
2. **Fix the code** - Address root cause
3. **Commit the fix** - `git add . && git commit -m "fix: <description>"`
4. **Rerun ALL validations** - Start from step 1 again
5. **Repeat** until all pass (max 5 attempts)

If still failing after 5 attempts:
- Comment on GitHub issue with error details
- Request manual intervention
- Do NOT create PR with failing tests

## Environment Configuration

### Local Development (.env.local)

```env
# Database (Supabase dev instance)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk (TEST keys only)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://dev-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# App URL (local)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Production (.env.production)

⚠️ **NEVER commit this file** - exists in repo already

- Uses LIVE Clerk keys (pk_live_..., sk_live_...)
- Uses production Supabase instance
- Uses production app URL (https://app.openhorizon.cc)

## Branch Strategy

| Branch | Purpose | Auto-Deploy | Target Deployment |
|--------|---------|-------------|-------------------|
| `feature-*` | Feature development | No | Local dev only |
| `staging` | Integration testing | No | Optional staging |
| `main` | Production code | No | Cloud Run production |

### PR Flow

```
feature-add-dark-mode → staging (SCAR creates this PR)
                ↓
            staging → main (You create this PR)
                ↓
          Production deployment
```

## Deployment

See `DEPLOYMENT.md` for full Cloud Run deployment instructions.

### Quick Production Deploy

```bash
# Deploy app
cd app
gcloud run deploy openhorizon-app \
  --source . \
  --region=europe-west1 \
  --project=openhorizon-cc \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1

# Deploy landing
cd ../landing
gcloud run deploy openhorizon-landing \
  --source . \
  --region=europe-west1 \
  --project=openhorizon-cc \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1
```

## Project-Specific Conventions

### Naming Patterns
- Components: PascalCase (`DarkModeToggle.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Hooks: camelCase with `use` prefix (`useTheme.ts`)
- Types: PascalCase (`UserProfile`)

### File Organization
- Pages: `/app/src/app/` (App Router)
- Components: `/app/src/components/`
- Utilities: `/app/src/lib/`
- Types: `/app/src/types/`
- API Routes: `/app/src/app/api/`

### Error Handling
```typescript
// Use try-catch with specific error types
try {
  await action();
} catch (error) {
  if (error instanceof SpecificError) {
    // Handle specific error
  }
  console.error('Operation failed:', error);
  throw new Error('User-friendly message');
}
```

### Logging Pattern
```typescript
// Use console methods appropriately
console.log('[Component] Info message');     // Info
console.warn('[Component] Warning message'); // Warnings
console.error('[Component] Error:', error);  // Errors
```

## Common Issues & Solutions

### Dev Server Port Conflict
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 $(lsof -t -i :3000)
```

### Cache Issues
```bash
# Clear Next.js cache
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

### TypeScript Errors
```bash
# Rebuild types
npx tsc --noEmit
# Check for missing @types packages
```

## Success Criteria

Before marking any implementation complete:

- [ ] All local dev tests pass
- [ ] Code linting passes (`npm run lint`)
- [ ] TypeScript types valid (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] PR created to `staging` branch
- [ ] PR description includes validation results
- [ ] No console errors or warnings

## Additional Resources

- [WORKFLOW.md](./WORKFLOW.md) - Complete development workflow
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Cloud Run deployment guide
- [README.md](./README.md) - Project overview and setup
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Clerk Docs](https://clerk.com/docs)
