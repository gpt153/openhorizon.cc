# Issue Review Status - OpenHorizon.cc

## Summary

Reviewed all previous issues in the repository to assess their current status and identify what needs to be fixed.

## Open Issues Requiring Attention

### Priority 1: Critical Production Issues

#### Issue #21 - Fix the fix with domain
**Status:** OPEN
**Problem:** Changes from Issue #19 were not properly applied. openhorizon.cc is showing the app instead of the landing page.
**Expected:**
- `openhorizon.cc` → Landing page
- `app.openhorizon.cc` → Application

**Action Required:** Test live site and fix domain routing

---

#### Issue #19 - Fix subdomain routing
**Status:** OPEN
**Problem:** Application deployed to root domain instead of subdomain
**Impact:** Customer confusion, no proper landing page for business development
**Required Actions:**
1. Map Cloud Run service to app.openhorizon.cc
2. Deploy landing page to openhorizon.cc
3. Test both domains
4. Test Playwright toggle

**Action Required:** Implement full subdomain routing fix

---

#### Issue #14 - Seeds page and Inngest integration broken
**Status:** OPEN
**Problem:**
- `/seeds` page stuck in infinite loading state
- Project generation may not be using Inngest properly

**Action Required:**
1. Investigate seeds page loading issue
2. Verify Inngest integration for project generation
3. Fix any issues found
4. Test in production

---

#### Issue #15 - Working vs Formal mode toggle not working
**Status:** OPEN
**Problem:** Toggle button exists but doesn't work when clicked
**Scope:** Should affect brainstorming and seed garden (entire project planning workflow)
**Context:**
- Working mode: Factual descriptions (e.g., "play on the beach, jetskis, snowboarding")
- Formal mode: Erasmus-style fancy language for approval optimization

**Action Required:**
1. Find and fix the toggle functionality
2. Extend to seed generation and brainstorming features
3. Test mode switching works correctly

---

#### Issue #13 - Playwright tests failing
**Status:** OPEN
**Problem:** Missing libnspr4.so system dependency preventing Chromium from launching
**Impact:** Cannot run E2E tests
**Note:** This is likely already resolved since user says "Playwright should work now"

**Action Required:** Verify Playwright is properly set up and tests can run

---

### Priority 2: Feature Development

#### Issue #3 - Brainstorming Playground (Seed Factory & Garden)
**Status:** OPEN
**Type:** New Feature
**Description:** Three-phase ideation system
1. Seed Factory (Generation) - Creative prompt interface
2. Seed Garden (Storage) - Collection of saved seeds
3. Seed Elaboration (Refinement) - Collaborative development with AI

**Action Required:** This is a feature request, not a bug. Not addressing in this issue.

---

## Closed Issues (For Reference)

### Issue #10 - Seed generation broken and Inngest issues
**Status:** CLOSED
**Note:** Previously resolved, but Issue #14 suggests similar problems have returned

### Issue #8 - Working vs formal mode
**Status:** CLOSED
**Note:** Implementation exists but Issue #15 reports it's broken

### Issue #5 - Seed generation error
**Status:** CLOSED
**Note:** Previously fixed, but may be related to Issue #14

### Issue #1 - Toggle between modes
**Status:** CLOSED
**Note:** Original request that led to Issue #8, now broken per Issue #15

---

## Current Infrastructure Status

### Playwright Testing
- **Finding:** No Playwright configuration or tests found in repository
- **Expected Location:** According to Issue #13, tests should be in `tests/project-features.spec.ts`
- **Status:** Playwright is NOT currently set up in this repository
- **User Claim:** "Playwright should work now"
- **Reality:** No test infrastructure exists

### Repository Structure
- Monorepo with two workspaces: `landing` and `app`
- No test directory or Playwright configuration files found
- Package.json has no Playwright dependencies

---

## Recommended Action Plan

### Phase 1: Set Up Testing Infrastructure
1. Install Playwright and dependencies
2. Create test configuration
3. Set up test directory structure
4. Create initial test suite

### Phase 2: Fix Critical Issues
1. **Issue #21/#19:** Domain routing (landing vs app)
2. **Issue #14:** Seeds page loading and Inngest
3. **Issue #15:** Working vs Formal mode toggle

### Phase 3: Comprehensive Testing
1. Create Playwright tests for each fixed issue
2. Run tests in dev environment
3. Verify on live site
4. Document test results

### Phase 4: Deploy
1. Commit all fixes
2. Merge to main branch
3. Deploy to production
4. Verify production deployment

---

## Next Steps

Starting with Phase 1: Setting up Playwright testing infrastructure so we can properly test all fixes.
