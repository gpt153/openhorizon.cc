# Deployment Instructions for Issue #19

This document provides step-by-step instructions for deploying the subdomain routing fix.

## Overview

We're splitting the deployment into two Cloud Run services:
- **openhorizon-landing** → `openhorizon.cc` (root domain - marketing)
- **openhorizon-app** → `app.openhorizon.cc` (subdomain - application)

## Prerequisites

Before deploying, ensure:
- ✅ Code is merged to `main` branch
- ✅ Cloud Build triggers are configured
- ✅ DNS records are properly configured
- ✅ You have `gcloud` CLI installed and authenticated

## Step 1: Merge to Main Branch

```bash
# This will trigger Cloud Build automatically
git push origin issue-19:main
```

Cloud Build will:
1. Build the landing page Docker image
2. Deploy to `openhorizon-landing` service
3. Build the app Docker image (on subsequent changes to app/)
4. Deploy to `openhorizon-app` service

## Step 2: Wait for Cloud Build

Monitor Cloud Build progress:
```bash
gcloud builds list --limit=5 --project=open-horizon-prod
```

Or watch in Cloud Console:
https://console.cloud.google.com/cloud-build/builds

## Step 3: Verify Services Are Running

```bash
# Check landing page service
gcloud run services describe openhorizon-landing \
  --region=europe-west1 \
  --project=open-horizon-prod

# Check app service
gcloud run services describe openhorizon-app \
  --region=europe-west1 \
  --project=open-horizon-prod
```

Both should show status: `Ready`

## Step 4: Fix Domain Mappings

Run the deployment script:

```bash
./deploy-domain-mappings.sh
```

This will:
1. Remove incorrect mapping from `openhorizon.cc` (if exists)
2. Map `openhorizon-landing` → `openhorizon.cc`
3. Map `openhorizon-app` → `app.openhorizon.cc`

### Manual Steps (if script fails)

```bash
# Remove old mapping
gcloud run domain-mappings delete \
  --domain=openhorizon.cc \
  --region=europe-west1 \
  --project=open-horizon-prod

# Map landing to root
gcloud run domain-mappings create \
  --service=openhorizon-landing \
  --domain=openhorizon.cc \
  --region=europe-west1 \
  --project=open-horizon-prod

# Map app to subdomain
gcloud run domain-mappings create \
  --service=openhorizon-app \
  --domain=app.openhorizon.cc \
  --region=europe-west1 \
  --project=open-horizon-prod
```

## Step 5: Verify DNS Configuration

Check DNS records are correct:

```bash
nslookup openhorizon.cc
nslookup app.openhorizon.cc
```

Both should resolve to Google Cloud infrastructure.

Required DNS records:
```
openhorizon.cc       → CNAME to ghs.googlehosted.com
app.openhorizon.cc   → CNAME to ghs.googlehosted.com
```

## Step 6: Wait for SSL Provisioning

SSL certificates are automatically provisioned by Google Cloud Run.

**This takes 15-30 minutes.**

Check certificate status:
```bash
gcloud run domain-mappings describe \
  --domain=openhorizon.cc \
  --region=europe-west1 \
  --project=open-horizon-prod

gcloud run domain-mappings describe \
  --domain=app.openhorizon.cc \
  --region=europe-west1 \
  --project=open-horizon-prod
```

Look for: `certificateStatus: ACTIVE`

## Step 7: Test Both Domains

### Test Landing Page (Root Domain)
```bash
curl -I https://openhorizon.cc
```

Expected:
- Status: `200 OK`
- Should show marketing landing page
- Contains CTAs to `app.openhorizon.cc`

### Test Application (Subdomain)
```bash
curl -I https://app.openhorizon.cc
```

Expected:
- Status: `200 OK` or redirect to `/sign-in`
- Should show application

### Manual Testing Checklist

Visit in browser and verify:

**Landing Page (https://openhorizon.cc)**
- [ ] Page loads successfully
- [ ] SSL certificate is valid
- [ ] Hero section displays
- [ ] "Get Started" button links to `https://app.openhorizon.cc/sign-up`
- [ ] "Sign In" button links to `https://app.openhorizon.cc/sign-in`
- [ ] Features section displays
- [ ] EU compliance footer displays
- [ ] Page loads fast (<2 seconds)

**Application (https://app.openhorizon.cc)**
- [ ] Page loads successfully
- [ ] SSL certificate is valid
- [ ] Redirects to sign-in if not authenticated
- [ ] Sign-in page works
- [ ] Sign-up page works
- [ ] Dashboard loads after authentication
- [ ] All functionality works as before

## Step 8: Test Authentication Flow

Full user journey:
1. Visit `https://openhorizon.cc`
2. Click "Get Started"
3. Should go to `https://app.openhorizon.cc/sign-up`
4. Create account
5. Should go to `https://app.openhorizon.cc/onboarding`
6. Complete onboarding
7. Should go to `https://app.openhorizon.cc/dashboard`

## Step 9: Test Playwright (Issue #15)

If Playwright tests exist, update base URLs and run:

```bash
cd app
npm run test:e2e
```

Update test configuration:
```typescript
const LANDING_URL = 'https://openhorizon.cc';
const APP_URL = 'https://app.openhorizon.cc';
```

## Step 10: Monitor Logs

Watch for any errors:

```bash
# Landing page logs
gcloud run services logs read openhorizon-landing \
  --region=europe-west1 \
  --project=open-horizon-prod \
  --limit=50

# App logs
gcloud run services logs read openhorizon-app \
  --region=europe-west1 \
  --project=open-horizon-prod \
  --limit=50
```

## Rollback Plan (If Needed)

If something goes wrong:

```bash
# Revert domain mapping to old state
gcloud run domain-mappings delete \
  --domain=app.openhorizon.cc \
  --region=europe-west1 \
  --project=open-horizon-prod

gcloud run domain-mappings create \
  --service=openhorizon-app \
  --domain=openhorizon.cc \
  --region=europe-west1 \
  --project=open-horizon-prod
```

Then investigate the issue before re-attempting.

## Troubleshooting

### Issue: "Domain already mapped"
```bash
# Delete existing mapping first
gcloud run domain-mappings delete --domain=<DOMAIN> --region=europe-west1
```

### Issue: SSL certificate not provisioning
- Wait 30 minutes
- Verify DNS records are correct
- Check domain ownership in Google Search Console

### Issue: Landing page not loading
```bash
# Check service logs
gcloud run services logs read openhorizon-landing --region=europe-west1 --limit=100

# Check service status
gcloud run services describe openhorizon-landing --region=europe-west1
```

### Issue: App authentication broken
- Verify Clerk domain settings include `app.openhorizon.cc`
- Check `NEXT_PUBLIC_APP_URL` environment variable is set correctly
- Verify cookies are being set for subdomain

## Success Criteria

- ✅ `https://openhorizon.cc` shows landing page
- ✅ `https://app.openhorizon.cc` shows application
- ✅ SSL certificates active on both domains
- ✅ Authentication flows work correctly
- ✅ All links from landing → app work
- ✅ No console errors
- ✅ Fast load times (<2s)
- ✅ Mobile responsive

## Post-Deployment Tasks

1. Update Google Search Console sitemap (if applicable)
2. Update any marketing materials with correct URLs
3. Notify team of new domain structure
4. Monitor analytics for any issues
5. Close Issue #19

## Questions?

If you encounter issues, check:
- Cloud Build logs: https://console.cloud.google.com/cloud-build/builds
- Cloud Run logs: https://console.cloud.google.com/run
- Domain mappings: https://console.cloud.google.com/run/domains

---

**Deployment prepared by**: Claude Code
**Issue**: #19 - Fix subdomain routing
**Date**: 2025-12-23
