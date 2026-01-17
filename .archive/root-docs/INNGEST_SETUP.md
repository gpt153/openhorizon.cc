# Inngest Production Setup Guide

## Problem: Seed Generation Stuck in Production

The seed generation was getting stuck because Inngest couldn't communicate with your Cloud Run application. This guide fixes that issue.

## Understanding the Architecture

```
User clicks "Generate Seeds"
    ↓
tRPC API creates session in database
    ↓
Service layer sends event to Inngest → inngest.send({ name: 'brainstorm.generate-seeds', ... })
    ↓
Inngest Cloud receives event
    ↓
Inngest calls your app → POST https://app.openhorizon.cc/api/inngest
    ↓
Your app executes generateSeedsJob function
    ↓
AI generates seeds → Saves to database → Updates status to COMPLETED
    ↓
Frontend polling detects completion and shows results
```

## Step 1: Configure Cloud Run Environment Variables

Run the provided script:

```bash
./deploy-inngest-config.sh
```

Or manually run:

```bash
gcloud config set account remote-coding-agent@openhorizon-cc.iam.gserviceaccount.com
gcloud config set project openhorizon-cc

gcloud run services update app \
  --region=us-central1 \
  --update-env-vars="OPENAI_API_KEY=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,INNGEST_EVENT_KEY=I8TpIjCA-6J_x9wYoSVZ_2fKaSg9faLlqFBZMQF0e3Mgrw6JGA8CedF9FySf865rOchshVupoBvomcnii8bCCg,INNGEST_SIGNING_KEY=signkey-prod-7bd0264b3c6d7560d74cf345c7e1a8d4de13f53c5503878a16be3a6f9fbeb834"
```

## Step 2: Sync Your App with Inngest Cloud

**IMPORTANT**: You don't create a webhook manually. Inngest discovers your functions automatically.

1. Go to [Inngest Cloud Dashboard](https://app.inngest.com)
2. Navigate to your workspace
3. Click on **"Apps"** in the sidebar
4. Click **"Sync App"** or **"Create App"**
5. Enter your production app URL:
   ```
   https://app.openhorizon.cc/api/inngest
   ```
6. Click **"Sync"**

Inngest will make a GET request to `https://app.openhorizon.cc/api/inngest` and discover these functions:
- `brainstorm.generate-seeds` (the one you need)
- `project.generate-from-idea`
- `programme.generate-from-concept`

## Step 3: Verify the Integration

### Check Environment Variables

```bash
gcloud run services describe app --region=us-central1 --format=yaml | grep -A 10 env:
```

You should see:
- `OPENAI_API_KEY`
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

### Test Seed Generation

1. Go to https://app.openhorizon.cc
2. Navigate to Brainstorming Playground
3. Enter a prompt (e.g., "Community garden project for urban neighborhood")
4. Click "Generate Seeds"
5. Seeds should appear within 10-30 seconds

### Monitor in Inngest Dashboard

1. Go to Inngest Dashboard → Functions
2. You should see `brainstorm.generate-seeds` listed
3. When you trigger generation, you'll see it in the "Runs" tab
4. Click on a run to see:
   - Step 1: load-session ✓
   - Step 2: generate-seeds ✓
   - Step 3: save-seeds ✓
   - Step 4: update-session ✓

## Troubleshooting

### Seeds Still Not Generating?

**Check 1: Verify endpoint is accessible**
```bash
curl -I https://app.openhorizon.cc/api/inngest
```
Should return `200 OK` with Inngest headers.

**Check 2: Check Cloud Run logs**
```bash
gcloud run services logs read app --region=us-central1 --limit=50
```
Look for:
- "🌱 Generating seeds for session: xxx"
- "💾 Saving X seeds to database..."
- "✅ Seeds generated successfully"

**Check 3: Verify Inngest received the event**
```bash
# In your browser console on app.openhorizon.cc
fetch('/api/test-inngest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ test: true })
})
```

**Check 4: Database status**
```sql
SELECT id, generationStatus, createdAt
FROM BrainstormSession
ORDER BY createdAt DESC
LIMIT 5;
```
Status should change from `IN_PROGRESS` → `COMPLETED`

### Common Issues

1. **Environment variables not set**: Run the deployment script again
2. **Inngest can't reach app**: Make sure Cloud Run service is public or Inngest IP is allowlisted
3. **Invalid signing key**: Double-check the signing key in Inngest dashboard matches env var
4. **OpenAI API quota**: Check OpenAI usage dashboard

## Architecture Notes

### Why Inngest?

Seed generation takes 10-30 seconds with GPT-4. Running this synchronously would:
- Block the API request
- Risk timeouts
- Prevent scaling

Inngest runs it asynchronously with:
- Automatic retries
- Step-based execution (can resume from failed step)
- Observable execution logs
- No infrastructure to manage

### Event Flow

```typescript
// 1. Service sends event
await inngest.send({
  name: 'brainstorm.generate-seeds',
  data: { sessionId, tenantId, userId }
})

// 2. Inngest receives event and calls /api/inngest
POST https://app.openhorizon.cc/api/inngest
Headers:
  x-inngest-signature: [signed with INNGEST_SIGNING_KEY]
Body:
  { event: 'brainstorm.generate-seeds', data: {...} }

// 3. Your app validates signature and executes function
export const generateSeedsJob = inngest.createFunction(
  { id: 'brainstorm.generate-seeds', ... },
  { event: 'brainstorm.generate-seeds' },
  async ({ event, step }) => {
    // Execute AI generation in background
  }
)
```

### Security

- `INNGEST_SIGNING_KEY`: Validates that requests to /api/inngest are from Inngest
- `INNGEST_EVENT_KEY`: Authenticates your app when sending events to Inngest
- Both are required for production

## Success Criteria

✅ Environment variables configured in Cloud Run
✅ Inngest app synced with https://app.openhorizon.cc/api/inngest
✅ Functions visible in Inngest dashboard
✅ Test generation completes within 30 seconds
✅ Seeds appear in UI
✅ Status changes from IN_PROGRESS → COMPLETED

## Reference Links

- [Inngest Docs - Deploy to Production](https://www.inngest.com/docs/deploy)
- [Inngest Docs - Send Events](https://www.inngest.com/docs/reference/events/send)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)
