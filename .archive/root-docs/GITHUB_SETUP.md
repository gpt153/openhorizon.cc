# GitHub Secrets Setup for Auto-Deployment

This guide explains how to configure GitHub secrets to enable automatic Cloud Run deployment when PRs are merged to main.

## Overview

When you merge a PR to `main`, GitHub Actions automatically:
1. Builds and deploys the landing page to Cloud Run
2. Builds and deploys the app to Cloud Run
3. Verifies both deployments succeeded

## Required GitHub Secret

You need to add one secret to your GitHub repository:

### GCP_SA_KEY

This is the service account key JSON that allows GitHub Actions to authenticate with Google Cloud.

## Setup Instructions

### Step 1: Get the Service Account Key

The service account key already exists at:
```
/home/samuel/scar/gcp/openhorizon-cc-key.json
```

Or if you need to create a new one:

```bash
# Set project ID
export PROJECT_ID="openhorizon-cc"
export SERVICE_ACCOUNT="github-actions-deploy"

# Create service account (if doesn't exist)
gcloud iam service-accounts create $SERVICE_ACCOUNT \
  --display-name="GitHub Actions Deployer" \
  --project=$PROJECT_ID

# Grant required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

# Download key
gcloud iam service-accounts keys create ~/openhorizon-github-key.json \
  --iam-account=$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com
```

### Step 2: Add Secret to GitHub

#### Option A: Via GitHub Web UI (Recommended)

1. Go to your repository: https://github.com/gpt153/openhorizon.cc
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Name: `GCP_SA_KEY`
6. Value: Copy the entire contents of the service account key JSON file

```bash
# Display the key (for copying)
cat /home/samuel/scar/gcp/openhorizon-cc-key.json
```

7. Click **Add secret**

#### Option B: Via GitHub CLI

```bash
# Set the secret using gh CLI
gh secret set GCP_SA_KEY \
  --repo gpt153/openhorizon.cc \
  --body "$(cat /home/samuel/scar/gcp/openhorizon-cc-key.json)"
```

### Step 3: Verify Secret is Set

```bash
# List secrets (won't show values)
gh secret list --repo gpt153/openhorizon.cc
```

You should see:
```
GCP_SA_KEY  Updated YYYY-MM-DD
```

## Testing the Workflow

### Test 1: Manual Trigger

Test the workflow without merging a PR:

```bash
# Trigger workflow manually
gh workflow run deploy-production.yml --repo gpt153/openhorizon.cc

# Watch the workflow
gh run watch --repo gpt153/openhorizon.cc
```

### Test 2: Merge a PR

1. Create a test PR to main
2. Merge the PR
3. Watch Actions tab: https://github.com/gpt153/openhorizon.cc/actions
4. Verify deployment succeeds
5. Check production sites:
   - Landing: https://openhorizon.cc
   - App: https://app.openhorizon.cc

## Workflow Triggers

The deployment workflow runs on:

1. **Push to main** - When you merge a PR
2. **Manual trigger** - When you click "Run workflow" in Actions tab

## Deployment Details

### What Gets Deployed

| Service | Source | Target URL | Resources |
|---------|--------|------------|-----------|
| openhorizon-landing | `/landing` | https://openhorizon.cc | 512Mi RAM, 1 CPU |
| openhorizon-app | `/app` | https://app.openhorizon.cc | 1Gi RAM, 1 CPU |

### Deployment Settings

- **Region:** europe-west1
- **Platform:** managed (fully managed Cloud Run)
- **Auth:** Allow unauthenticated
- **Timeout:** 60s (landing), 300s (app)
- **Scaling:** 0-10 instances
- **Traffic:** 100% to latest revision

## Troubleshooting

### Secret Not Found Error

```
Error: Secret GCP_SA_KEY not found
```

**Solution:** Re-add the secret following Step 2 above.

### Authentication Failed

```
Error: Unable to authenticate with Google Cloud
```

**Solution:**
1. Verify the service account key is valid
2. Check the service account has required roles
3. Regenerate the key if needed

### Deployment Failed

```
Error: Cloud Run deployment failed
```

**Solution:**
1. Check workflow logs in GitHub Actions
2. Verify GCP project ID is correct (openhorizon-cc)
3. Ensure Cloud Run API is enabled in GCP
4. Check service account has `roles/run.admin` permission

### Build Failed

```
Error: Build failed with exit code 1
```

**Solution:**
1. Check the application builds locally: `npm run build`
2. Review workflow logs for specific error
3. Fix build errors and push again

## Security Best Practices

### ✅ Do's

- Use service account keys (not user credentials)
- Grant minimal required permissions
- Rotate keys every 90 days
- Use GitHub secrets (never commit keys)
- Enable branch protection on main

### ❌ Don'ts

- Don't commit service account keys to git
- Don't share keys via email/slack
- Don't use overly permissive roles (avoid `roles/owner`)
- Don't store keys in plain text files

## Monitoring Deployments

### View Deployment Logs

```bash
# View workflow runs
gh run list --repo gpt153/openhorizon.cc --workflow=deploy-production.yml

# View specific run
gh run view <run-id> --repo gpt153/openhorizon.cc --log

# View Cloud Run logs
gcloud run logs read openhorizon-app --region=europe-west1 --limit=50
gcloud run logs read openhorizon-landing --region=europe-west1 --limit=50
```

### Check Service Status

```bash
# List services
gcloud run services list --region=europe-west1 --project=openhorizon-cc

# Describe service
gcloud run services describe openhorizon-app --region=europe-west1
gcloud run services describe openhorizon-landing --region=europe-west1
```

## Rollback Procedure

If a deployment breaks production:

```bash
# List revisions
gcloud run revisions list \
  --service=openhorizon-app \
  --region=europe-west1 \
  --project=openhorizon-cc

# Rollback to previous revision
gcloud run services update-traffic openhorizon-app \
  --to-revisions=openhorizon-app-00014-dxz=100 \
  --region=europe-west1 \
  --project=openhorizon-cc
```

## Next Steps

After setup is complete:

1. ✅ Add `GCP_SA_KEY` secret to GitHub
2. ✅ Test workflow with manual trigger
3. ✅ Merge a test PR to verify auto-deployment
4. ✅ Set up branch protection rules (optional)
5. ✅ Configure notifications for failed deployments (optional)

---

**Setup Status:**
- [ ] GitHub secret configured
- [ ] Workflow tested manually
- [ ] Auto-deployment verified via PR merge
- [ ] Rollback procedure tested
