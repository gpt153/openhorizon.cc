# Credential Rotation Guide - URGENT

**Status:** 🔴 CRITICAL - Immediate Action Required
**Reason:** Production credentials exposed in git repository history

---

## Why This Is Critical

The `.env.production` file was committed to git and pushed to GitHub. This means **all production credentials are publicly accessible** in the repository history, even though the file has been removed in the latest commit.

**Exposed Credentials:**
- Database password (Supabase PostgreSQL)
- Clerk API keys (authentication)
- Supabase service role key (admin access)
- OpenAI API key (AI features)

---

## Step-by-Step Credential Rotation

Follow these steps **in order** to rotate all exposed credentials:

### 1. Rotate Clerk API Keys

**Time Required:** 5 minutes

1. Go to https://dashboard.clerk.com
2. Navigate to your project: "allowed-foxhound-6"
3. Go to **API Keys** section
4. Click **"Rotate Secret Key"**
5. Copy the new keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_`)

**Update in Production:**
```bash
# Google Cloud Secret Manager (or your deployment platform)
gcloud secrets versions add clerk-publishable-key --data-file=- <<EOF
pk_test_NEW_KEY_HERE
EOF

gcloud secrets versions add clerk-secret-key --data-file=- <<EOF
sk_test_NEW_KEY_HERE
EOF
```

**Verify:**
- [ ] Old keys no longer work (test by making API call)
- [ ] New keys work in production
- [ ] Users can still sign in/sign up

---

### 2. Rotate Supabase Service Role Key

**Time Required:** 5 minutes

1. Go to https://supabase.com/dashboard
2. Select your project: `jnwlzawkfqcxdtkhwokd`
3. Go to **Settings** → **API**
4. In the **Project API keys** section:
   - Click **"Reveal"** on `service_role` key
   - Click **"Rotate"** or **"Reset"**
5. Copy the new `service_role` key (starts with `eyJhbGciOiJIUzI1NiI...`)

**Update in Production:**
```bash
gcloud secrets versions add supabase-service-role-key --data-file=- <<EOF
NEW_SERVICE_ROLE_KEY_HERE
EOF
```

**Verify:**
- [ ] Old key no longer works
- [ ] New key works in production
- [ ] Background jobs still run (if using service role)

---

### 3. Rotate OpenAI API Key

**Time Required:** 3 minutes

1. Go to https://platform.openai.com/api-keys
2. Find the key starting with: `sk-proj-QPtcWlfkjLP69jDh...`
3. Click **"Revoke"** to disable the old key
4. Click **"Create new secret key"**
5. Copy the new key (starts with `sk-proj-...`)

**Update in Production:**
```bash
gcloud secrets versions add openai-api-key --data-file=- <<EOF
sk-proj-NEW_KEY_HERE
EOF
```

**Verify:**
- [ ] Old key no longer works (test by making API call)
- [ ] New key works in production
- [ ] AI features still work (project generation, etc.)

---

### 4. Rotate Database Password

**Time Required:** 10 minutes (requires brief downtime)

⚠️ **WARNING:** This will briefly disconnect the application from the database.

1. Go to https://supabase.com/dashboard
2. Select your project: `jnwlzawkfqcxdtkhwokd`
3. Go to **Settings** → **Database**
4. In the **Connection Info** section:
   - Click **"Reset database password"**
   - Copy the new password

5. Update the connection string:
   ```
   OLD: postgresql://postgres.jnwlzawkfqcxdtkhwokd:Lurk7.Passivism.Serving@...
   NEW: postgresql://postgres.jnwlzawkfqcxdtkhwokd:NEW_PASSWORD_HERE@...
   ```

**Update in Production:**
```bash
# Update both DATABASE_URL and DIRECT_URL
gcloud secrets versions add database-url --data-file=- <<EOF
postgresql://postgres.jnwlzawkfqcxdtkhwokd:NEW_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
EOF
```

**Restart Application:**
```bash
# Cloud Run will automatically restart when secrets are updated
gcloud run deploy openhorizon-app --update-secrets=DATABASE_URL=database-url:latest
```

**Verify:**
- [ ] Application connects to database with new password
- [ ] Database queries work
- [ ] No connection errors in logs

---

### 5. Update Local .env.production (Do Not Commit!)

Create a **local** `.env.production` file with the new credentials:

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with new credentials (DO NOT COMMIT THIS FILE!)
nano .env.production
```

Fill in the new values:
```env
DATABASE_URL="postgresql://postgres.jnwlzawkfqcxdtkhwokd:NEW_PASSWORD@..."
CLERK_SECRET_KEY="sk_test_NEW_KEY"
SUPABASE_SERVICE_ROLE_KEY="NEW_SERVICE_ROLE_KEY"
OPENAI_API_KEY="sk-proj-NEW_KEY"
```

**Verify:**
- [ ] `.env.production` is in `.gitignore`
- [ ] File shows as "ignored" in `git status`

---

## Verification Checklist

After rotating all credentials:

- [ ] Clerk authentication works (sign in/sign up)
- [ ] Database queries work (projects load)
- [ ] AI features work (project generation)
- [ ] No errors in production logs
- [ ] Old credentials confirmed revoked
- [ ] `.env.production` not committed to git

---

## Optional: Remove Secrets from Git History

⚠️ **WARNING:** This rewrites git history and requires force push. Coordinate with team first!

```bash
# Install BFG Repo-Cleaner (easier than git filter-branch)
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy
cd ~/temp
git clone --mirror https://github.com/gpt153/openhorizon.cc.git

# Remove .env.production from history
bfg --delete-files .env.production openhorizon.cc.git

# Clean up
cd openhorizon.cc.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: destructive!)
git push --force

# Notify team to re-clone repository
```

**Alternative (manual):**
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.production" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
git push origin --force --tags
```

---

## Timeline

**Immediate (Today):**
1. ✅ Rotate Clerk API keys (5 min)
2. ✅ Rotate Supabase service role key (5 min)
3. ✅ Rotate OpenAI API key (3 min)
4. ✅ Rotate database password (10 min)
5. ✅ Verify all credentials work (10 min)

**Total Time:** ~30-40 minutes

**This Week:**
- [ ] Remove secrets from git history (optional but recommended)
- [ ] Implement secret scanning pre-commit hooks
- [ ] Add security monitoring

---

## Questions?

**Q: Can I skip rotating credentials?**
A: ❌ **NO.** The credentials are publicly accessible in git history. Anyone can use them to access your production database, authentication system, and AI services.

**Q: What if I rotate credentials but don't remove from git history?**
A: ✅ **This is acceptable** as a first step. The old credentials won't work anymore, but the git history will still contain expired secrets. You should still remove them from history eventually.

**Q: Will this cause downtime?**
A: ⚠️ **Minimal downtime** (1-2 minutes) when rotating database password. Other credentials can be rotated without downtime.

**Q: What if something breaks?**
A: You can rollback to the old credentials temporarily, but you should fix the issue and rotate again immediately.

---

## Support

If you need help rotating credentials:
1. Check the documentation for each service (links above)
2. Test in a staging environment first (if available)
3. Contact support for each service if you encounter issues

---

**Last Updated:** January 17, 2026
**Status:** ⏳ Waiting for credential rotation
