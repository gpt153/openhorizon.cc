# Google Cloud Run Deployment Guide

## Overview

Google Cloud Run deployment for Open Horizon Project Companion Next.js application.

**Benefits of Cloud Run**:
- Fully managed serverless containers
- Auto-scaling (0 to N instances)
- Pay only for actual usage
- Supports WebSockets (for Supabase Realtime)
- Custom domains with SSL
- CI/CD with Cloud Build

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  app.openhorizon.cc (Custom Domain)         │
└─────────────┬───────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│  Google Cloud Load Balancer (HTTPS)         │
└─────────────┬───────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────┐
│  Cloud Run Service: open-horizon-app        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                              │
│  Container: Next.js 14 App                   │
│  • Frontend (React Server Components)        │
│  • API Routes (tRPC)                         │
│  • Clerk Authentication                      │
│  • OpenAI Integration                        │
│                                              │
│  Resources:                                  │
│  • CPU: 1-2 vCPU                             │
│  • Memory: 512MB - 2GB                       │
│  • Concurrency: 80 requests/instance         │
│  • Min Instances: 0 (cost savings)           │
│  • Max Instances: 10 (initial)               │
│                                              │
└───────────┬────────────────┬────────────────┘
            │                │
            ↓                ↓
    ┌───────────────┐  ┌──────────────┐
    │  Supabase     │  │  Clerk       │
    │  PostgreSQL   │  │  Auth        │
    │  + pgvector   │  │              │
    └───────────────┘  └──────────────┘
```

---

## Prerequisites

1. **Google Cloud Project**
   ```bash
   gcloud projects create open-horizon-prod --name="Open Horizon Production"
   gcloud config set project open-horizon-prod
   ```

2. **Enable Required APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

3. **Install gcloud SDK**
   - https://cloud.google.com/sdk/docs/install

4. **Authenticate**
   ```bash
   gcloud auth login
   gcloud auth configure-docker
   ```

---

## Project Setup

### 1. Create Dockerfile

```dockerfile
# Dockerfile

# Use Node.js 20 Alpine
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment to production
ENV NODE_ENV production

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

# Start Next.js
CMD ["node", "server.js"]
```

### 2. Update next.config.js

```javascript
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Cloud Run uses port from PORT env var
  serverRuntimeConfig: {
    port: process.env.PORT || 3000,
  },

  // Trust Cloud Run proxy headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### 3. Create .dockerignore

```
# .dockerignore

node_modules
.next
.git
.env.local
.env*.local
*.md
.vscode
.idea
.DS_Store
```

### 4. Create cloudbuild.yaml (CI/CD)

```yaml
# cloudbuild.yaml

steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/open-horizon-app:$COMMIT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/open-horizon-app:latest'
      - '.'

  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/open-horizon-app:$COMMIT_SHA'

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'open-horizon-app'
      - '--image'
      - 'gcr.io/$PROJECT_ID/open-horizon-app:$COMMIT_SHA'
      - '--region'
      - 'europe-north1'  # Stockholm region
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--max-instances'
      - '10'
      - '--memory'
      - '1Gi'
      - '--cpu'
      - '1'
      - '--set-env-vars'
      - 'NODE_ENV=production'
      - '--set-secrets'
      - 'DATABASE_URL=database-url:latest,CLERK_SECRET_KEY=clerk-secret:latest,OPENAI_API_KEY=openai-key:latest'

images:
  - 'gcr.io/$PROJECT_ID/open-horizon-app:$COMMIT_SHA'
  - 'gcr.io/$PROJECT_ID/open-horizon-app:latest'

options:
  machineType: 'N1_HIGHCPU_8'
  timeout: '1200s'
```

---

## Environment Variables & Secrets

### 1. Store Secrets in Secret Manager

```bash
# Database URL (Supabase)
echo -n "postgresql://..." | gcloud secrets create database-url --data-file=-

# Clerk Secret Key
echo -n "sk_..." | gcloud secrets create clerk-secret --data-file=-

# OpenAI API Key
echo -n "sk-..." | gcloud secrets create openai-key --data-file=-

# Supabase Service Role Key
echo -n "..." | gcloud secrets create supabase-service-key --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding database-url \
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Repeat for each secret
```

### 2. Public Environment Variables

Create `.env.production`:

```bash
# .env.production (not sensitive, can be in repo)

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

NODE_ENV=production
```

---

## Deployment

### Manual Deployment (Initial)

```bash
# Build and deploy
gcloud builds submit --config cloudbuild.yaml

# Or build locally and deploy
docker build -t gcr.io/open-horizon-prod/open-horizon-app:latest .
docker push gcr.io/open-horizon-prod/open-horizon-app:latest

gcloud run deploy open-horizon-app \
  --image gcr.io/open-horizon-prod/open-horizon-app:latest \
  --region europe-north1 \
  --platform managed \
  --allow-unauthenticated \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=database-url:latest,CLERK_SECRET_KEY=clerk-secret:latest,OPENAI_API_KEY=openai-key:latest
```

### Automated Deployment (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

env:
  PROJECT_ID: open-horizon-prod
  SERVICE_NAME: open-horizon-app
  REGION: europe-north1

jobs:
  deploy:
    runs-on: ubuntu-latest

    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker
        run: gcloud auth configure-docker

      - name: Build and Push Docker image
        run: |
          docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA .
          docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image gcr.io/$PROJECT_ID/$SERVICE_NAME:$GITHUB_SHA \
            --region $REGION \
            --platform managed \
            --allow-unauthenticated \
            --max-instances 10 \
            --memory 1Gi \
            --cpu 1 \
            --set-env-vars NODE_ENV=production \
            --set-secrets DATABASE_URL=database-url:latest,CLERK_SECRET_KEY=clerk-secret:latest,OPENAI_API_KEY=openai-key:latest

      - name: Get Service URL
        run: |
          SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
          echo "Deployed to: $SERVICE_URL"
```

---

## Custom Domain Setup

### 1. Map Domain to Cloud Run

```bash
# Map app.openhorizon.cc to Cloud Run service
gcloud run domain-mappings create \
  --service open-horizon-app \
  --domain app.openhorizon.cc \
  --region europe-north1
```

### 2. Update DNS (Your Domain Registrar)

Cloud Run will provide DNS records. Add to your domain:

```
Type: CNAME
Name: app
Value: ghs.googlehosted.com
```

Or use A and AAAA records if provided.

### 3. SSL Certificate

Cloud Run automatically provisions SSL certificate via Google-managed certificates. Takes ~15 minutes.

---

## Monitoring & Logging

### 1. View Logs

```bash
# Real-time logs
gcloud run services logs tail open-horizon-app --region europe-north1

# Recent logs
gcloud run services logs read open-horizon-app --region europe-north1 --limit 100
```

### 2. Cloud Monitoring Dashboard

Navigate to: https://console.cloud.google.com/run

Metrics available:
- Request count
- Request latency
- Container instances
- CPU utilization
- Memory usage
- Error rate

### 3. Set Up Alerts

```bash
# Example: Alert when error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

---

## Cost Optimization

### Free Tier (Always Free)

- 2 million requests/month
- 360,000 GB-seconds of memory
- 180,000 vCPU-seconds

### Estimated Costs (Beyond Free Tier)

For **<10 organizations, <100 users**:

**Scenario**: 10,000 requests/month, avg 500ms response time
- Requests: Free (within 2M limit)
- CPU: Free (within 180k vCPU-seconds)
- Memory: Free (within 360k GB-seconds)

**Scenario**: 100,000 requests/month, avg 1s response time
- Requests: Free (within 2M limit)
- CPU: ~$5/month
- Memory (1GB): ~$3/month
- **Total: ~$8/month**

**Much cheaper than Vercel** ($20/month Pro plan required for team features)

### Optimization Tips

1. **Min Instances = 0**: Scale to zero when idle (free)
2. **Memory**: Start with 512MB, increase if needed
3. **Concurrency**: Set to 80 (Cloud Run default)
4. **Request Timeout**: 60s for AI generation, 5s for normal requests
5. **Use CDN**: Cloud CDN for static assets (Next.js auto-optimizes)

---

## Health Checks & Startup

### Health Check Endpoint

```typescript
// app/api/health/route.ts

export async function GET() {
  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'open-horizon-app',
      version: process.env.npm_package_version
    })
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    )
  }
}
```

### Configure in Cloud Run

```bash
gcloud run services update open-horizon-app \
  --region europe-north1 \
  --startup-probe-http-path=/api/health \
  --startup-probe-initial-delay-seconds=10 \
  --startup-probe-period-seconds=5 \
  --startup-probe-timeout-seconds=3 \
  --startup-probe-failure-threshold=3
```

---

## Database Migrations on Deploy

### Run Migrations in Cloud Build

Add to `cloudbuild.yaml` before deploy step:

```yaml
# Run database migrations
- name: 'gcr.io/$PROJECT_ID/open-horizon-app:$COMMIT_SHA'
  entrypoint: 'sh'
  args:
    - '-c'
    - |
      npx prisma migrate deploy
  env:
    - 'DATABASE_URL=$$DATABASE_URL'
  secretEnv:
    - DATABASE_URL

availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/database-url/versions/latest
      env: DATABASE_URL
```

---

## Scaling Configuration

### Auto-Scaling Settings

```bash
gcloud run services update open-horizon-app \
  --region europe-north1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --cpu-throttling \
  --memory 1Gi \
  --cpu 1
```

**For Production (Higher Traffic)**:

```bash
gcloud run services update open-horizon-app \
  --region europe-north1 \
  --min-instances 1 \  # Always 1 instance warm (faster response)
  --max-instances 50 \
  --concurrency 80 \
  --memory 2Gi \
  --cpu 2
```

---

## Troubleshooting

### Common Issues

**1. "Service Unavailable" after deploy**
- Check logs: `gcloud run services logs tail open-horizon-app --region europe-north1`
- Verify environment variables/secrets set correctly
- Check health endpoint: `curl https://app.openhorizon.cc/api/health`

**2. "Cold start latency too high"**
- Set `--min-instances 1` to keep one instance warm
- Reduce Docker image size (use Alpine, multi-stage builds)
- Enable Clerk caching

**3. "Out of Memory"**
- Increase memory: `--memory 2Gi`
- Check for memory leaks in Next.js
- Use Node.js memory profiling

**4. "Secrets not accessible"**
- Verify IAM permissions for service account
- Check secret versions: `gcloud secrets versions list SECRET_NAME`
- Ensure secrets are in same project/region

---

## Summary

✅ **Deployment**: Google Cloud Run (fully managed, auto-scaling)
✅ **Region**: europe-north1 (Stockholm - closest to Sweden)
✅ **Cost**: ~$0-10/month for MVP (<100 users)
✅ **CI/CD**: GitHub Actions → Cloud Build → Cloud Run
✅ **Domain**: app.openhorizon.cc (custom domain with SSL)
✅ **Secrets**: Google Secret Manager (secure)
✅ **Monitoring**: Cloud Logging + Cloud Monitoring
✅ **Database**: Supabase PostgreSQL (external)
✅ **Auth**: Clerk (external SaaS)

**Advantages over Vercel**:
- Lower cost at scale
- Better control over infrastructure
- Supports WebSockets natively
- Integrates with GCP ecosystem
- No artificial limits on API routes

**Next Steps**:
1. Create GCP project
2. Set up secrets
3. Build Docker image
4. Deploy to Cloud Run
5. Configure custom domain
6. Set up CI/CD

---

**Status**: Ready for Cloud Run deployment
**Estimated Setup Time**: 2-3 hours (first time), 10 minutes (subsequent deploys)
