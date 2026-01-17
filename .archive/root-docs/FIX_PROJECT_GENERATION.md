# Fix: Cannot Generate Project

## Root Cause

The project generation is failing due to missing configuration. Here's what needs to be fixed:

### 1. Missing Inngest Configuration

Inngest is required for background AI generation but keys are not in `.env.local`.

### 2. Dummy Organization May Not Exist

The app uses a hardcoded dummy org ID but it may not exist in the database.

## Quick Fix (5 minutes)

### Step 1: Add Inngest Configuration

Add these lines to `app/.env.local`:

```bash
# For local development, use these test values
INNGEST_EVENT_KEY="test"
INNGEST_SIGNING_KEY="test"
```

Or copy from `.env.example`.

### Step 2: Seed Dummy Organization

Run this SQL against your database:

```bash
# Option A: Using psql
psql "postgresql://postgres.jnwlzawkfqcxdtkhwokd:Lurk7.Passivism.Serving@aws-1-eu-west-1.pooler.supabase.com:6543/postgres" -f seed-dummy-org.sql

# Option B: Run SQL manually in Supabase dashboard
```

The SQL to run:
```sql
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
```

### Step 3: Start Inngest Dev Server

In a **separate terminal**, run:

```bash
cd app
npx inngest-cli@latest dev
```

This will start Inngest at http://localhost:8288 and automatically connect to your app.

### Step 4: Restart Your Dev Server

```bash
cd app
npm run dev
```

### Step 5: Test Project Generation

1. Go to http://localhost:3000
2. Click "New Project"
3. Fill out the wizard
4. Click "Generate Project"
5. Wait 30-60 seconds
6. You should see your generated project!

## Verification Checklist

Before trying to generate a project, verify:

- [ ] `app/.env.local` exists and has:
  - [ ] `DATABASE_URL`
  - [ ] `OPENAI_API_KEY`
  - [ ] `INNGEST_EVENT_KEY="test"`
  - [ ] `INNGEST_SIGNING_KEY="test"`

- [ ] Dummy organization exists in database:
  ```sql
  SELECT * FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001';
  ```

- [ ] Inngest dev server is running in a separate terminal:
  ```bash
  npx inngest-cli@latest dev
  ```
  You should see: "✓ Inngest dev server running on http://127.0.0.1:8288"

- [ ] Next.js dev server is running:
  ```bash
  npm run dev
  ```
  You should see: "✓ Ready on http://localhost:3000"

## Detailed Troubleshooting

### Error: "Failed to generate project"

**Check browser console (F12):**
- Look for network errors
- Check for failed API calls to `/api/trpc/projects.generateFromIdea`

**Check server console:**
- Look for error messages from tRPC or Inngest
- Common errors:
  - "Project not found or unauthorized" → Dummy org doesn't exist
  - "OpenAI API error" → Check API key and credits
  - "Inngest error" → Inngest dev server not running

### Error: "Inngest function not found"

**Solution**: Make sure Inngest dev server is running:
```bash
npx inngest-cli@latest dev
```

### Error: Database connection

**Check:**
1. DATABASE_URL is correct
2. Supabase project is active
3. Network connection works

**Test:**
```bash
cd app
npx prisma studio
```

If Prisma Studio opens, database connection is working.

### Generation Status Stuck at "IN_PROGRESS"

**Likely causes:**
1. Inngest dev server crashed - restart it
2. OpenAI API call failed - check server logs
3. Database write failed - check permissions

**Debug:**
1. Check Inngest dev server logs
2. Check browser network tab
3. Look at `project_generation_sessions` table in database

## Production Setup

For production (deployed to Cloud Run), you need Inngest Cloud:

1. Sign up at https://www.inngest.com
2. Create an app
3. Get Event Key and Signing Key from dashboard
4. Add to `env.yaml` or Cloud Run environment variables
5. Set webhook URL in Inngest dashboard:
   ```
   https://app.openhorizon.cc/api/inngest
   ```

## Still Not Working?

### Complete Reset

```bash
# 1. Stop all servers (Ctrl+C)

# 2. Clear Next.js cache
cd app
rm -rf .next

# 3. Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 4. Verify .env.local
cat .env.local

# 5. Start Inngest (terminal 1)
npx inngest-cli@latest dev

# 6. Start app (terminal 2)
npm run dev

# 7. Try again
```

### Get Help

1. **Check server logs carefully** - the error message usually tells you exactly what's wrong
2. **Check Inngest dev server** - shows real-time function execution
3. **Check browser console** - shows frontend errors
4. **Check database** - verify org exists and sessions are being created

### Common Working Configuration

**app/.env.local:**
```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
OPENAI_API_KEY="sk-proj-..."
INNGEST_EVENT_KEY="test"
INNGEST_SIGNING_KEY="test"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

**Terminal 1:**
```
$ npx inngest-cli@latest dev
✓ Inngest dev server running on http://127.0.0.1:8288
```

**Terminal 2:**
```
$ npm run dev
✓ Ready on http://localhost:3000
```

## Success Signs

When everything works:

1. **Wizard submit**: You see a toast "Starting project generation..."
2. **Loading screen**: Shows "Generating Your Project..." with progress bar
3. **Inngest logs**: Shows function execution in real-time
4. **After 30-60s**: Redirects to project detail page with generated content
5. **Database**: New record in `projects` table

That's it! If you follow these steps, project generation should work. 🎉
