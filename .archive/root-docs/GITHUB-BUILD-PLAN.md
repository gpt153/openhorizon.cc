# Implementation Plan: GitHub-Based Container Builds for Cloud Run

## Executive Summary

**Question:** "Is it possible to build in GitHub instead of locally?"

**Answer:** Yes! Currently, the deployment uses `gcloud run deploy --source .` which triggers Cloud Run's automatic build system. We can move the build process to GitHub Actions using Docker, giving us better control, visibility, and debugging capabilities.

---

## Current State Analysis

### Current Deployment Flow
```
GitHub Actions → gcloud run deploy --source . → Cloud Run Automatic Build → Deploy
                                                        ↓
                                                   BUILD FAILS
                                                   (No detailed logs)
```

**Problems:**
1. **Black box building**: Cloud Run's automatic build system provides minimal error details
2. **Limited control**: Can't customize build environment, caching, or steps
3. **Monorepo challenges**: Building from `app/` subdirectory may confuse automatic build
4. **No build artifacts**: Can't inspect or reuse built images
5. **Difficult debugging**: Error is just "Build failed; check build logs" with no logs shown

### What Works
- Landing page deploys successfully (simpler, no Prisma)
- App Dockerfile exists and is well-structured
- December 26 deployment succeeded

### What Changed
- Last successful: December 26, 2025
- First failure: January 5, 2026
- Possible causes: dependency updates, Cloud Run build system changes, or configuration drift

---

## Proposed Solution: GitHub-Based Docker Builds

### New Deployment Flow
```
GitHub Actions → Build Docker Image → Push to Artifact Registry → Deploy to Cloud Run
                       ↓
                  Full build logs
                  Build cache
                  Testable image
```

**Benefits:**
1. ✅ **Full visibility**: Complete build logs in GitHub Actions
2. ✅ **Better caching**: GitHub Actions cache for faster builds
3. ✅ **Testable images**: Can test built image before deploying
4. ✅ **Reusable artifacts**: Built images stored in Artifact Registry
5. ✅ **Easier debugging**: See exactly where build fails
6. ✅ **Consistent environment**: Same build process locally and in CI

---

## Implementation Options

### Option 1: Docker Buildx with GitHub Actions (Recommended)

**Approach:**
- Use GitHub Actions to build Docker image using `docker/build-push-action`
- Push to Google Artifact Registry
- Deploy pre-built image to Cloud Run

**Workflow:**
```yaml
- Build Docker image in GitHub Actions
- Push to europe-west1-docker.pkg.dev
- Deploy to Cloud Run using --image flag
```

**Pros:**
- ✅ Most control over build process
- ✅ Can use GitHub Actions cache for dependencies
- ✅ Easy to test and debug
- ✅ Can build multi-platform images if needed
- ✅ Industry standard approach

**Cons:**
- ⚠️ Slightly longer initial setup
- ⚠️ Need to manage Artifact Registry permissions

**Estimated Implementation Time:** 2-3 hours

---

### Option 2: Cloud Build with GitHub Trigger

**Approach:**
- Create Cloud Build trigger on GitHub push
- Use existing `cloudbuild-app.yaml`
- Cloud Build builds and deploys automatically

**Workflow:**
```yaml
GitHub Push → Cloud Build Trigger → Build (cloudbuild-app.yaml) → Deploy
```

**Pros:**
- ✅ Leverages existing `cloudbuild-app.yaml`
- ✅ Fully integrated with Google Cloud
- ✅ Detailed Cloud Build logs

**Cons:**
- ⚠️ Requires Cloud Build trigger setup
- ⚠️ Build happens outside GitHub Actions (less visibility in GitHub)
- ⚠️ Two parallel CI systems (GitHub Actions + Cloud Build)

**Estimated Implementation Time:** 1-2 hours

---

### Option 3: Hybrid Approach

**Approach:**
- Build in GitHub Actions with Buildx
- Use `gcloud builds submit` to push to Cloud Build
- Deploy with Cloud Run

**Pros:**
- ✅ Combines benefits of both
- ✅ Uses GitHub for orchestration, GCP for builds

**Cons:**
- ⚠️ Most complex setup
- ⚠️ Potential confusion on where builds happen

**Estimated Implementation Time:** 3-4 hours

---

## Recommended Solution: Option 1 (Docker Buildx)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ GitHub Actions Workflow                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Checkout code                                               │
│  2. Authenticate to Google Cloud                                │
│  3. Setup Docker Buildx                                         │
│  4. Build Docker image (with layer caching)                     │
│     - Context: ./app                                            │
│     - Dockerfile: ./app/Dockerfile                              │
│     - Build args for Prisma, env vars                           │
│  5. Push to Artifact Registry                                   │
│     - europe-west1-docker.pkg.dev/openhorizon-cc/app/...        │
│  6. Deploy to Cloud Run                                         │
│     - Use --image flag with pre-built image                     │
│  7. Run post-deployment tests                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Step 1: Set Up Artifact Registry

```bash
# Create Artifact Registry repository (one-time setup)
gcloud artifacts repositories create cloud-run-app \
  --repository-format=docker \
  --location=europe-west1 \
  --description="Docker images for Cloud Run app"

# Grant Cloud Run service account access
gcloud artifacts repositories add-iam-policy-binding cloud-run-app \
  --location=europe-west1 \
  --member="serviceAccount:<compute-service-account>@openhorizon-cc.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```

#### Step 2: Update GitHub Actions Workflow

Replace the "Deploy Application" step with:

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Configure Docker for Google Artifact Registry
  run: |
    gcloud auth configure-docker europe-west1-docker.pkg.dev

- name: Build and Push Docker Image
  uses: docker/build-push-action@v5
  with:
    context: ./app
    file: ./app/Dockerfile
    push: true
    tags: |
      europe-west1-docker.pkg.dev/openhorizon-cc/cloud-run-app/openhorizon-app:${{ github.sha }}
      europe-west1-docker.pkg.dev/openhorizon-cc/cloud-run-app/openhorizon-app:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
    build-args: |
      NODE_ENV=production

- name: Deploy to Cloud Run
  run: |
    gcloud run deploy openhorizon-app \
      --image=europe-west1-docker.pkg.dev/openhorizon-cc/cloud-run-app/openhorizon-app:${{ github.sha }} \
      --region=europe-west1 \
      --platform=managed \
      --allow-unauthenticated \
      --memory=1Gi \
      --cpu=1 \
      --timeout=300 \
      --max-instances=10 \
      --min-instances=0 \
      --env-vars-file=env-app.yaml \
      --quiet

- name: Verify Deployment
  run: |
    echo "✅ Deployment complete!"
    gcloud run services describe openhorizon-app \
      --region=europe-west1 \
      --format='value(status.url)'
```

#### Step 3: Test the Build Locally (Optional)

Before deploying, test the build locally:

```bash
cd app

# Build the image
docker buildx build \
  --platform linux/amd64 \
  -t openhorizon-app:test \
  -f Dockerfile \
  .

# Test the built image
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-key" \
  openhorizon-app:test
```

#### Step 4: Update Deployment Documentation

Update `DEPLOYMENT.md` to reflect new build process.

---

## Additional Improvements

### 1. Build Matrix for Parallel Builds

Build landing and app in parallel:

```yaml
jobs:
  build-and-deploy:
    strategy:
      matrix:
        service: [landing, app]
    steps:
      - name: Build ${{ matrix.service }}
        # ...
```

### 2. Add Build Health Checks

```yaml
- name: Test Built Image
  run: |
    docker run -d --name test-app \
      -e DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy" \
      -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_dummy" \
      -e CLERK_SECRET_KEY="sk_test_dummy" \
      -p 3000:3000 \
      europe-west1-docker.pkg.dev/openhorizon-cc/cloud-run-app/openhorizon-app:${{ github.sha }}

    sleep 10
    curl http://localhost:3000/api/health || exit 1
    docker stop test-app
```

### 3. Image Scanning for Security

```yaml
- name: Scan Image for Vulnerabilities
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: europe-west1-docker.pkg.dev/openhorizon-cc/cloud-run-app/openhorizon-app:${{ github.sha }}
    format: 'sarif'
    output: 'trivy-results.sarif'
```

### 4. Rollback Strategy

```yaml
- name: Rollback on Failure
  if: failure()
  run: |
    # Deploy previous successful version
    gcloud run deploy openhorizon-app \
      --image=europe-west1-docker.pkg.dev/openhorizon-cc/cloud-run-app/openhorizon-app:latest-stable \
      --region=europe-west1
```

---

## Migration Plan

### Phase 1: Setup (No Downtime)
1. Create Artifact Registry repository
2. Configure IAM permissions
3. Test build locally

**Risk:** Low - No changes to production

### Phase 2: Update Workflow (Potential Downtime)
1. Update GitHub Actions workflow
2. Commit to feature branch
3. Test deployment from feature branch

**Risk:** Medium - First deployment with new process

### Phase 3: Validate (Production)
1. Deploy to production
2. Monitor deployment
3. Verify application functionality
4. Check logs and metrics

**Risk:** Medium - First production deployment

### Phase 4: Optimize (Post-Deployment)
1. Add caching
2. Add health checks
3. Add image scanning
4. Update documentation

**Risk:** Low - Incremental improvements

---

## Troubleshooting Guide

### Build Fails in GitHub Actions

**Symptoms:** Docker build fails during GitHub Actions workflow

**Debug Steps:**
1. Check GitHub Actions logs for exact error
2. Ensure Dockerfile exists in `app/Dockerfile`
3. Verify build context is set to `./app`
4. Check for missing dependencies in `package.json`

**Common Fixes:**
- Add missing build dependencies to Dockerfile
- Increase GitHub Actions timeout if build is slow
- Check Prisma generation step

### Image Push Fails

**Symptoms:** "Permission denied" or "Authentication failed" when pushing to Artifact Registry

**Debug Steps:**
1. Verify Artifact Registry repository exists
2. Check `gcloud auth configure-docker` was run
3. Verify service account has `artifactregistry.writer` role

**Common Fixes:**
```bash
# Re-authenticate Docker
gcloud auth configure-docker europe-west1-docker.pkg.dev

# Grant permissions
gcloud projects add-iam-policy-binding openhorizon-cc \
  --member="serviceAccount:<service-account>" \
  --role="roles/artifactregistry.writer"
```

### Deployment Succeeds but App Fails to Start

**Symptoms:** Cloud Run shows "Container failed to start"

**Debug Steps:**
1. Check Cloud Run logs
2. Verify environment variables are set
3. Test image locally with same env vars

**Common Fixes:**
- Add `--env-vars-file=env-app.yaml` to deploy command
- Ensure `PORT=3000` is set
- Check database connectivity

---

## Cost Analysis

### Current Setup
- Cloud Run automatic builds: Free (included in Cloud Run)
- Build time: ~3-5 minutes
- Storage: None

### New Setup
- Artifact Registry storage: ~$0.10/GB/month
  - Estimated: 500MB per image × 10 versions = 5GB = $0.50/month
- GitHub Actions build time: Included in free tier (2000 min/month)
- Cloud Run deployment: Same cost

**Total additional cost: ~$0.50-$2/month**

---

## Success Metrics

### Build Time
- **Current:** Unknown (Cloud Run automatic build)
- **Target:** < 5 minutes with caching

### Deployment Success Rate
- **Current:** Failing (0% since Jan 5)
- **Target:** > 95%

### Debugging Time
- **Current:** Hours (no detailed logs)
- **Target:** < 30 minutes (full GitHub Actions logs)

### Build Visibility
- **Current:** Black box
- **Target:** Full transparency with logs, caching, artifacts

---

## Decision Matrix

| Criteria | Current (--source) | Option 1 (Buildx) | Option 2 (Cloud Build) | Option 3 (Hybrid) |
|----------|-------------------|-------------------|------------------------|-------------------|
| **Visibility** | ❌ Poor | ✅ Excellent | ⚠️ Good | ⚠️ Good |
| **Debugging** | ❌ Very Hard | ✅ Easy | ⚠️ Moderate | ⚠️ Moderate |
| **Control** | ❌ Limited | ✅ Full | ⚠️ Good | ✅ Full |
| **Setup Complexity** | ✅ Simple | ⚠️ Moderate | ⚠️ Moderate | ❌ Complex |
| **Cost** | ✅ Free | ⚠️ ~$1/month | ⚠️ ~$2/month | ❌ ~$3/month |
| **Performance** | ⚠️ Unknown | ✅ Fast (cached) | ✅ Fast | ⚠️ Moderate |
| **CI Integration** | ✅ GitHub Actions | ✅ GitHub Actions | ⚠️ Split | ⚠️ Split |

**Recommendation: Option 1 (Docker Buildx)**

---

## Next Steps

### Immediate Actions (Issue #36)
1. ✅ Analyze current deployment setup
2. ✅ Create implementation plan
3. ⏳ Get user approval for approach
4. ⏳ Implement Docker Buildx workflow
5. ⏳ Test deployment
6. ⏳ Update documentation

### Follow-Up (Future Issues)
1. Add build health checks
2. Implement image scanning
3. Set up rollback automation
4. Optimize build caching
5. Add deployment notifications

---

## Questions for Review

Before proceeding with implementation:

1. **Preferred approach:** Do you prefer Option 1 (Docker Buildx), Option 2 (Cloud Build), or Option 3 (Hybrid)?
   - **Recommendation:** Option 1 for best visibility and control

2. **Artifact Registry:** Should we create a new repository or use existing `cloud-run-source-deploy`?
   - **Recommendation:** Use existing to minimize setup

3. **Testing strategy:** Test on staging environment first, or direct to production?
   - **Recommendation:** Test on feature branch first

4. **Rollback plan:** Automatic rollback on failure, or manual?
   - **Recommendation:** Start manual, automate later

5. **Image retention:** How many image versions to keep?
   - **Recommendation:** Keep last 10 versions

---

## Conclusion

**Yes, building in GitHub is not only possible but recommended.**

Moving from Cloud Run's automatic build system to GitHub-based Docker builds will:
- ✅ Provide full visibility into build failures
- ✅ Enable faster debugging with detailed logs
- ✅ Allow better caching for faster builds
- ✅ Give complete control over the build process
- ✅ Make the deployment process more maintainable

The recommended approach is **Option 1: Docker Buildx with GitHub Actions** for the best balance of control, visibility, and ease of use.

**Estimated implementation time:** 2-3 hours
**Risk level:** Low-Medium (testable in feature branch first)
**Additional cost:** ~$0.50-$2/month for Artifact Registry storage

Ready to proceed when you approve the approach! 🚀
