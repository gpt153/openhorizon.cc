# Issue 1: Clerk API Keys Setup Instructions

## Overview

This guide walks you through setting up Clerk authentication for OpenHorizon. The authentication code is already implemented—you just need to provide real API keys.

**Time Required:** ~30 minutes
**Difficulty:** Easy (following steps in Clerk dashboard)

---

## Prerequisites

- [ ] Email address for Clerk account
- [ ] Access to OpenHorizon repository
- [ ] Access to Google Cloud Console (for Cloud Run environment variables)

---

## Step 1: Create Clerk Account & Application

### 1.1 Sign Up for Clerk
1. Go to https://dashboard.clerk.com/
2. Sign up for a free account (if you don't have one)
3. Verify your email address

### 1.2 Create Application
1. Click **"Create Application"** or **"+ Add Application"**
2. **Application Name:** `OpenHorizon Production`
3. **Authentication Options:** Select at minimum:
   - ✅ Email + Password
   - ✅ Google OAuth (recommended)
   - ✅ GitHub OAuth (recommended)
4. Click **"Create Application"**

---

## Step 2: Get API Keys

### 2.1 Copy Publishable Key
1. In your Clerk dashboard, go to **"API Keys"** (left sidebar)
2. Find **"Publishable Key"**
3. Copy the key (starts with `pk_live_...` or `pk_test_...`)
4. Save it somewhere secure (you'll need it shortly)

### 2.2 Copy Secret Key
1. In the same "API Keys" page
2. Find **"Secret Key"**
3. Click **"Show"** or **"Copy"**
4. Copy the key (starts with `sk_live_...` or `sk_test_...`)
5. **⚠️ IMPORTANT:** Keep this secret! Never commit it to version control

---

## Step 3: Configure Local Environment

### 3.1 Update `.env.local`
1. Open your local repository
2. Create or edit `app/.env.local` (note: in the `app/` directory)
3. Replace the dummy values:

```bash
# CLERK AUTHENTICATION
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_actual_key_here"
CLERK_SECRET_KEY="sk_test_your_actual_secret_here"

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"
```

4. Save the file

### 3.2 Update `.env.production`
1. Open `.env.production` in the root directory
2. Replace the dummy Clerk values:

```bash
# ============================================================================
# AUTHENTICATION - CLERK
# ============================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_your_production_key_here"
CLERK_SECRET_KEY="sk_live_your_production_secret_here"

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"
```

3. Save the file

> **Note:** For production, use `pk_live_...` and `sk_live_...` keys (not test keys)

---

## Step 4: Test Locally

### 4.1 Start Development Server
```bash
cd app
npm install  # if you haven't already
npm run dev
```

### 4.2 Verify Authentication
1. Open browser to http://localhost:3000
2. Navigate to `/sign-in`
3. **Expected:** You should see the Clerk sign-in UI (not an error page)
4. Try creating an account
5. Verify you're redirected to `/onboarding` after sign-up

### 4.3 Check Dashboard Access
1. After signing in, navigate to `/dashboard`
2. **Expected:** You should see the dashboard (not redirected to sign-in)
3. Try signing out and back in

---

## Step 5: Deploy to Production

### 5.1 Update Cloud Run Environment Variables

#### Option A: Using Google Cloud Console (GUI)
1. Go to https://console.cloud.google.com/run
2. Select your project
3. Click on the **"app"** service
4. Click **"Edit & Deploy New Revision"**
5. Go to **"Variables & Secrets"** tab
6. Find these variables and update them:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → Your production publishable key
   - `CLERK_SECRET_KEY` → Your production secret key
7. Click **"Deploy"**

#### Option B: Using gcloud CLI
```bash
gcloud run services update app \
  --region=us-central1 \
  --update-env-vars NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_your_key_here" \
  --update-env-vars CLERK_SECRET_KEY="sk_live_your_secret_here"
```

### 5.2 Trigger Deployment
If you're using Cloud Build:
```bash
# Commit the .env.production changes
git add .env.production
git commit -m "Configure Clerk API keys for production"
git push origin main

# Or manually trigger
gcloud builds submit --config cloudbuild-app.yaml
```

---

## Step 6: Verify Production

### 6.1 Test Production Sign-In
1. Go to https://app.openhorizon.cc/sign-in
2. Try signing up with a new account
3. Verify authentication flow works
4. Check that protected routes require authentication

### 6.2 Check Clerk Dashboard
1. Go back to https://dashboard.clerk.com/
2. Click on your "OpenHorizon Production" app
3. Go to **"Users"** section
4. You should see the test accounts you just created

---

## Troubleshooting

### Error: "Clerk publishable key not found"
- **Cause:** Environment variable not loaded
- **Fix:** Restart your dev server after updating `.env.local`

### Error: "Invalid API key"
- **Cause:** Wrong key or typo
- **Fix:** Double-check you copied the full key from Clerk dashboard

### Sign-in page shows blank or error
- **Cause:** Publishable key is incorrect or not set
- **Fix:** Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correct and starts with `pk_`

### Can't access dashboard after sign-in
- **Cause:** Middleware or auth configuration issue
- **Fix:** Check `app/middleware.ts` is properly configured (should already be done)

### Production deployment fails
- **Cause:** Secret key not set in Cloud Run
- **Fix:** Verify environment variables in Cloud Run console

---

## Security Checklist

Before going live:
- [ ] `.env.local` is in `.gitignore` (should already be)
- [ ] Never committed secret keys to Git history
- [ ] Using production keys (`pk_live_...` / `sk_live_...`) in production
- [ ] Using test keys (`pk_test_...` / `sk_test_...`) in development
- [ ] Cloud Run environment variables are set correctly
- [ ] Tested sign-up, sign-in, and sign-out flows

---

## Next Steps After Setup

Once authentication is working:

1. **Configure Webhooks (Optional):**
   - Set up Clerk webhooks to sync user data to your database
   - Guide: https://clerk.com/docs/integrations/webhooks

2. **Customize Appearance (Optional):**
   - Customize the Clerk UI to match OpenHorizon branding
   - Dashboard → Customization → Appearance

3. **Set Up Production Limits:**
   - Review Clerk pricing and user limits
   - Set up billing if needed

4. **Enable Additional Auth Methods:**
   - Add more OAuth providers (LinkedIn, Microsoft, etc.)
   - Enable multi-factor authentication

---

## Support

- **Clerk Documentation:** https://clerk.com/docs
- **Clerk Support:** https://clerk.com/support
- **OpenHorizon Codebase:** Check `app/middleware.ts` and `app/(auth)/` routes

---

**Status after completion:** Authentication should be fully functional in both local development and production! 🎉
