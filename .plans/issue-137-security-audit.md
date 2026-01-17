# Issue #137: Security Audit - Vulnerability Scanning Implementation Plan

**Status:** Ready for Implementation
**Priority:** Critical
**Estimated Time:** 3 hours
**Created:** 2026-01-17

## Executive Summary

This security audit will perform comprehensive vulnerability scanning of the OpenHorizon grant management system before production launch. The system handles sensitive grant application data worth €15,000-€30,000, requiring thorough security validation.

### Critical Finding (Pre-Audit)
**URGENT:** `.env.production` file containing production secrets (database passwords, API keys) was committed to git repository. This must be addressed immediately as part of this audit.

## Current Security Posture

### Strengths Identified
1. **Authentication:** Clerk integration with middleware protection
2. **Multi-tenant Isolation:** Strong `tenantId` filtering via `orgProcedure` in tRPC
3. **Input Validation:** Comprehensive Zod schemas on all API inputs
4. **SQL Injection Prevention:** Prisma ORM with parameterized queries
5. **XSS Prevention:** React's default JSX escaping
6. **Dependencies:** Zero npm vulnerabilities detected (as of 2026-01-17)

### Gaps Identified
1. **Secret Management:** Production secrets committed to git
2. **CSRF Protection:** Relies on Next.js defaults (acceptable but not explicit)
3. **Security Headers:** Not explicitly configured
4. **Input Sanitization:** No explicit HTML sanitization layer
5. **Rate Limiting:** Not implemented
6. **Audit Logging:** No security event logging

## Implementation Plan

### Phase 1: Dependency Vulnerability Scanning (30 minutes)

#### 1.1 Run npm audit (5 minutes)
```bash
cd /worktrees/openhorizon.cc/issue-137/app
npm audit --json > /tmp/npm-audit-results.json
npm audit
```

**Expected Outcome:** Zero vulnerabilities (confirmed in exploration)

**Documentation:**
- Capture full npm audit output
- Document npm version and audit timestamp
- Save JSON report for records

#### 1.2 Check for Outdated Dependencies (10 minutes)
```bash
cd /worktrees/openhorizon.cc/issue-137/app
npm outdated > /tmp/npm-outdated.txt
```

**Review Critical Packages:**
- `@clerk/nextjs` - Authentication security
- `@prisma/client` - Database security
- `next` - Framework security
- `zod` - Validation security
- `svix` - Webhook security

**Action Items:**
- Identify any critical packages > 6 months out of date
- Document why updates are deferred (if any)
- Schedule updates for next sprint (if non-critical)

#### 1.3 Third-Party Dependency Analysis (15 minutes)

**Manual Review:**
1. Check `package.json` for unknown/suspicious packages
2. Verify all dependencies are from trusted sources
3. Check for deprecated packages
4. Review `package-lock.json` for indirect vulnerabilities

**Critical Dependencies to Verify:**
- `@clerk/nextjs@^6.36.3` - Authentication provider
- `@prisma/client@^6.0.0` - Database ORM
- `@langchain/*` - AI integrations
- `svix@^1.39.0` - Webhook security
- `@sendgrid/mail@^8.1.6` - Email sending

---

### Phase 2: Environment Variable Security (45 minutes)

#### 2.1 CRITICAL: Remove Secrets from Git (20 minutes)

**Problem:** `.env.production` contains:
- Database credentials: `postgres.jnwlzawkfqcxdtkhwokd:Lurk7.Passivism.Serving`
- Clerk API keys: `pk_test_...` and `sk_test_...`
- Supabase service role key
- OpenAI API key: `sk-proj-QPtcWlfkjLP69jDhEm_Q...`

**Immediate Actions:**

1. **Rotate ALL compromised secrets:**
   - [ ] Supabase: Reset database password
   - [ ] Clerk: Generate new API keys
   - [ ] OpenAI: Rotate API key
   - [ ] SendGrid: Generate new API key (if used)

2. **Remove from git history:**
```bash
# WARNING: This rewrites git history - coordinate with team
git filter-repo --path .env.production --invert-paths
# OR use BFG Repo-Cleaner for safer removal
```

3. **Update .gitignore:**
   - Already contains `.env*` (good)
   - Verify it's working correctly

4. **Document proper secret management:**
   - Cloud Run uses `env-app.yaml` (NOT committed) ✓
   - Local dev uses `.env.local` (gitignored) ✓
   - Production uses Cloud Run environment variables ✓

**Testing:**
```bash
# Verify no secrets in git
git log --all --full-history -- "*.env*"
grep -r "sk_test_" .
grep -r "Passivism.Serving" .
```

#### 2.2 Create .env.example (10 minutes)

Create template file with placeholder values for all required environment variables.

#### 2.3 Audit Environment Variable Usage (15 minutes)

**Files to Check:** (13 files use process.env)
- `app/src/lib/prisma.ts`
- `app/src/lib/ai/chains/*.ts`
- `app/src/lib/email/*.ts`
- `app/src/app/api/webhooks/clerk/route.ts`

**Verification Checklist:**
- [ ] All env vars have fallback or error handling
- [ ] No secrets logged to console
- [ ] No secrets sent to client-side
- [ ] NEXT_PUBLIC_* vars are truly public (no secrets)
- [ ] Sensitive vars validated at runtime

---

### Phase 3: Authentication Verification (45 minutes)

#### 3.1 Review Authentication Architecture (10 minutes)

**Key Files:**
- `/worktrees/openhorizon.cc/issue-137/app/src/middleware.ts` - Route protection
- `/worktrees/openhorizon.cc/issue-137/app/src/server/context.ts` - User context
- `/worktrees/openhorizon.cc/issue-137/app/src/server/trpc.ts` - tRPC procedures
- `/worktrees/openhorizon.cc/issue-137/app/src/app/api/webhooks/clerk/route.ts` - Webhook handling

**Security Checklist:**
- [x] All protected routes require authentication
- [x] API routes return proper HTTP codes (401/403)
- [x] Webhooks verify signatures
- [x] User context properly validated
- [ ] Session timeout configured (check Clerk settings)
- [ ] Multi-device login handling (check Clerk settings)

#### 3.2 Manual Authentication Testing (20 minutes)

**Test Cases:**

**TC-001: Signup Flow**
1. Navigate to https://app.openhorizon.cc/sign-up
2. Enter valid email/password
3. Verify email confirmation (if required)
4. Verify auto-creation of organization (check webhook)
5. Verify redirect to /onboarding or /dashboard

**TC-002: Login Flow**
1. Navigate to https://app.openhorizon.cc/sign-in
2. Enter valid credentials
3. Verify redirect to /dashboard

**TC-003: Logout Flow**
1. While logged in, click logout
2. Verify redirect to sign-in page
3. Attempt to access /projects directly

**TC-004: Password Reset Flow**
1. Click "Forgot Password" on sign-in
2. Enter email address
3. Verify reset email received
4. Set new password

**TC-005: Unauthorized Access**
1. In incognito window, navigate to protected routes
2. Verify redirects to sign-in

**TC-006: Token Expiry**
1. Log in to application
2. Manually invalidate session in Clerk dashboard
3. Verify forced re-authentication

#### 3.3 Webhook Security Verification (15 minutes)

Test webhook signature verification:
```bash
# Send test webhook WITHOUT signature (should fail)
curl -X POST https://app.openhorizon.cc/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"type":"user.created","data":{"id":"test"}}'

# Expected: 400 "Missing Svix headers"
```

---

### Phase 4: Multi-Tenant Isolation Testing (45 minutes)

#### 4.1 Review Multi-Tenant Architecture (10 minutes)

**Database Schema Analysis:**
- All tables use `tenantId` filtering
- Indexes on `(tenantId, status)` for performance
- Cascade deletes prevent orphaned data
- `orgProcedure` enforces membership verification

**Security Review:**
- [x] All queries include `tenantId` filter
- [x] `orgProcedure` enforces membership check
- [x] Cascade deletes prevent orphaned data
- [x] Indexes optimize tenant-scoped queries

#### 4.2 Manual Isolation Testing (25 minutes)

**Setup Required:**
1. Create two test organizations with test users
2. Create test projects in each organization
3. Note down IDs for cross-tenant access attempts

**Test Cases:**

**TC-007: Project Isolation**
- User A creates Project X in Org A
- User B attempts to access Project X
- Expected: "Project not found" or 403 error

**TC-008: List Endpoint Isolation**
- User A creates 3 projects in Org A
- User B creates 2 projects in Org B
- Each user lists projects
- Expected: Each user sees only their org's projects

**TC-009: Update Operation Isolation**
- User A creates Project X
- User B attempts to update Project X
- Expected: Update fails with authorization error

**TC-010: Delete Operation Isolation**
- User A creates Project X
- User B attempts to delete Project X
- Expected: Delete fails with authorization error

**TC-011: Database-Level Isolation**
- Verify application never exposes raw queries
- Confirm Prisma prevents SQL injection

**TC-012: Pipeline Projects Isolation**
- Test same scenarios for pipeline_projects, vendors, communications, expenses

**TC-013: Search Jobs Isolation**
- Verify organizationId filter enforced on search jobs

#### 4.3 Automated Isolation Tests (10 minutes)

Create test script: `app/tests/security/multi-tenant-isolation.spec.ts`

---

### Phase 5: Common Vulnerability Scanning (45 minutes)

#### 5.1 SQL Injection Testing (15 minutes)

**Risk Level:** LOW (Prisma ORM prevents by design)

**Test Cases:**

**TC-014: tRPC Input Injection**
```typescript
const maliciousInput = {
  id: "' OR '1'='1'; DROP TABLE projects; --"
}
trpc.projects.getById(maliciousInput)
// Expected: Zod validation fails
```

**Manual Code Review:**
```bash
# Search for raw SQL (should find none)
grep -r "\$executeRaw" app/src
grep -r "\$queryRaw" app/src
```

#### 5.2 XSS Testing (15 minutes)

**Risk Level:** LOW (React auto-escapes JSX)

**Test Cases:**

**TC-017: Input Field XSS**
1. Project title: `<script>alert('XSS')</script>`
2. Description: `<img src=x onerror=alert('XSS')>`
- Expected: Rendered as plain text, no execution

**TC-018: Stored XSS**
1. Create project with malicious title
2. Load project list/detail pages
- Expected: No script execution

**Manual Code Review:**
```bash
# Search for dangerous patterns
grep -r "dangerouslySetInnerHTML" app/src
grep -r "innerHTML" app/src
```

#### 5.3 CSRF Protection Verification (10 minutes)

**Test Cases:**

**TC-020: Cross-Origin Request**
- Attempt cross-origin POST to API
- Expected: Blocked by SameSite cookie policy

**TC-021: CORS Headers Check**
```bash
curl -X POST https://app.openhorizon.cc/api/trpc/projects.list \
  -H "Origin: https://evil.com"
# Expected: CORS policy blocks request
```

#### 5.4 Security Headers Audit (5 minutes)

```bash
# Test production site
curl -I https://app.openhorizon.cc
```

**Expected Headers:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- Strict-Transport-Security: max-age=31536000
- Referrer-Policy: strict-origin-when-cross-origin

---

### Phase 6: Documentation & Remediation (30 minutes)

#### 6.1 Create Security Audit Report (20 minutes)

Create comprehensive report at:
`/worktrees/openhorizon.cc/issue-137/docs/security-audit-report-2026-01-17.md`

Include:
- Executive summary
- Findings by category
- Test results
- Remediation steps
- Recommendations

#### 6.2 Create Remediation Tracking Document (10 minutes)

Create tracker at:
`/worktrees/openhorizon.cc/issue-137/docs/security-remediation-tracker.md`

Track:
- Critical issues and remediation status
- Assignees and due dates
- Completion verification

---

### Phase 7: Final Verification & Sign-off (10 minutes)

Create pre-production checklist:

- [ ] All high/critical vulnerabilities fixed or documented
- [ ] Production secrets rotated and secured
- [ ] No secrets in git repository
- [ ] Authentication flows tested and working
- [ ] Multi-tenant isolation verified
- [ ] All test results documented
- [ ] Security audit report completed
- [ ] Remediation tracker created

---

## Implementation Timeline

### Day 1 (3 hours total)

**Hour 1: Dependency & Environment**
- 0:00-0:15: Run npm audit and review dependencies
- 0:15-0:35: **CRITICAL: Address .env.production issue**
- 0:35-0:45: Create .env.example
- 0:45-1:00: Document findings

**Hour 2: Authentication & Isolation**
- 1:00-1:10: Review authentication architecture
- 1:10-1:30: Manual authentication testing
- 1:30-1:45: Webhook verification
- 1:45-2:00: Review multi-tenant architecture
- 2:00-2:30: Multi-tenant isolation testing
- 2:30-2:45: Document findings

**Hour 3: Vulnerabilities & Documentation**
- 2:45-3:00: SQL injection testing
- 3:00-3:15: XSS testing
- 3:15-3:25: CSRF verification
- 3:25-3:30: Security headers check
- 3:30-3:50: Write security audit report
- 3:50-4:00: Create remediation tracker
- 4:00-4:10: Final verification checklist

---

## Success Criteria

### Audit Complete When:
1. ✅ npm audit shows zero high/critical vulnerabilities
2. ✅ All authentication flows tested and documented
3. ✅ Multi-tenant isolation verified with test cases
4. ✅ Common vulnerabilities tested (SQL injection, XSS, CSRF)
5. ✅ Environment variable security reviewed
6. ✅ Security headers assessed
7. ✅ Complete audit report written
8. ✅ Remediation tracker created
9. ✅ All critical issues have remediation plan
10. ✅ Stakeholder sign-off obtained

---

## Critical Files

1. **/.env.production** - CRITICAL: Contains exposed secrets
2. **/app/src/middleware.ts** - Core authentication logic
3. **/app/src/server/trpc.ts** - Multi-tenant authorization
4. **/app/prisma/schema.prisma** - Database schema
5. **/app/next.config.ts** - Security headers configuration

---

**END OF IMPLEMENTATION PLAN**
