# Root Cause Analysis: Issue #21 - Domain Mapping Not Executed

**Date**: 2025-12-23
**Investigator**: SCAR Bot (Remote Agent)
**Issue**: [#21 - fix the fix with domain](https://github.com/gpt153/openhorizon.cc/issues/21)
**Related Issue**: [#19 - Fix subdomain routing](https://github.com/gpt153/openhorizon.cc/issues/19)

---

## Executive Summary

**Problem**: The live site `openhorizon.cc` is showing the application instead of the landing page, despite PR #20 merging code to fix this issue.

**Root Cause**: The **domain mappings were never executed**. PR #20 created the infrastructure (landing page, Cloud Build configs, deployment script) but the final step—running `deploy-domain-mappings.sh` to remap the domains—was not performed.

**Impact**: High. Customers and partners visiting `openhorizon.cc` see the application UI instead of a professional landing page, creating confusion and poor first impressions.

**Resolution**: Execute the `deploy-domain-mappings.sh` script to fix the Cloud Run domain mappings.

---

## Investigation Timeline

### Step 1: Reviewed Issue #19 Context

Issue #19 clearly defined the problem:
- **Current State (WRONG)**: `openhorizon.cc` → Full application, `app.openhorizon.cc` → Nothing
- **Desired State (CORRECT)**: `openhorizon.cc` → Landing page, `app.openhorizon.cc` → Application

The issue outlined the required actions:
1. ✅ Create/Restore Landing Page
2. ✅ Fix Cloud Build configs
3. ✅ Create deployment script
4. ❌ **Execute domain mapping changes** (NOT DONE)

### Step 2: Verified PR #20 Was Merged

PR #20 titled "Fix subdomain routing: Landing on root, app on subdomain" was merged via commit `5b6edb2`.

The PR included:
- ✅ `landing/` folder with Next.js marketing site
- ✅ Split Cloud Build configs (`cloudbuild-app.yaml`, `cloudbuild-landing.yaml`)
- ✅ Split environment configs (`env-app.yaml`, `env-landing.yaml`)
- ✅ `deploy-domain-mappings.sh` script
- ✅ `DEPLOY_INSTRUCTIONS.md` documentation

All code changes were properly implemented and merged to `main`.

### Step 3: Checked Infrastructure Files

Confirmed all necessary infrastructure exists:
```
landing/
├── src/app/page.tsx          ✅ Marketing landing page (complete)
├── Dockerfile                ✅ Cloud Run deployment config
├── package.json              ✅ Dependencies configured
cloudbuild-landing.yaml       ✅ Cloud Build config for landing
cloudbuild-app.yaml           ✅ Cloud Build config for app
env-landing.yaml              ✅ Environment variables for landing
env-app.yaml                  ✅ Environment variables for app
deploy-domain-mappings.sh     ✅ Domain mapping script (not executed)
DEPLOY_INSTRUCTIONS.md        ✅ Step-by-step deployment guide
```

### Step 4: Tested Live Sites

Used `curl` to test both domains:

**openhorizon.cc** (root domain):
```bash
$ curl -I https://openhorizon.cc
HTTP/2 307
location: /projects
x-powered-by: Next.js
```
Result: **Showing the app** (redirects to `/projects`)

**app.openhorizon.cc** (subdomain):
```bash
$ curl -I https://app.openhorizon.cc
HTTP/2 307
location: /projects
x-powered-by: Next.js
```
Result: **Also showing the app** (redirects to `/projects`)

Checked HTML content:
- Both domains serve identical HTML with "Projects", "Dashboard", "Brainstorm" navigation
- No landing page content ("Empowering Youth Through Erasmus+") appears
- Both show the application UI

### Step 5: Identified Root Cause

Compared the deployment instructions in `DEPLOY_INSTRUCTIONS.md` with what was actually done:

| Step | Task | Status |
|------|------|--------|
| 1 | Merge to main branch | ✅ DONE (commit 5b6edb2) |
| 2 | Wait for Cloud Build | ❓ UNKNOWN |
| 3 | Verify services running | ❓ UNKNOWN |
| 4 | **Run deploy-domain-mappings.sh** | ❌ **NOT DONE** |
| 5 | Verify DNS configuration | ❓ UNKNOWN |
| 6 | Wait for SSL provisioning | N/A (not reached) |
| 7 | Test both domains | ❌ FAILED (both show app) |

**Root Cause**: Step 4 was never executed. The domain mappings were never changed in Google Cloud Run.

---

## Root Cause Explanation

### What PR #20 Did
PR #20 prepared everything **except the final execution**:
1. Created the landing page code
2. Created separate Cloud Build configs
3. Created the deployment script
4. Documented the process

### What PR #20 Did NOT Do
PR #20 did **not** execute the domain mapping changes. This required a **manual step**:

```bash
./deploy-domain-mappings.sh
```

This script performs the critical operations:
```bash
# Remove incorrect mapping
gcloud run domain-mappings delete --domain=openhorizon.cc

# Map landing page to root domain
gcloud run domain-mappings create \
  --service=openhorizon-landing \
  --domain=openhorizon.cc

# Map application to subdomain
gcloud run domain-mappings create \
  --service=openhorizon-app \
  --domain=app.openhorizon.cc
```

### Why the Manual Step Was Needed

Cloud Build **cannot** modify domain mappings because:
1. Domain mappings are **infrastructure** changes, not code deployments
2. Require elevated GCP permissions beyond Cloud Build's scope
3. Could break production if automated without verification
4. Must be done after both services are deployed and verified

The script was intentionally designed to be **run manually** after reviewing the deployment.

---

## Current State Analysis

### Cloud Run Services (Assumed Based on Build Configs)

Based on `cloudbuild-app.yaml` and `cloudbuild-landing.yaml`:

**Service: openhorizon-app**
- Image: `europe-west1-docker.pkg.dev/open-horizon-prod/cloud-run-source-deploy/openhorizon:latest`
- Status: Likely RUNNING
- Contains: Full Next.js application

**Service: openhorizon-landing**
- Image: `europe-west1-docker.pkg.dev/open-horizon-prod/cloud-run-source-deploy/openhorizon-landing:latest`
- Status: Likely RUNNING or NOT DEPLOYED
- Contains: Marketing landing page

### Domain Mappings (Current - INCORRECT)

```
openhorizon.cc → openhorizon-app (WRONG)
app.openhorizon.cc → UNKNOWN (possibly also openhorizon-app)
```

### Domain Mappings (Desired - CORRECT)

```
openhorizon.cc → openhorizon-landing (marketing site)
app.openhorizon.cc → openhorizon-app (full application)
```

---

## Impact Assessment

### Business Impact
- **HIGH**: Potential partners and customers see application instead of marketing content
- Missed opportunity for professional first impression
- No clear value proposition or call-to-action for new visitors
- Potential confusion about what the product does

### Technical Impact
- **MEDIUM**: Code is ready, infrastructure exists, only domain routing is incorrect
- No security issues
- No data loss
- All functionality works (just on wrong domain)

### User Impact
- **HIGH**: Users trying to access the app may be confused
- Existing users might bookmark the wrong URL
- Authentication flows work but on incorrect domain

---

## Why This Happened

### Gap in Deployment Process

1. **Code merge happened** via pull request
2. **Deployment instructions existed** in DEPLOY_INSTRUCTIONS.md
3. **Manual step required** but was overlooked
4. **No automated reminder** to run the script
5. **No verification** that domain mappings were changed

### Contributing Factors

1. **Split responsibility**: Code changes (automated) vs. infrastructure changes (manual)
2. **Documentation buried**: DEPLOY_INSTRUCTIONS.md not prominently referenced in PR
3. **No checklist**: No clear "Done" criteria for the PR
4. **No monitoring**: No alert that openhorizon.cc still shows app
5. **Assumption**: May have assumed Cloud Build would handle everything

---

## Evidence

### Commit History
```
5b6edb2 - Fix subdomain routing: Landing on root, app on subdomain (#20)
  - Added landing page
  - Split Cloud Build configs
  - Created deploy-domain-mappings.sh
  - Added DEPLOY_INSTRUCTIONS.md
```

### File Existence Verification
```bash
$ ls -la landing/
✅ Landing page exists with complete marketing content

$ ls -la *.yaml
✅ cloudbuild-app.yaml
✅ cloudbuild-landing.yaml
✅ env-app.yaml
✅ env-landing.yaml

$ ls -la deploy-domain-mappings.sh
✅ -rwxr-xr-x deploy-domain-mappings.sh
```

### Live Site Testing
```bash
$ curl -sI https://openhorizon.cc | grep location
location: /projects  # ❌ This is an app route, not landing page

$ curl -sL https://openhorizon.cc | grep "Empowering Youth"
# ❌ No match - landing page content not served

$ curl -sL https://openhorizon.cc | grep "Projects"
# ✅ Match found - app is being served
```

---

## Resolution Steps

### Immediate Fix (Required)

1. **Verify both Cloud Run services are deployed**
   ```bash
   gcloud run services list --region=europe-west1 --project=open-horizon-prod
   ```

2. **Run the domain mapping script**
   ```bash
   cd /worktrees/openhorizon.cc/issue-21
   ./deploy-domain-mappings.sh
   ```

3. **Wait for SSL provisioning** (15-30 minutes)

4. **Test both domains**
   ```bash
   curl -I https://openhorizon.cc  # Should show landing page
   curl -I https://app.openhorizon.cc  # Should show app
   ```

### Verification Checklist

After running the script:

- [ ] `openhorizon.cc` shows landing page with "Empowering Youth Through Erasmus+"
- [ ] `app.openhorizon.cc` shows application with "Projects" page
- [ ] Both domains have valid SSL certificates
- [ ] Landing page CTAs link to `app.openhorizon.cc`
- [ ] Authentication flows work on `app.openhorizon.cc`
- [ ] No console errors on either domain

### If Script Fails

Manually execute the commands:
```bash
# Check current mappings
gcloud run domain-mappings list --region=europe-west1 --project=open-horizon-prod

# Remove old mapping
gcloud run domain-mappings delete \
  --domain=openhorizon.cc \
  --region=europe-west1 \
  --project=open-horizon-prod

# Create new mappings
gcloud run domain-mappings create \
  --service=openhorizon-landing \
  --domain=openhorizon.cc \
  --region=europe-west1 \
  --project=open-horizon-prod

gcloud run domain-mappings create \
  --service=openhorizon-app \
  --domain=app.openhorizon.cc \
  --region=europe-west1 \
  --project=open-horizon-prod
```

---

## Prevention Measures

### Process Improvements

1. **Add deployment checklist to PR template**
   - Include manual steps that must be executed
   - Require sign-off that infrastructure changes were applied

2. **Add monitoring/alerts**
   - Monitor which service is mapped to openhorizon.cc
   - Alert if unexpected service is mapped

3. **Add automated verification**
   - CI/CD step to check domain mappings after deployment
   - Fail if mappings don't match expected state

4. **Improve documentation visibility**
   - Link DEPLOY_INSTRUCTIONS.md prominently in PR description
   - Add "Manual Steps Required" label to PRs with infrastructure changes

5. **Consider Terraform/IaC**
   - Manage domain mappings as Infrastructure as Code
   - Make mappings part of automated deployment

### Documentation Updates

Add to README.md:
```markdown
## Deployment Checklist

After merging infrastructure changes:
1. [ ] Cloud Build completed successfully
2. [ ] Services are running
3. [ ] Domain mappings updated (if applicable)
4. [ ] SSL certificates provisioned
5. [ ] Both domains tested
```

---

## Conclusion

The issue is **not a code problem** but a **deployment gap**. All necessary code was created in PR #20, but the final manual step—executing the domain mapping script—was not performed.

**Resolution**: Run `./deploy-domain-mappings.sh` and wait for SSL provisioning.

**Severity**: High (business impact) but easy to fix (single command).

**Time to Fix**: 5 minutes (script execution) + 15-30 minutes (SSL provisioning).

---

## Appendix

### Key Files

- `deploy-domain-mappings.sh` - Script to fix mappings
- `DEPLOY_INSTRUCTIONS.md` - Complete deployment guide
- `landing/src/app/page.tsx` - Landing page content
- `cloudbuild-landing.yaml` - Landing page build config
- `cloudbuild-app.yaml` - App build config

### Related Issues

- Issue #19: Original issue describing the problem
- Issue #21: This issue - follow-up that mappings weren't executed
- PR #20: Implemented the fix (but didn't execute it)

### Contact

For questions about this RCA, contact the team or review:
- DEPLOY_INSTRUCTIONS.md
- Issue #19 comments
- PR #20 conversation
