# Issue 1: Configure Clerk API Keys - Setup Instructions

## Status: ⚠️ REQUIRES MANUAL ACTION

I've prepared the environment files, but you need to complete these steps manually because they require access to:
- Clerk Dashboard (requires login)
- Google Cloud Console (requires authentication)

---

## Step 1: Get Clerk API Keys

### Option A: Use Existing Clerk Account (Recommended)
1. Go to https://dashboard.clerk.com/
2. Sign in with your account
3. Select your application (or create one: "OpenHorizon Production")
4. Navigate to **API Keys** in the left sidebar
5. You'll see two keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (click "Show" to reveal, starts with `sk_test_` or `sk_live_`)

### Option B: Create New Clerk Account
1. Go to https://clerk.com/
2. Click "Get Started" and sign up
3. Create an application named "OpenHorizon Production"
4. Configure the application:
   - **Application Name:** OpenHorizon Production
   - **Application URL:** https://app.openhorizon.cc
5. Navigate to **API Keys** and copy both keys

---

## Step 2: Update Local Environment

1. Open `app/.env.local` (I've created this file for you)
2. Replace the placeholder values:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_KEY_HERE"
   CLERK_SECRET_KEY="sk_test_YOUR_ACTUAL_KEY_HERE"
   ```

---

## Step 3: Update Production Environment

### Update .env.production file
1. Open `.env.production` in the root directory
2. Replace lines 14-15:
   ```bash
   # OLD (dummy values):
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_dummy"
   CLERK_SECRET_KEY="sk_test_dummy"

   # NEW (your actual keys):
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_YOUR_ACTUAL_KEY_HERE"
   CLERK_SECRET_KEY="sk_live_YOUR_ACTUAL_KEY_HERE"
   ```

### Update Cloud Run Environment Variables
Run these commands in your terminal (replace with your actual keys):

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"

# Update Cloud Run service with Clerk keys
gcloud run services update openhorizon-app \
  --project=$PROJECT_ID \
  --region=europe-west1 \
  --update-env-vars NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY \
  --update-env-vars CLERK_SECRET_KEY=sk_live_YOUR_KEY
```

**Note:** Use `pk_live_` and `sk_live_` keys for production, `pk_test_` and `sk_test_` keys for development.

---

## Step 4: Verify Keys Work Locally

After updating `app/.env.local`:

```bash
cd app
npm run dev
```

Then:
1. Open http://localhost:3000/sign-in
2. You should see the Clerk sign-in UI (no errors in console)
3. Try signing in with a test account
4. Check browser console for any Clerk errors

**Expected Result:**
- ✅ Clerk sign-in page loads without errors
- ✅ No "invalid API key" errors in console
- ✅ Sign-in form is functional

---

## Step 5: Verification Checklist

Before proceeding to Issue 2, confirm:

- [ ] Clerk account created/accessed
- [ ] API keys copied from Clerk Dashboard
- [ ] `app/.env.local` updated with test keys (`pk_test_`, `sk_test_`)
- [ ] `.env.production` updated with live keys (`pk_live_`, `sk_live_`)
- [ ] Cloud Run environment variables updated (command executed successfully)
- [ ] Local dev server runs without Clerk errors
- [ ] Sign-in page loads at http://localhost:3000/sign-in
- [ ] No "invalid API key" errors in browser console

---

## Troubleshooting

### Error: "Invalid publishable key"
- **Cause:** Wrong key format or expired key
- **Solution:** Re-copy keys from Clerk Dashboard, ensure no extra spaces

### Error: "Clerk: Missing publishable key"
- **Cause:** `.env.local` not loaded by Next.js
- **Solution:** Restart dev server (`npm run dev`)

### Error: "Failed to fetch Clerk settings"
- **Cause:** Network issue or invalid secret key
- **Solution:** Check internet connection, verify secret key is correct

### Sign-in page shows blank screen
- **Cause:** Clerk components not loading
- **Solution:** Check browser console for errors, verify keys are public (`pk_`) and secret (`sk_`)

---

## Once Complete

Reply in this GitHub issue with:
```
Issue 1 complete ✅
- Local keys configured
- Production keys configured
- Verification tests passed
```

Then I'll proceed with Issue 2: Re-enable Clerk Middleware.

---

## Need Help?

Common issues:
- **Don't have a Clerk account?** Create one at https://clerk.com/ (free tier available)
- **Can't access Cloud Run?** Use `gcloud auth login` to authenticate
- **Keys not working?** Ensure you're using the correct environment (test vs live)

If you get stuck, paste any error messages in the GitHub issue and I'll help debug.
