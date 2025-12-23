# Root Cause Analysis - Issue #21
**Date:** December 23, 2025
**Issue:** openhorizon.cc is not showing landing page but app
**Related Issue:** #19 (Fix subdomain routing)
**Analyst:** SCAR Remote Agent

---

## Executive Summary

**Root Cause:** The domain mapping script (`deploy-domain-mappings.sh`) was created but **never executed** after PR #20 was merged. While the code and infrastructure were updated correctly, the Google Cloud Run domain mappings were not updated, leaving both domains pointing to the application service instead of routing the root domain to the landing page service.

**Impact:**
- Landing page is not accessible at openhorizon.cc
- Both openhorizon.cc and app.openhorizon.cc show the same application
- Business/marketing site is unavailable for potential partners

**Severity:** HIGH - Production configuration issue affecting business operations

---

## Timeline of Events

### December 23, 2025 - 10:17 UTC
- **PR #20 merged**: "Fix subdomain routing: Landing on root, app on subdomain"
- Code changes deployed successfully:
  - `landing/` folder created with Next.js marketing site
  - `cloudbuild-landing.yaml` deployed `openhorizon-landing` service
  - `cloudbuild-app.yaml` deployed `openhorizon-app` service
  - `deploy-domain-mappings.sh` script created

### Post-Merge
- ✅ Cloud Build successfully built and deployed BOTH services
- ✅ `openhorizon-landing` service is running in Cloud Run
- ✅ `openhorizon-app` service is running in Cloud Run
- ❌ Domain mappings were NOT updated (manual step not executed)

### December 23, 2025 - 11:41 UTC (Issue #21 Created)
- User reports: "openhorizon.cc is not showing landing page but app"
- Confirms changes from issue #19 not fully applied

---

## Evidence

### 1. Live Site Testing

**Test 1: openhorizon.cc (Root Domain)**
```bash
curl -sI https://openhorizon.cc
```
**Result:**
```
HTTP/2 307
location: /projects
x-powered-by: Next.js
```
**Analysis:** Redirecting to `/projects` - this is the APPLICATION, not the landing page.

**Expected:** Landing page with hero section "Empowering Youth Through Erasmus+"

---

**Test 2: app.openhorizon.cc (Subdomain)**
```bash
curl -sI https://app.openhorizon.cc
```
**Result:**
```
HTTP/2 307
location: /projects
x-powered-by: Next.js
```
**Analysis:** Also redirecting to `/projects` - same application behavior.

**Expected:** Application (this is correct behavior).

---

**Test 3: HTML Content Comparison**
Both domains return IDENTICAL HTML content:
- Same title: "Open Horizon Project Companion"
- Same sidebar: Dashboard, Projects, Brainstorm, Seeds, Settings
- Same navigation structure
- Same application interface

**Conclusion:** Both domains are serving the `openhorizon-app` service.

---

### 2. Infrastructure Analysis

**Services Deployed:**
| Service | Status | Domain Should Map To |
|---------|--------|---------------------|
| `openhorizon-landing` | ✅ Running | openhorizon.cc |
| `openhorizon-app` | ✅ Running | app.openhorizon.cc |

**Current Domain Mappings:**
| Domain | Currently Maps To | Should Map To |
|--------|------------------|---------------|
| openhorizon.cc | `openhorizon-app` ❌ | `openhorizon-landing` |
| app.openhorizon.cc | `openhorizon-app` ✅ | `openhorizon-app` |

---

### 3. Code Review

**Landing Page Implementation (Correct):**
- File: `/landing/src/app/page.tsx`
- Content: Marketing page with:
  - Hero section: "Empowering Youth Through Erasmus+"
  - Features grid (6 feature cards)
  - "How It Works" section
  - EU compliance footer
  - CTAs linking to app.openhorizon.cc

**Deployment Script (Created but Not Executed):**
- File: `/deploy-domain-mappings.sh`
- Purpose: Update Google Cloud Run domain mappings
- Status: ✅ Script exists, ❌ Never executed

**Cloud Build Configs (Correct):**
- `cloudbuild-landing.yaml`: Deploys `openhorizon-landing` service ✅
- `cloudbuild-app.yaml`: Deploys `openhorizon-app` service ✅

---

## Root Cause Analysis

### Primary Root Cause
**Category:** Process Failure - Manual Step Not Executed

**Description:**
The deployment process for PR #20 had a manual step that was not completed. The `deploy-domain-mappings.sh` script was created to update the Google Cloud Run domain mappings, but this script requires manual execution with proper GCP credentials.

**Evidence:**
1. Script exists in repository: `/deploy-domain-mappings.sh`
2. Script has correct commands to update domain mappings
3. Script was never executed (domain mappings still point to old configuration)

**Why It Happened:**
- PR #20 implementation was done in a GitHub worktree environment
- GCP CLI (`gcloud`) is not available in worktree environments
- The merge happened without the final manual deployment step
- Post-merge deployment checklist was not followed

---

### Contributing Factors

#### 1. **Incomplete Deployment Documentation**
The deployment required manual steps after merge:
- Merge PR ✅ (completed)
- Wait for Cloud Build ✅ (completed)
- **Run `./deploy-domain-mappings.sh`** ❌ (NOT completed)
- Wait for SSL certificate provisioning ❌ (pending)
- Test both domains ❌ (would have caught the issue)

#### 2. **Missing Automation**
Domain mapping updates cannot be automated via Cloud Build because:
- Domain operations require special IAM permissions
- Cloud Build service account may not have domain-mapping permissions
- Manual verification required for domain ownership

#### 3. **Lack of Verification**
No automated testing to verify:
- That openhorizon.cc shows landing page content
- That both domains serve different content
- That domain mappings are correct

---

## Impact Assessment

### User Impact
| Affected Users | Impact Level | Description |
|---------------|--------------|-------------|
| Potential partners visiting root domain | **HIGH** | See application instead of marketing content |
| New visitors | **MEDIUM** | Confusing experience, no clear value proposition |
| Existing users accessing app | **NONE** | App still works on both domains |

### Business Impact
- ❌ Landing page unavailable for business development
- ❌ No marketing presence on root domain
- ❌ SEO and branding issues
- ❌ Potential partners cannot easily understand offering

### Technical Impact
- ✅ Both services are running correctly
- ✅ No data loss or corruption
- ✅ No security vulnerabilities introduced
- ❌ Domain configuration mismatch

---

## Solution

### Immediate Fix (Required Now)

**Step 1: Execute the domain mapping script**
```bash
cd /workspace/openhorizon.cc
./deploy-domain-mappings.sh
```

This will:
1. Remove incorrect mapping: `openhorizon.cc` → `openhorizon-app`
2. Create correct mapping: `openhorizon.cc` → `openhorizon-landing`
3. Verify/create mapping: `app.openhorizon.cc` → `openhorizon-app`

**Expected Duration:** 2-5 minutes

---

**Step 2: Wait for SSL certificate provisioning**
SSL certificates are automatically provisioned by Google Cloud Run.

**Expected Duration:** 15-30 minutes

---

**Step 3: Verify both domains**

Test landing page:
```bash
curl -sL https://openhorizon.cc | grep -i "Empowering Youth"
```
Expected: Should find the text "Empowering Youth Through Erasmus+"

Test app:
```bash
curl -sL https://app.openhorizon.cc | grep -i "Projects"
```
Expected: Should find application interface

---

### Long-term Improvements

#### 1. **Automated Deployment Verification**
Create a post-deployment test script:
```bash
#!/bin/bash
# verify-domains.sh

echo "Testing openhorizon.cc..."
if curl -sL https://openhorizon.cc | grep -q "Empowering Youth"; then
  echo "✅ Landing page OK"
else
  echo "❌ Landing page FAILED - showing wrong content"
  exit 1
fi

echo "Testing app.openhorizon.cc..."
if curl -sL https://app.openhorizon.cc | grep -q "Dashboard"; then
  echo "✅ App OK"
else
  echo "❌ App FAILED"
  exit 1
fi
```

#### 2. **Enhanced Deployment Documentation**
Update `NEXT_STEPS.md` with:
- ✅ Clear visual checklist
- ✅ Expected output for each step
- ✅ Verification commands
- ✅ Rollback procedures

#### 3. **CI/CD Enhancement**
Add a GitHub Action to:
- ✅ Verify domain mappings after deployment
- ✅ Post a comment on the PR with verification results
- ✅ Alert if domains are misconfigured

---

## Lessons Learned

### What Went Well
1. ✅ Code implementation was correct and complete
2. ✅ Both Cloud Run services deployed successfully
3. ✅ Comprehensive documentation was created
4. ✅ Issue was quickly identified and isolated

### What Could Be Improved
1. ❌ Post-merge deployment checklist was not followed
2. ❌ No automated verification of domain mappings
3. ❌ Manual deployment step was not tracked
4. ❌ No alerts for misconfigured domains

### Recommendations
1. **Add deployment verification to CI/CD pipeline**
2. **Create automated domain health checks**
3. **Implement post-merge deployment tracking**
4. **Add Slack/email notifications for deployment steps**

---

## Action Items

### Immediate (Required to Fix Issue #21)
- [ ] Execute `./deploy-domain-mappings.sh` in main repository
- [ ] Wait 15-30 minutes for SSL provisioning
- [ ] Verify both domains serve correct content
- [ ] Close issue #21

### Short-term (This Week)
- [ ] Create `verify-domains.sh` automated test script
- [ ] Add domain verification to GitHub Actions
- [ ] Update deployment documentation with visual checklist
- [ ] Add post-deployment Slack notification

### Long-term (This Month)
- [ ] Set up uptime monitoring for both domains
- [ ] Create alerting for domain mapping mismatches
- [ ] Implement staging environment with same domain structure
- [ ] Add E2E tests for domain routing

---

## Conclusion

The root cause of issue #21 is **a manual deployment step that was not executed** after PR #20 was merged. While all code changes were implemented correctly and both Cloud Run services are running, the domain mappings were never updated from the old configuration.

**The fix is straightforward:** Execute the `deploy-domain-mappings.sh` script that was created as part of PR #20. This will correctly route `openhorizon.cc` to the landing page service and `app.openhorizon.cc` to the application service.

**This issue highlights the importance of:**
1. Following complete deployment checklists
2. Automated verification of infrastructure changes
3. Clear handoff between automated and manual steps
4. Post-deployment testing

---

## References

- Issue #19: Fix subdomain routing
- PR #20: Fix subdomain routing - merged Dec 23, 2025 10:17 UTC
- Deployment script: `/deploy-domain-mappings.sh`
- Deployment guide: `/DEPLOY_INSTRUCTIONS.md`
- Next steps: `/NEXT_STEPS.md`

---

**Prepared by:** SCAR Remote Agent
**Date:** December 23, 2025
**Status:** Ready for execution
