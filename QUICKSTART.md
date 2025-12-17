# Quick Start Guide - OpenHorizon.cc

## Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase recommended)
- OpenAI API key

## Step 1: Database Setup

### Create Database Tables

Run the SQL setup script against your PostgreSQL database:

```bash
# Connect to your database and run:
psql $DATABASE_URL < setup.sql

# Then seed the dummy organization for development:
psql $DATABASE_URL < seed-dummy-org.sql
```

Or use Prisma:

```bash
cd app
npx prisma db push
```

Then manually insert the dummy org:
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

## Step 2: Environment Variables

Create `app/.env.local` with the following:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:password@host:5432/database"

# OpenAI (Required for AI generation)
OPENAI_API_KEY="sk-proj-..."

# Clerk (Optional - currently disabled)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Inngest (Optional - for background jobs)
INNGEST_EVENT_KEY="test"
INNGEST_SIGNING_KEY="test"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## Step 3: Install Dependencies

```bash
cd app
npm install
```

## Step 4: Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Step 5: Set Up Inngest (For AI Generation)

Inngest is required for background AI project generation.

### Option A: Inngest Dev Server (Local Development)

In a separate terminal:

```bash
npx inngest-cli@latest dev
```

This will:
- Start Inngest dev server at http://localhost:8288
- Automatically detect your app at http://localhost:3000/api/inngest
- Allow you to see background jobs in real-time

### Option B: Inngest Cloud (Production)

1. Sign up at https://www.inngest.com
2. Create an app
3. Get your Event Key and Signing Key
4. Add them to your `.env.local`:
   ```
   INNGEST_EVENT_KEY="your-event-key"
   INNGEST_SIGNING_KEY="your-signing-key"
   ```

## Testing the App

1. Navigate to http://localhost:3000
2. You'll be redirected to `/projects`
3. Click "New Project"
4. Fill out the 5-step wizard
5. Click "Generate Project"
6. Wait 30-60 seconds for AI generation
7. View your generated project concept!

## Troubleshooting

### "Cannot generate project"

**Check:**
1. ✅ Dummy organization exists in database:
   ```sql
   SELECT * FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001';
   ```

2. ✅ OpenAI API key is valid and has credits

3. ✅ Inngest is running:
   - Dev mode: `npx inngest-cli dev` should be running
   - Or Inngest Cloud keys are configured

4. ✅ Database connection works:
   ```bash
   cd app
   npx prisma studio
   ```

5. ✅ Check browser console for errors

6. ✅ Check server logs for error messages

### Database Connection Errors

- Make sure `DATABASE_URL` is correct
- For Supabase, use the "connection pooling" URL
- Test connection: `npx prisma db pull`

### AI Generation Fails

- Verify OpenAI API key: `echo $OPENAI_API_KEY`
- Check OpenAI account has credits
- Look at Inngest dev server logs for errors
- Check server console for detailed error messages

### Inngest Not Working

**Development:**
```bash
# Terminal 1: Run app
npm run dev

# Terminal 2: Run Inngest
npx inngest-cli dev
```

**Production:**
- Use Inngest Cloud with proper keys
- Verify webhook URL is accessible: `https://your-domain.com/api/inngest`

## Next Steps

Once the app is running:

1. **Enable Authentication**: Uncomment Clerk middleware in `app/src/middleware.ts`
2. **Add Real Organizations**: Create organizations via Clerk dashboard
3. **Deploy**: Follow `DEPLOYMENT.md` for Cloud Run deployment
4. **Add Features**: See `PHASE1_COMPLETE.md` for next features to build

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `DIRECT_URL` | ✅ Yes | Direct database connection (for migrations) |
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key for GPT-4 |
| `INNGEST_EVENT_KEY` | ⚠️ Dev only | Inngest event key (use "test" for dev) |
| `INNGEST_SIGNING_KEY` | ⚠️ Dev only | Inngest signing key (use "test" for dev) |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | App URL for redirects |
| `CLERK_SECRET_KEY` | ❌ No | Only if enabling auth |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ❌ No | Only if enabling auth |

## Support

For issues, check:
- Server console logs
- Browser console (F12)
- Inngest dev server UI (http://localhost:8288)
- Database records in Prisma Studio

Common fixes:
- Restart dev server
- Restart Inngest dev server
- Clear browser cache
- Check database connection
- Verify all environment variables are set
