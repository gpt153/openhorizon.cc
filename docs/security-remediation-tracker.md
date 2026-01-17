# Security Remediation Tracker

**Audit Date:** 2026-01-17
**Status Updated:** 2026-01-17
**Audit Reference:** Issue #137 - Security Audit

---

## 🔴 Critical Issues

### Issue #1: Production Secrets Exposed in Git Repository

**Severity:** 🔴 CRITICAL
**Found:** 2026-01-17
**Impact:** Full system compromise possible - database access, authentication bypass, AI service abuse, email sending
**Status:** 🔴 **OPEN** (Requires immediate action)

#### Files Containing Secrets

1. `.env.production` (6+ commits since 2025-12-17)
2. `env-app.yaml` (Cloud Run config)
3. `env-pipeline.yaml` (Pipeline service config)
4. `app/Dockerfile` (Build config)
5. `deploy-inngest-config.sh` (Deployment script)
6. `.archive/root-docs/FIX_PROJECT_GENERATION.md` (Documentation)
7. `.archive/root-docs/INNGEST_SETUP.md` (Documentation)

#### Exposed Secrets

| Secret Type | Value (Prefix) | Service | Status |
|------------|----------------|---------|---------|
| Database Password | `Lurk7.P████████.S█████` | Supabase | 🔴 Needs rotation |
| Clerk Publishable Key | `pk_test_████████████████████...` | Clerk | 🔴 Needs rotation |
| Clerk Secret Key | `sk_test_████████████████████...` | Clerk | 🔴 Needs rotation |
| Supabase Anon Key | `eyJhbGc█████████████████████...` | Supabase | 🔴 Needs rotation |
| Supabase Service Role | `eyJhbGc█████████████████████...` | Supabase | 🔴 Needs rotation |
| OpenAI API Key | `sk-proj-████████████████████...` | OpenAI | 🔴 Needs rotation |
| Inngest Event Key | `I8TpIj██████████████████████...` | Inngest | 🔴 Needs rotation |
| Inngest Signing Key | `signkey-prod-████████████████...` | Inngest | 🔴 Needs rotation |

---

### Remediation Plan

#### Phase 1: Secret Rotation (HIGH PRIORITY - Complete within 24 hours)

**1.1 Rotate Supabase Database Password**
- [ ] **Backup current database** (if not already backed up)
  - Command: Supabase Dashboard → Database → Backups → Create Backup
  - Verify backup completion

- [ ] **Reset database password**
  - Navigate to: Supabase Dashboard → Settings → Database → Password
  - Old password: `████.████████.███████`
  - Generate new strong password (20+ characters, mixed case, numbers, symbols)
  - New password: `_______________________` (record in password manager)
  - Click "Reset Password"

- [ ] **Update Cloud Run environment variables**
  ```bash
  # Update app service
  gcloud run services update openhorizon-app \
    --region=europe-west1 \
    --update-env-vars="DATABASE_URL=postgresql://postgres.jnwlzawkfqcxdtkhwokd:[NEW_PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres,DIRECT_URL=postgresql://postgres.jnwlzawkfqcxdtkhwokd:[NEW_PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"

  # Update pipeline service
  gcloud run services update openhorizon-pipeline \
    --region=europe-west1 \
    --update-env-vars="DATABASE_URL=postgresql://postgres.jnwlzawkfqcxdtkhwokd:[NEW_PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=pipeline"
  ```

- [ ] **Test database connectivity**
  ```bash
  psql "postgresql://postgres.jnwlzawkfqcxdtkhwokd:[NEW_PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres" -c "SELECT 1;"
  ```
  Expected output: `1`

- [ ] **Verify application works**
  - Visit https://app.openhorizon.cc
  - Test login
  - Test loading project list
  - Check logs for database errors

- [ ] **Update local .env.local** (all team members)

**Completed:** [ ] Date: ____________ By: ____________

---

**1.2 Rotate Clerk API Keys**
- [ ] **Generate new Clerk API keys**
  - Navigate to: Clerk Dashboard → API Keys
  - Click "Create API Key" or "Regenerate"
  - Old publishable key: `pk_test_YWxsb3dlZC1mb3hob3VuZC02LmNsZXJrLmFjY291bnRzLmRldiQ`
  - Old secret key: `sk_test_████████████████████████████████`
  - New publishable key: `_______________________`
  - New secret key: `_______________________`

- [ ] **Update Cloud Run environment variables**
  ```bash
  gcloud run services update openhorizon-app \
    --region=europe-west1 \
    --update-env-vars="NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[NEW_PK],CLERK_SECRET_KEY=[NEW_SK]"
  ```

- [ ] **Update Clerk webhook configuration**
  - Navigate to: Clerk Dashboard → Webhooks
  - Update endpoint URL if needed
  - Generate new webhook secret
  - Update CLERK_WEBHOOK_SECRET in Cloud Run

- [ ] **Test authentication**
  - Sign out of https://app.openhorizon.cc
  - Test signup flow (create new test user)
  - Test login flow
  - Test logout flow
  - Verify webhook fires (check database for new user organization)

- [ ] **Update local .env.local** (all team members)

**Completed:** [ ] Date: ____________ By: ____________

---

**1.3 Rotate OpenAI API Key**
- [ ] **Generate new OpenAI API key**
  - Navigate to: https://platform.openai.com/api-keys
  - Click "Create new secret key"
  - Name: "OpenHorizon Production (Rotated 2026-01-17)"
  - Old key: `sk-proj-████████████████████████████`
  - New key: `_______________________`
  - Copy key (shown only once)

- [ ] **Delete old OpenAI API key**
  - In OpenAI Dashboard → API Keys
  - Find old key (by creation date or usage)
  - Click "Delete"

- [ ] **Update Cloud Run environment variables**
  ```bash
  gcloud run services update openhorizon-app \
    --region=europe-west1 \
    --update-env-vars="OPENAI_API_KEY=[NEW_KEY]"

  # If Inngest service uses OpenAI
  gcloud run services update openhorizon-inngest \
    --region=europe-west1 \
    --update-env-vars="OPENAI_API_KEY=[NEW_KEY]"
  ```

- [ ] **Test AI features**
  - Navigate to https://app.openhorizon.cc
  - Create a new seed (tests LangChain AI)
  - Verify AI generation works
  - Check logs for OpenAI API errors

- [ ] **Monitor OpenAI usage**
  - Check https://platform.openai.com/usage
  - Verify no unauthorized usage on old key (before deletion)
  - Monitor new key for unusual activity

- [ ] **Update local .env.local** (all team members)

**Completed:** [ ] Date: ____________ By: ____________

---

**1.4 Rotate Supabase Service Role Key**
- [ ] **Generate new Supabase service role key**
  - Navigate to: Supabase Dashboard → Settings → API
  - Click "Generate new service role key" (if available)
  - OR: Contact Supabase support to rotate
  - Old key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impud2x6YXdrZnFjeGR0a2h3b2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg1NTY0NywiZXhwIjoyMDgxNDMxNjQ3fQ.Q63ZjHjtmmpXF0Cns4pFpAgUDl5Qvjgov5grjeAlqYA`
  - New key: `_______________________`

- [ ] **Update Cloud Run environment variables**
  ```bash
  gcloud run services update openhorizon-app \
    --region=europe-west1 \
    --update-env-vars="SUPABASE_SERVICE_ROLE_KEY=[NEW_KEY]"
  ```

- [ ] **Test Supabase features**
  - Verify file uploads work (if using Supabase Storage)
  - Verify admin operations work

- [ ] **Update local .env.local** (all team members)

**Completed:** [ ] Date: ____________ By: ____________

---

**1.5 Rotate Inngest Keys (if Inngest service is active)**
- [ ] **Check if Inngest is currently in use**
  ```bash
  gcloud run services list --region=europe-west1 | grep inngest
  ```

- [ ] If Inngest service exists:
  - [ ] Navigate to: https://app.inngest.com → Settings → Keys
  - [ ] Generate new Event Key
    - Old: `████████████████████████████████████████`
    - New: `_______________________`
  - [ ] Generate new Signing Key
    - Old: `signkey-prod-████████████████████████████████`
    - New: `_______________________`
  - [ ] Update Cloud Run environment variables
    ```bash
    gcloud run services update openhorizon-inngest \
      --region=europe-west1 \
      --update-env-vars="INNGEST_EVENT_KEY=[NEW_EVENT_KEY],INNGEST_SIGNING_KEY=[NEW_SIGNING_KEY]"
    ```
  - [ ] Test background jobs

- [ ] If Inngest service does NOT exist:
  - [ ] Mark as N/A (service not deployed)

**Completed:** [ ] Date: ____________ By: ____________

---

#### Phase 2: Git History Cleanup (HIGH PRIORITY - Complete within 48 hours)

**⚠️ WARNING:** This rewrites git history. Coordinate with entire team before proceeding.

**2.1 Coordinate with Team**
- [ ] **Notify all team members** (via Slack/email)
  - Subject: "URGENT: Git history cleanup required - all must re-clone"
  - Explain: Production secrets were committed, must remove from history
  - Impact: Everyone must delete local clone and re-clone after cleanup
  - Timeline: Cleanup scheduled for [DATE/TIME]

- [ ] **Verify all team members acknowledged**
  - Team member 1: [ ] Acknowledged
  - Team member 2: [ ] Acknowledged
  - Team member 3: [ ] Acknowledged

- [ ] **Create full repository backup**
  ```bash
  git clone --mirror https://github.com/gpt153/openhorizon.cc openhorizon-backup.git
  cd openhorizon-backup.git
  git bundle create ../openhorizon-backup-2026-01-17.bundle --all
  # Store bundle in safe location (external drive, secure cloud storage)
  ```

**Completed:** [ ] Date: ____________ By: ____________

---

**2.2 Remove Secrets from Git History**

**Method 1: Using git-filter-repo (Recommended)**

- [ ] **Install git-filter-repo**
  ```bash
  pip3 install git-filter-repo
  ```

- [ ] **Create fresh clone for cleanup**
  ```bash
  git clone https://github.com/gpt153/openhorizon.cc openhorizon-cleanup
  cd openhorizon-cleanup
  ```

- [ ] **Remove files containing secrets**
  ```bash
  # Remove .env.production
  git filter-repo --path .env.production --invert-paths --force

  # Remove env-app.yaml
  git filter-repo --path env-app.yaml --invert-paths --force

  # Remove env-pipeline.yaml
  git filter-repo --path env-pipeline.yaml --invert-paths --force

  # Remove deploy-inngest-config.sh
  git filter-repo --path deploy-inngest-config.sh --invert-paths --force

  # Remove documentation with secrets
  git filter-repo --path .archive/root-docs/FIX_PROJECT_GENERATION.md --invert-paths --force
  git filter-repo --path .archive/root-docs/INNGEST_SETUP.md --invert-paths --force

  # Remove app/Dockerfile (contains Clerk secret in ARG)
  git filter-repo --path app/Dockerfile --invert-paths --force
  ```

- [ ] **Verify secrets removed**
  ```bash
  # Search for database password
  git log --all --full-history -S "████.████████.███████"
  # Expected: No results

  # Search for Clerk secret
  git log --all --full-history -S "sk_test_p1TjLNPJ23"
  # Expected: No results

  # Search for OpenAI key prefix
  git log --all --full-history -S "sk-proj-████████████████████████████"
  # Expected: No results
  ```

- [ ] **Add remote and force push**
  ```bash
  git remote add origin https://github.com/gpt153/openhorizon.cc
  git push --force --all
  git push --force --tags
  ```

**Completed:** [ ] Date: ____________ By: ____________

---

**Method 2: Using BFG Repo-Cleaner (Alternative if git-filter-repo fails)**

- [ ] **Download BFG Repo-Cleaner**
  ```bash
  wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
  ```

- [ ] **Create fresh clone**
  ```bash
  git clone --mirror https://github.com/gpt153/openhorizon.cc openhorizon.git
  ```

- [ ] **Remove files with BFG**
  ```bash
  java -jar bfg-1.14.0.jar --delete-files .env.production openhorizon.git
  java -jar bfg-1.14.0.jar --delete-files env-app.yaml openhorizon.git
  java -jar bfg-1.14.0.jar --delete-files env-pipeline.yaml openhorizon.git
  java -jar bfg-1.14.0.jar --delete-files deploy-inngest-config.sh openhorizon.git

  cd openhorizon.git
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  ```

- [ ] **Force push**
  ```bash
  git push --force
  ```

**Completed:** [ ] Date: ____________ By: ____________

---

**2.3 Team Re-Clone**
- [ ] **All team members delete local clones**
  ```bash
  # DANGER: This deletes your local clone
  rm -rf ~/path/to/openhorizon.cc
  ```

- [ ] **All team members fresh clone**
  ```bash
  git clone https://github.com/gpt153/openhorizon.cc
  cd openhorizon.cc
  ```

- [ ] **All team members create .env.local with NEW secrets**
  ```bash
  cp app/.env.example app/.env.local
  # Fill in NEW secrets (rotated in Phase 1)
  ```

- [ ] **Verify team has fresh clones**
  - Team member 1: [ ] Re-cloned
  - Team member 2: [ ] Re-cloned
  - Team member 3: [ ] Re-cloned

**Completed:** [ ] Date: ____________ By: ____________

---

**2.4 Final Verification**
- [ ] **Search for secrets in repository**
  ```bash
  # Search for database password
  git log --all --full-history -- "*.env*"
  # Expected: .env.example only (no .env.production)

  git log --all -S "████.████████.███████"
  # Expected: No results

  git log --all -S "sk_test_p1TjLNPJ23"
  # Expected: No results

  # Search in current files
  grep -r "████.████████.███████" . --exclude-dir=.git
  # Expected: No results (or only in this tracker doc)

  grep -r "sk_test_p1TjLNPJ23" . --exclude-dir=.git
  # Expected: No results (or only in this tracker doc)
  ```

- [ ] **Verify .env.production no longer in repository**
  ```bash
  ls -la .env.production
  # Expected: No such file or directory
  ```

- [ ] **Verify .env.example exists**
  ```bash
  ls -la app/.env.example
  # Expected: File exists with placeholder values
  ```

**Completed:** [ ] Date: ____________ By: ____________

---

#### Phase 3: Prevent Future Secret Commits (MEDIUM PRIORITY - Complete within 1 week)

**3.1 Update .gitignore**
- [ ] **Add env config files to .gitignore**
  ```bash
  echo "" >> .gitignore
  echo "# Environment configuration files (contain secrets)" >> .gitignore
  echo "env-app.yaml" >> .gitignore
  echo "env-pipeline.yaml" >> .gitignore
  echo "env-*.yaml" >> .gitignore
  echo ".env.production" >> .gitignore
  ```

- [ ] **Commit .gitignore update**
  ```bash
  git add .gitignore
  git commit -m "security: add env config files to .gitignore"
  git push
  ```

**Completed:** [ ] Date: ____________ By: ____________

---

**3.2 Implement Secret Scanning**
- [ ] **Enable GitHub Secret Scanning** (if private repo)
  - Navigate to: GitHub repo → Settings → Security → Code security and analysis
  - Enable "Secret scanning"
  - Enable "Push protection"

- [ ] **OR: Add GitGuardian GitHub App**
  - Navigate to: https://github.com/marketplace/gitguardian
  - Install on repository
  - Configure alert notifications

- [ ] **OR: Add TruffleHog to CI/CD**
  ```yaml
  # .github/workflows/security-scan.yml
  name: Secret Scan
  on: [push, pull_request]
  jobs:
    trufflehog:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
          with:
            fetch-depth: 0
        - name: TruffleHog OSS
          uses: trufflesecurity/trufflehog@main
          with:
            path: ./
            base: ${{ github.event.repository.default_branch }}
            head: HEAD
  ```

**Completed:** [ ] Date: ____________ By: ____________

---

**3.3 Add Pre-Commit Hooks**
- [ ] **Install pre-commit**
  ```bash
  pip install pre-commit
  ```

- [ ] **Create .pre-commit-config.yaml**
  ```yaml
  repos:
    - repo: https://github.com/Yelp/detect-secrets
      rev: v1.4.0
      hooks:
        - id: detect-secrets
          args: ['--baseline', '.secrets.baseline']
          exclude: package-lock.json
    - repo: https://github.com/pre-commit/pre-commit-hooks
      rev: v4.5.0
      hooks:
        - id: check-added-large-files
        - id: check-json
        - id: check-yaml
        - id: end-of-file-fixer
        - id: trailing-whitespace
  ```

- [ ] **Initialize and install hooks**
  ```bash
  pre-commit install
  detect-secrets scan > .secrets.baseline
  git add .pre-commit-config.yaml .secrets.baseline
  git commit -m "security: add pre-commit hooks for secret detection"
  ```

- [ ] **Test pre-commit hooks**
  ```bash
  # Try to commit a file with a fake secret
  echo "api_key = sk_test_fakesecret" > test-secret.txt
  git add test-secret.txt
  git commit -m "test"
  # Expected: Pre-commit hook blocks commit
  rm test-secret.txt
  ```

**Completed:** [ ] Date: ____________ By: ____________

---

**3.4 Document Secret Management**
- [ ] **Create docs/SECRET-MANAGEMENT.md**
  - How to manage environment variables
  - Where secrets should be stored (password manager, Cloud Run env vars)
  - What files should NEVER be committed
  - How to rotate secrets
  - Emergency procedures for exposed secrets

- [ ] **Update README.md**
  - Add "Security" section
  - Link to SECRET-MANAGEMENT.md
  - Explain .env.example usage

- [ ] **Update CLAUDE.md (if exists)**
  - Add warning about secret commits
  - Remind to use .env.local for local dev

**Completed:** [ ] Date: ____________ By: ____________

---

### Post-Remediation Verification

- [ ] **All secrets rotated and tested**
  - Database password ✅
  - Clerk API keys ✅
  - OpenAI API key ✅
  - Supabase service role key ✅
  - Inngest keys (if used) ✅ / N/A

- [ ] **Git history cleaned**
  - Secrets removed from all commits ✅
  - Team re-cloned repository ✅
  - Verification searches show no secrets ✅

- [ ] **Prevention measures in place**
  - .gitignore updated ✅
  - Secret scanning enabled ✅
  - Pre-commit hooks installed ✅
  - Documentation updated ✅

- [ ] **Application working with new secrets**
  - Production site accessible: https://app.openhorizon.cc ✅
  - Authentication working (signup, login, logout) ✅
  - Database connectivity working ✅
  - AI features working (seed generation) ✅
  - No errors in Cloud Run logs ✅

- [ ] **Monitoring set up**
  - OpenAI usage monitored for anomalies ✅
  - Database access logs reviewed ✅
  - Clerk authentication logs reviewed ✅
  - No unauthorized access detected ✅

---

**Total Completion:** 0% (0/50 tasks completed)

**Assignee:** [Team Lead / DevOps]
**Due Date:** 2026-01-24 (7 days from audit)
**Status:** 🔴 URGENT - Not Started

---

## 🟡 Medium Issues

### Issue #2: Missing Recommended Security Headers

**Severity:** 🟡 MEDIUM
**Found:** 2026-01-17
**Impact:** Defense-in-depth weakness - missing additional security layers
**Status:** 🟡 **OPEN**

#### Missing Headers

1. `Strict-Transport-Security` (HSTS) - Force HTTPS connections
2. `Content-Security-Policy` (CSP) - Prevent inline script execution
3. `Referrer-Policy` - Control referer information leakage
4. `Permissions-Policy` - Disable unused browser features

#### Remediation Steps

- [ ] **Update next.config.ts with security headers**

  File: `/worktrees/openhorizon.cc/issue-137/app/next.config.ts`

  ```typescript
  import type { NextConfig } from 'next'

  const nextConfig: NextConfig = {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
            },
            // NOTE: CSP requires careful configuration with Clerk
            // Test thoroughly before deploying
            // {
            //   key: 'Content-Security-Policy',
            //   value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://clerk.dev; ..."
            // },
          ],
        },
      ]
    },
  }

  export default nextConfig
  ```

- [ ] **Test in staging environment**
  ```bash
  npm run build
  npm run start
  curl -I http://localhost:3000
  # Verify headers present
  ```

- [ ] **Deploy to production**
  ```bash
  git add app/next.config.ts
  git commit -m "security: add recommended security headers"
  git push
  # Cloud Run auto-deploys
  ```

- [ ] **Verify in production**
  ```bash
  curl -I https://app.openhorizon.cc
  # Verify all headers present
  ```

**Assignee:** [Developer]
**Due Date:** 2026-01-31 (Next sprint)
**Status:** 🟡 Pending

---

## ✅ Completed Remediations

(Move items here after completion)

---

## 📊 Progress Tracking

### Overall Status

| Priority | Total Issues | Completed | In Progress | Open |
|----------|--------------|-----------|-------------|------|
| Critical | 1 | 0 | 0 | 1 |
| High | 0 | 0 | 0 | 0 |
| Medium | 1 | 0 | 0 | 1 |
| Low | 0 | 0 | 0 | 0 |
| **TOTAL** | **2** | **0** | **0** | **2** |

### Phase Completion

- [ ] Phase 1: Secret Rotation (0% - 0/5 tasks)
- [ ] Phase 2: Git History Cleanup (0% - 0/4 tasks)
- [ ] Phase 3: Prevention Measures (0% - 0/4 tasks)

### Critical Path

**Current blocker:** Issue #1 - Production Secrets in Git
**Timeline:** Must complete within 24-48 hours
**Risk if delayed:** Continued exposure, potential system compromise

---

## 📝 Notes

### Important Reminders

1. **Do NOT commit this tracker file** if it contains actual secret values (currently safe - contains only prefixes)
2. **Rotate ALL secrets** - even if you think they haven't been compromised
3. **Coordinate git cleanup** - requires team synchronization
4. **Test thoroughly** - verify application works with new secrets before declaring complete
5. **Monitor usage** - watch for unauthorized access attempts after rotation

### Communication Plan

- [ ] Notify stakeholders of security issue (without details)
- [ ] Update team on remediation progress (daily during critical phase)
- [ ] Announce completion and verification
- [ ] Schedule post-mortem to prevent recurrence

### Lessons Learned

(To be filled after remediation complete)

- What went wrong?
- How did secrets get committed?
- What processes failed?
- What will we change?

---

**Last Updated:** 2026-01-17
**Next Review:** 2026-01-18 (daily until critical issues resolved)
**Responsible:** [Team Lead Name]
**Escalation Contact:** [Manager/CTO Name]

---

**END OF REMEDIATION TRACKER**
