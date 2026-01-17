# Issue #19: Subdomain Routing Architecture Plan

## Executive Summary

**Question**: Should we split the landing page and application into separate repositories?

**Recommendation**: **No - Keep as a monorepo with separate deployment targets**

This document provides architectural analysis and implementation recommendations for fixing the subdomain routing issue while maintaining optimal development workflow.

---

## Current Architecture Analysis

### Repository Structure
```
openhorizon.cc/                    (Root repository)
├── app/                           (Next.js application - MAIN APP)
│   ├── src/                       (Application source code)
│   ├── prisma/                    (Database schema)
│   ├── Dockerfile                 (App container definition)
│   └── package.json               (App dependencies)
├── cloudbuild.yaml                (Cloud Build config - deploys app)
├── env.yaml                       (Production environment variables)
└── README.md                      (General project docs)
```

### Current Deployment State
- **Domain Mapping**: `openhorizon-app` service → `openhorizon.cc` (ROOT - WRONG)
- **Expected Mapping**:
  - `openhorizon-app` → `app.openhorizon.cc` (APPLICATION)
  - Landing page service → `openhorizon.cc` (MARKETING)

### Current Cloud Build Pipeline
- Builds from `app/Dockerfile`
- Deploys to Cloud Run service `openhorizon-app`
- Uses `env.yaml` for environment configuration
- Auto-deploys on push to main branch

---

## Architectural Options Evaluation

### Option 1: Separate Repositories (Multi-Repo)
**Structure**:
```
openhorizon-landing/          (NEW REPO)
└── Simple Next.js static site

openhorizon-app/              (EXISTING REPO, renamed)
└── Current application code
```

**Pros**:
- ✅ Clear separation of concerns
- ✅ Independent versioning
- ✅ Separate access control (if needed for teams)
- ✅ Different deployment cadences

**Cons**:
- ❌ Duplicate development setup (Node.js, Next.js configs)
- ❌ Two CI/CD pipelines to maintain
- ❌ Shared components harder to sync (logo, brand assets)
- ❌ Two dependency trees to keep updated
- ❌ More complex local development setup
- ❌ Harder to share TypeScript types, utilities
- ❌ More GitHub Actions minutes consumed

**When This Makes Sense**:
- Large teams with separate ownership
- Very different tech stacks (e.g., React vs WordPress)
- Completely independent release cycles
- Different security/compliance requirements

---

### Option 2: Monorepo with Separate Deployments (RECOMMENDED)
**Structure**:
```
openhorizon.cc/                    (Single repository)
├── landing/                       (NEW: Marketing site)
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── next.config.ts
├── app/                           (EXISTING: Application)
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   └── package.json
├── shared/                        (OPTIONAL: Shared code)
│   ├── components/                (Common UI components)
│   ├── assets/                    (Brand assets, logos)
│   └── types/                     (Shared TypeScript types)
├── cloudbuild-landing.yaml        (NEW: Landing page build)
├── cloudbuild-app.yaml            (RENAME: App build)
├── env-landing.yaml               (NEW: Landing env vars)
├── env-app.yaml                   (RENAME: Current env.yaml)
└── package.json                   (Root workspace config)
```

**Pros**:
- ✅ Shared tooling and configs (ESLint, Prettier, TypeScript)
- ✅ Easy to share components, types, and utilities
- ✅ Single git history and issue tracking
- ✅ Simpler local development (one clone, one setup)
- ✅ Can use npm/yarn workspaces for dependency management
- ✅ Atomic commits across both landing and app
- ✅ Single CI/CD pipeline with conditional builds
- ✅ Easier to maintain consistency (branding, dependencies)

**Cons**:
- ⚠️ Slightly more complex build configuration
- ⚠️ Need to configure selective deployments (only build what changed)
- ⚠️ Larger repository size (but minimal - both are Next.js)

**Why This Is Better For This Project**:
1. **Small team/solo developer**: No need for repo separation overhead
2. **Same tech stack**: Both are Next.js apps - shared configs make sense
3. **Shared branding**: Landing page and app share logo, colors, fonts
4. **Frequent updates**: Easy to update both when making brand changes
5. **Cost efficient**: Single CI/CD pipeline, fewer build minutes

---

### Option 3: Static Landing in Cloud Storage
**Structure**:
```
openhorizon.cc/                    (Single repository)
├── landing/                       (Static HTML/CSS/JS)
│   ├── index.html
│   ├── styles.css
│   └── assets/
├── app/                           (Next.js application)
└── deploy-landing.sh              (Upload to GCS bucket)
```

**Deployment**:
- Landing page: Google Cloud Storage + CDN
- Application: Cloud Run

**Pros**:
- ✅ Cheapest option ($0.01/GB/month for storage)
- ✅ Fastest loading (no server rendering)
- ✅ Infinite scalability
- ✅ Simple deployment (just upload files)

**Cons**:
- ❌ No server-side features (forms need external service)
- ❌ No dynamic content
- ❌ More setup for HTTPS/CDN
- ❌ Different deployment process than app

**When This Makes Sense**:
- Truly static landing page (no forms, no dynamic data)
- Cost is a major concern
- Extremely high traffic expected

---

## Recommendation: Option 2 (Monorepo)

### Why Monorepo Is Best For This Project

1. **Development Efficiency**
   - One codebase to clone, one setup to run
   - Shared ESLint/Prettier/TypeScript configs
   - Share UI components (buttons, headers, footers)
   - Single source of truth for brand assets

2. **Deployment Simplicity**
   - Two Cloud Build configs, but same workflow
   - Easy to deploy both together when needed
   - Conditional deployment: only build what changed
   - Same environment variable pattern

3. **Maintenance**
   - Update Next.js version once, applies to both
   - Security patches applied consistently
   - Brand updates synchronized automatically
   - Single dependency audit

4. **Cost**
   - Fewer CI/CD pipeline minutes
   - No code duplication
   - Shared node_modules in monorepo workspace

5. **Future Flexibility**
   - Easy to add a `docs/` folder for documentation site
   - Can add a `blog/` for content marketing
   - Admin panel could be another folder
   - Mobile app could share types/utilities

---

## Implementation Plan

### Phase 1: Repository Restructuring

#### 1.1 Create Landing Page Folder
```bash
mkdir -p landing/src/app landing/public
```

#### 1.2 Initialize Landing Page
```bash
cd landing
npm init -y
npm install next@^15.1.0 react@^19.0.0 react-dom@^19.0.0
npm install -D @types/node @types/react @types/react-dom typescript tailwindcss autoprefixer postcss
```

#### 1.3 Create Landing Page Structure
Files to create:
- `landing/package.json` - Dependencies
- `landing/next.config.ts` - Next.js config (static export)
- `landing/tsconfig.json` - TypeScript config
- `landing/tailwind.config.ts` - Tailwind config
- `landing/Dockerfile` - Container for Cloud Run
- `landing/src/app/layout.tsx` - Root layout
- `landing/src/app/page.tsx` - Homepage (marketing content)

#### 1.4 Configure Root Workspace (Optional but Recommended)
```json
// Root package.json
{
  "name": "openhorizon-monorepo",
  "private": true,
  "workspaces": [
    "landing",
    "app"
  ],
  "scripts": {
    "dev:landing": "npm run dev --workspace=landing",
    "dev:app": "npm run dev --workspace=app",
    "build:landing": "npm run build --workspace=landing",
    "build:app": "npm run build --workspace=app"
  }
}
```

---

### Phase 2: Cloud Build Configuration

#### 2.1 Rename Existing Cloud Build
```bash
mv cloudbuild.yaml cloudbuild-app.yaml
mv env.yaml env-app.yaml
```

#### 2.2 Update `cloudbuild-app.yaml`
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/openhorizon-app:$COMMIT_SHA'
      - '-f'
      - 'app/Dockerfile'
      - 'app'
    id: 'build-app-image'

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/openhorizon-app:$COMMIT_SHA'
    id: 'push-app-image'

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'openhorizon-app'
      - '--image=europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/openhorizon-app:$COMMIT_SHA'
      - '--region=europe-west1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--env-vars-file=env-app.yaml'
    id: 'deploy-app'

images:
  - 'europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/openhorizon-app:$COMMIT_SHA'

timeout: '600s'
```

#### 2.3 Create `cloudbuild-landing.yaml`
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/openhorizon-landing:$COMMIT_SHA'
      - '-f'
      - 'landing/Dockerfile'
      - 'landing'
    id: 'build-landing-image'

  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/openhorizon-landing:$COMMIT_SHA'
    id: 'push-landing-image'

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'openhorizon-landing'
      - '--image=europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/openhorizon-landing:$COMMIT_SHA'
      - '--region=europe-west1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--env-vars-file=env-landing.yaml'
    id: 'deploy-landing'

images:
  - 'europe-west1-docker.pkg.dev/$PROJECT_ID/cloud-run-source-deploy/openhorizon-landing:$COMMIT_SHA'

timeout: '600s'
```

#### 2.4 Create `env-landing.yaml`
```yaml
NODE_ENV: "production"
NEXT_PUBLIC_APP_URL: "https://app.openhorizon.cc"
NEXT_TELEMETRY_DISABLED: "1"
```

---

### Phase 3: Cloud Build Triggers

#### 3.1 Update Existing Trigger (Application)
```bash
# This trigger already exists, update it to use new file
gcloud builds triggers update <TRIGGER_ID> \
  --build-config=cloudbuild-app.yaml \
  --included-files="app/**" \
  --description="Deploy application to app.openhorizon.cc"
```

#### 3.2 Create New Trigger (Landing Page)
```bash
gcloud builds triggers create github \
  --repo-name=openhorizon.cc \
  --repo-owner=<YOUR_GITHUB_USERNAME> \
  --branch-pattern="^main$" \
  --build-config=cloudbuild-landing.yaml \
  --included-files="landing/**" \
  --description="Deploy landing page to openhorizon.cc"
```

**Smart Deployment**: Each trigger only runs when its folder changes:
- Changes to `app/**` → Deploy application
- Changes to `landing/**` → Deploy landing page
- Changes to both → Deploy both

---

### Phase 4: Domain Mapping Correction

#### 4.1 Remove Incorrect Mapping
```bash
# Find current domain mapping
gcloud run domain-mappings list --region=europe-west1

# Delete wrong mapping
gcloud run domain-mappings delete \
  --domain=openhorizon.cc \
  --region=europe-west1
```

#### 4.2 Map Application to Subdomain
```bash
gcloud run domain-mappings create \
  --service=openhorizon-app \
  --domain=app.openhorizon.cc \
  --region=europe-west1
```

#### 4.3 Map Landing Page to Root Domain
```bash
gcloud run domain-mappings create \
  --service=openhorizon-landing \
  --domain=openhorizon.cc \
  --region=europe-west1
```

#### 4.4 Verify DNS Records
```bash
# Check DNS propagation
nslookup openhorizon.cc
nslookup app.openhorizon.cc
```

Required DNS records:
```
openhorizon.cc          → A/AAAA or CNAME to ghs.googlehosted.com
app.openhorizon.cc      → CNAME to ghs.googlehosted.com
```

---

### Phase 5: Landing Page Content

#### 5.1 Marketing Content Structure
```typescript
// landing/src/app/page.tsx
export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <h1>Empowering Youth Through Erasmus+</h1>
        <p>Creating meaningful international opportunities</p>
        <a href="https://app.openhorizon.cc">Get Started →</a>
      </section>

      {/* Features Section */}
      <section className="features">
        {/* Youth Exchanges, Training, Support, etc. */}
      </section>

      {/* How It Works */}
      <section className="process">
        {/* Step-by-step process */}
      </section>

      {/* CTA Section */}
      <section className="cta">
        <a href="https://app.openhorizon.cc/sign-up">Start Your Project</a>
      </section>

      {/* Footer */}
      <footer>
        {/* EU compliance, contact info */}
      </footer>
    </>
  );
}
```

#### 5.2 Key Links
All CTAs and buttons link to:
- Sign up: `https://app.openhorizon.cc/sign-up`
- Login: `https://app.openhorizon.cc/sign-in`
- Dashboard: `https://app.openhorizon.cc/dashboard`

---

### Phase 6: Testing & Validation

#### 6.1 Local Testing
```bash
# Terminal 1: Run landing page
cd landing && npm run dev
# Opens on http://localhost:3000

# Terminal 2: Run application
cd app && npm run dev
# Opens on http://localhost:3001
```

#### 6.2 Production Testing Checklist
- [ ] `https://openhorizon.cc` shows landing page
- [ ] `https://app.openhorizon.cc` shows application
- [ ] All links from landing → app work correctly
- [ ] SSL certificates provisioned for both domains
- [ ] Authentication flow works on app subdomain
- [ ] Landing page loads in <1 second
- [ ] Application dashboard accessible after login
- [ ] Mobile responsive on both sites
- [ ] EU compliance footer displays correctly

#### 6.3 Playwright Toggle Testing (Issue #15)
Ensure Playwright tests work on both domains:
```typescript
// Test against correct domains
const LANDING_URL = 'https://openhorizon.cc';
const APP_URL = 'https://app.openhorizon.cc';
```

---

## Cost Impact Analysis

### Current Cost (Single Service)
- Cloud Run: ~$5-10/month
- Total: ~$5-10/month

### New Cost (Two Services - Monorepo)
- Cloud Run (Landing): ~$2-5/month (mostly static, low traffic)
- Cloud Run (App): ~$5-10/month (same as before)
- Cloud Build: ~$0-5/month (still within free tier, 120 builds/day)
- Total: ~$7-20/month

**Cost Increase**: Minimal (~$2-10/month)

### Alternative Cost (Separate Repos)
- Cloud Run (Landing): ~$2-5/month
- Cloud Run (App): ~$5-10/month
- Cloud Build: ~$5-10/month (double CI/CD usage)
- GitHub Actions: Potential extra minutes
- Total: ~$12-25/month

**Monorepo saves ~$5-10/month vs separate repos**

---

## Migration Steps (Chronological)

### Week 1: Setup
1. ✅ Create `landing/` folder structure
2. ✅ Initialize landing page as Next.js app
3. ✅ Configure root workspace (optional)
4. ✅ Create `landing/Dockerfile`
5. ✅ Test landing page locally

### Week 2: Cloud Build
1. ✅ Rename `cloudbuild.yaml` → `cloudbuild-app.yaml`
2. ✅ Create `cloudbuild-landing.yaml`
3. ✅ Rename `env.yaml` → `env-app.yaml`
4. ✅ Create `env-landing.yaml`
5. ✅ Test builds locally with Docker

### Week 3: Deployment
1. ✅ Deploy landing page to new Cloud Run service
2. ✅ Fix domain mappings (remove old, add new)
3. ✅ Verify DNS propagation
4. ✅ Test both domains
5. ✅ Monitor logs for errors

### Week 4: Optimization
1. ✅ Set up selective Cloud Build triggers
2. ✅ Optimize landing page performance
3. ✅ Add monitoring and alerts
4. ✅ Update documentation
5. ✅ Close issue #19

---

## Documentation Updates Required

### README.md
Update project structure section:
```markdown
## Project Structure

This is a monorepo containing:
- **landing/**: Marketing site (openhorizon.cc)
- **app/**: Application (app.openhorizon.cc)

### Development
- Landing: `npm run dev:landing`
- App: `npm run dev:app`

### Deployment
- Landing: Auto-deploys on changes to `landing/**`
- App: Auto-deploys on changes to `app/**`
```

### DEPLOYMENT.md
Add section:
```markdown
## Domain Structure

- **openhorizon.cc**: Marketing landing page (Cloud Run: openhorizon-landing)
- **app.openhorizon.cc**: Full application (Cloud Run: openhorizon-app)

Both services deploy automatically via Cloud Build triggers.
```

---

## Risk Mitigation

### Risk 1: DNS Propagation Delay
- **Impact**: Sites unreachable during transition
- **Mitigation**:
  - Perform migration during low-traffic period
  - Keep old mapping until new one is verified
  - Set low TTL on DNS records before change

### Risk 2: Authentication Break
- **Impact**: Users can't log in during transition
- **Mitigation**:
  - Update Clerk domain settings BEFORE deployment
  - Test authentication in staging environment
  - Have rollback plan ready

### Risk 3: Build Pipeline Failure
- **Impact**: Deployments fail after restructure
- **Mitigation**:
  - Test builds locally first
  - Deploy landing page first (lower risk)
  - Keep old `cloudbuild.yaml` as backup

### Risk 4: SEO Impact
- **Impact**: Google loses root domain ranking
- **Mitigation**:
  - Keep same content on root domain (just move to landing page)
  - Add proper meta tags and structured data
  - Submit new sitemap to Google Search Console

---

## Success Metrics

### Technical Metrics
- [ ] Both domains resolve correctly
- [ ] SSL certificates valid on both
- [ ] Page load time <2s on both
- [ ] No authentication errors
- [ ] Zero downtime during migration

### Business Metrics
- [ ] Partners can find landing page easily
- [ ] Clear separation between marketing and app
- [ ] Proper branding and messaging on landing
- [ ] Conversion path from landing → app works

---

## Future Considerations

### Shared Component Library
Once monorepo is established, consider:
```
shared/
├── components/
│   ├── Button.tsx          (Shared UI components)
│   ├── Header.tsx
│   └── Footer.tsx
├── assets/
│   ├── logo.svg            (Brand assets)
│   └── fonts/
└── types/
    └── common.ts           (Shared TypeScript types)
```

Both `landing` and `app` can import from `shared/`:
```typescript
import { Button } from '@/shared/components/Button';
```

### Additional Services
Easy to add in the future:
- `docs/` - Documentation site
- `blog/` - Content marketing blog
- `admin/` - Admin panel
- `api/` - Standalone API service

All in the same monorepo!

---

## Conclusion

**Recommendation**: Implement **Option 2 (Monorepo with Separate Deployments)**

### Why This Is Right
1. ✅ Same tech stack (Next.js) - no duplication needed
2. ✅ Small team - monorepo overhead is minimal
3. ✅ Shared branding - easy to keep consistent
4. ✅ Lower costs - single CI/CD pipeline
5. ✅ Better DX - one clone, one setup
6. ✅ Future-proof - easy to add more services

### Implementation Effort
- **Estimated Time**: 2-3 days
- **Risk Level**: Low (gradual migration possible)
- **Cost Impact**: Minimal (~$2-5/month increase)

### Next Steps
1. Create `landing/` folder with Next.js setup
2. Build and test landing page locally
3. Create Cloud Build configs
4. Deploy landing page to new service
5. Fix domain mappings
6. Test and validate both domains
7. Update documentation
8. Monitor for issues

---

**Question Answered**: No, we should NOT split into separate repos. A monorepo with separate deployment targets is the optimal solution for this project.
