# Deployment Guide - Google Cloud Run

## Architecture Overview

This project uses a **monorepo structure** with two separate Cloud Run services:

| Service | Domain | Purpose | Build Config |
|---------|--------|---------|--------------|
| `openhorizon-landing` | openhorizon.cc | Marketing landing page | cloudbuild-landing.yaml |
| `openhorizon-app` | app.openhorizon.cc | Full application | cloudbuild-app.yaml |

## Prerequisites

1. Google Cloud account with billing enabled
2. `gcloud` CLI installed and authenticated
3. DNS CNAME records configured:
   - `openhorizon.cc` → `ghs.googlehosted.com`
   - `app.openhorizon.cc` → `ghs.googlehosted.com`

## One-Time Setup

### 1. Initialize Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="open-horizon-prod"
export REGION="europe-west1"

# Create project (if new)
gcloud projects create $PROJECT_ID

# Set as active project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Create Production Environment File

Create a `.env.production` file with production secrets:

```bash
# Database
DATABASE_URL="your-production-supabase-url"
DIRECT_URL="your-production-supabase-url"

# Clerk (use LIVE keys, not TEST)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# Inngest (optional for production)
INNGEST_EVENT_KEY="your-event-key"
INNGEST_SIGNING_KEY="your-signing-key"

# App URL
NEXT_PUBLIC_APP_URL="https://app.openhorizon.cc"
```

## Deploy to Cloud Run

### Method 1: Automated CI/CD via GitHub Actions (Recommended)

The deployment is fully automated via GitHub Actions. When you push to `main`:

1. **Landing page** is deployed using Cloud Run's automatic build (`--source .`)
2. **Application** is built in GitHub Actions using Docker Buildx, then deployed

**GitHub Actions Workflow:**
- Builds Docker image in GitHub Actions (full build logs available)
- Pushes to Artifact Registry: `europe-west1-docker.pkg.dev/openhorizon-cc/cloud-run-source-deploy/`
- Deploys pre-built image to Cloud Run
- Runs health checks to verify deployment

**Benefits:**
- ✅ Full build visibility in GitHub Actions logs
- ✅ Build caching for faster deployments
- ✅ Automatic health checks
- ✅ No local build required

**Manual trigger:**
```bash
# Trigger deployment via GitHub Actions UI
# Go to Actions → Deploy to Production → Run workflow
```

### Method 2: Manual Deployment with Pre-Built Image

If you need to deploy manually:

```bash
# Set variables
export REGION="europe-west1"
export PROJECT_ID="openhorizon-cc"
export IMAGE_TAG=$(git rev-parse HEAD)

# Build the image locally
cd app
docker buildx build \
  --platform linux/amd64 \
  -t europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/openhorizon-app:$IMAGE_TAG \
  -f Dockerfile \
  .

# Push to Artifact Registry
gcloud auth configure-docker europe-west1-docker.pkg.dev
docker push europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/openhorizon-app:$IMAGE_TAG

# Deploy to Cloud Run
gcloud run deploy openhorizon-app \
  --image=europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/openhorizon-app:$IMAGE_TAG \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=10 \
  --min-instances=0 \
  --env-vars-file=env-app.yaml
```

### Method 3: Quick Deploy (Landing Page Only)

Landing page still uses Cloud Run's automatic build:

```bash
cd landing

gcloud run deploy openhorizon-landing \
  --source . \
  --region=$REGION \
  --allow-unauthenticated \
  --platform=managed \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60 \
  --max-instances=10 \
  --min-instances=0 \
  --env-vars-file=../env-landing.yaml
```

## Map Custom Domains

**IMPORTANT**: The root domain hosts the landing page, subdomain hosts the application.

```bash
# Map landing page to root domain
gcloud run domain-mappings create \
  --service=openhorizon-landing \
  --domain=openhorizon.cc \
  --region=$REGION

# Map application to subdomain
gcloud run domain-mappings create \
  --service=openhorizon-app \
  --domain=app.openhorizon.cc \
  --region=$REGION

# Verify domain ownership (follow prompts)
```

Or use the provided script:
```bash
./deploy-domain-mappings.sh
```

See `DEPLOY_INSTRUCTIONS.md` for detailed deployment steps.

## Configure Clerk Production Domain

1. Go to Clerk Dashboard → Your Application
2. Navigate to **Domains** section
3. Add domain: `app.openhorizon.cc`
4. Update allowed redirect URLs:
   - `https://app.openhorizon.cc`
   - `https://app.openhorizon.cc/sign-in`
   - `https://app.openhorizon.cc/sign-up`

## Set Up Inngest (Optional)

If using Inngest for background jobs:

1. Sign up at https://www.inngest.com
2. Create a production app
3. Get your event key and signing key
4. Add webhook URL in Inngest dashboard:
   - `https://app.openhorizon.cc/api/inngest`

Or run Inngest dev server locally and use ngrok for testing.

## Database Migration

Run Prisma migrations on production database:

```bash
# Set production database URL
export DATABASE_URL="your-production-supabase-url"

# Run migration
cd app
npx prisma migrate deploy

# Or use db push for quick sync
npx prisma db push
```

## Verify Deployment

1. Check Cloud Run service:
   ```bash
   gcloud run services describe open-horizon-app --region=$REGION
   ```

2. Test the application:
   ```bash
   curl https://app.openhorizon.cc
   ```

3. Check logs:
   ```bash
   gcloud run services logs read open-horizon-app --region=$REGION
   ```

## SSL Certificate

SSL is automatically provisioned by Google Cloud Run. It may take 15-30 minutes after domain mapping.

Check certificate status:
```bash
gcloud run domain-mappings describe \
  --domain=app.openhorizon.cc \
  --region=$REGION
```

## Monitoring & Scaling

### View Logs
```bash
# Real-time logs
gcloud run services logs tail open-horizon-app --region=$REGION

# Filter errors
gcloud run services logs read open-horizon-app \
  --region=$REGION \
  --filter="severity>=ERROR"
```

### Update Service Configuration
```bash
# Scale instances
gcloud run services update open-horizon-app \
  --region=$REGION \
  --min-instances=1 \
  --max-instances=20

# Increase memory
gcloud run services update open-horizon-app \
  --region=$REGION \
  --memory=2Gi
```

### Set Up Alerts (Optional)
```bash
# Create uptime check
gcloud monitoring uptime create https://app.openhorizon.cc

# Set up error rate alerts in Google Cloud Console
```

## Build Architecture

### Why GitHub-Based Builds?

Previously, deployment used `gcloud run deploy --source .` which triggered Cloud Run's automatic build system. This approach had limitations:

- ❌ Minimal error visibility (just "Build failed; check build logs")
- ❌ No control over build environment
- ❌ Difficult to debug failures
- ❌ No build artifacts or caching

**New approach uses Docker Buildx in GitHub Actions:**

- ✅ Full build logs visible in GitHub Actions
- ✅ Build caching for faster deployments (3-5 min → 1-2 min)
- ✅ Easy debugging with detailed error messages
- ✅ Reusable build artifacts in Artifact Registry
- ✅ Can test images before deploying

### Build Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Push to main branch                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. GitHub Actions Workflow Triggered                            │
├─────────────────────────────────────────────────────────────────┤
│   a. Checkout code                                              │
│   b. Authenticate to Google Cloud                               │
│   c. Setup Docker Buildx                                        │
│   d. Build Docker image (with layer caching)                    │
│      - Context: ./app                                           │
│      - Dockerfile: ./app/Dockerfile                             │
│      - Includes Prisma generation, Next.js build                │
│   e. Push to Artifact Registry                                  │
│      - europe-west1-docker.pkg.dev/.../openhorizon-app:SHA      │
│      - europe-west1-docker.pkg.dev/.../openhorizon-app:latest   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Deploy pre-built image to Cloud Run                          │
├─────────────────────────────────────────────────────────────────┤
│   - Use --image flag with specific SHA                          │
│   - Apply environment variables from env-app.yaml               │
│   - Configure memory, CPU, timeout settings                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Health check & verification                                  │
├─────────────────────────────────────────────────────────────────┤
│   - Wait 10 seconds for service to stabilize                    │
│   - Perform HTTP health check                                   │
│   - Show recent logs if health check fails                      │
└─────────────────────────────────────────────────────────────────┘
```

### Dockerfile Details

The `app/Dockerfile` uses a **multi-stage build** for optimal image size and security:

**Stage 1: deps** - Install npm dependencies
- Alpine Linux for minimal size
- Includes openssl and libc6-compat for Prisma

**Stage 2: builder** - Build the application
- Generate Prisma Client
- Build Next.js application with standalone output
- Uses dummy env vars for build-time (real env vars injected at runtime)

**Stage 3: runner** - Production runtime
- Copy only necessary files from builder
- Runs as non-root user (nextjs:nodejs)
- Minimal attack surface

### Debugging Build Failures

If a build fails in GitHub Actions:

1. **Check GitHub Actions logs**
   - Go to Actions tab in GitHub
   - Click on the failed workflow run
   - Expand "Build and Push Application Docker Image" step
   - Full build logs are visible with exact error

2. **Test build locally**
   ```bash
   cd app
   docker buildx build \
     --platform linux/amd64 \
     -t test-build \
     -f Dockerfile \
     .
   ```

3. **Common issues:**
   - Missing dependencies: Check `package.json`
   - Prisma errors: Ensure `prisma/schema.prisma` is valid
   - Next.js build errors: Check for TypeScript/ESLint errors
   - Out of memory: Increase GitHub Actions runner size

## Continuous Deployment (CI/CD)

The deployment workflow is defined in `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - id: 'auth'
        uses: 'google-github-actions/auth@v1'
        with:
          credentials_json: '${{ secrets.GCP_CREDENTIALS }}'

      - name: 'Set up Cloud SDK'
        uses: 'google-github-actions/setup-gcloud@v1'

      - name: 'Deploy to Cloud Run'
        run: |
          cd app
          gcloud run deploy open-horizon-app \
            --source . \
            --region=europe-west1 \
            --allow-unauthenticated
```

## Estimated Costs

- **Cloud Run**: ~$5-20/month (depends on traffic)
  - First 2 million requests free
  - $0.40 per million requests after
  - CPU: $0.00002400 per vCPU-second
  - Memory: $0.00000250 per GiB-second

- **Container Registry**: ~$0.02/GB/month for storage

- **Total estimated**: $10-30/month for moderate traffic

## Troubleshooting

### Container fails to start
```bash
# Check build logs
gcloud builds list --limit=5

# View container logs
gcloud run services logs read open-horizon-app --region=$REGION --limit=100
```

### Domain not accessible
- Verify DNS propagation: `nslookup app.openhorizon.cc`
- Check domain mapping status
- Wait for SSL certificate provisioning (15-30 min)

### Database connection issues
- Verify DATABASE_URL environment variable
- Check Supabase connection pooler settings
- Ensure service has network access to Supabase

### Out of memory errors
```bash
# Increase memory allocation
gcloud run services update open-horizon-app \
  --region=$REGION \
  --memory=2Gi
```

## Rollback

```bash
# List revisions
gcloud run revisions list --service=open-horizon-app --region=$REGION

# Rollback to specific revision
gcloud run services update-traffic open-horizon-app \
  --region=$REGION \
  --to-revisions=REVISION_NAME=100
```

## Security Best Practices

1. ✅ Use environment variables for secrets (never commit)
2. ✅ Enable Cloud Run service authentication for internal services
3. ✅ Use Clerk for user authentication
4. ✅ Keep dependencies updated
5. ✅ Enable Cloud Armor for DDoS protection (optional)
6. ✅ Set up Cloud IAM roles properly
7. ✅ Regular security audits with `npm audit`

## Support & Monitoring

- Cloud Run Dashboard: https://console.cloud.google.com/run
- Error Reporting: https://console.cloud.google.com/errors
- Cloud Monitoring: https://console.cloud.google.com/monitoring

---

**Ready to deploy!** 🚀

Run the deploy command and your app will be live at `https://app.openhorizon.cc`
