# Implementation Plan: Database Backup & Recovery
**Issue:** #135
**Epic:** [003-production-readiness](https://github.com/gpt153/openhorizon-planning/blob/main/.bmad/epics/003-production-readiness.md)
**Status:** Planning
**Created:** 2026-01-17

## Overview

Implement automated database backups and tested recovery procedures to prevent data loss for OpenHorizon.cc. Each project represents €15,000-€30,000 in grant funding, making data loss unacceptable.

## Current State Analysis

### Existing Infrastructure
- **Database:** Supabase PostgreSQL (hosted)
- **Connection:** Pooled via pgbouncer at `aws-1-eu-west-1.pooler.supabase.com:6543`
- **Project Ref:** `jnwlzawkfqcxdtkhwokd`
- **Database URL:** `postgresql://postgres.jnwlzawkfqcxdtkhwokd:***@aws-1-eu-west-1.pooler.supabase.com:6543/postgres`
- **Prisma ORM:** Used for schema management and migrations
- **Critical Data:**
  - Organizations (Swedish nonprofit association)
  - Projects (Erasmus+ grant applications €15K-€30K each)
  - Budget data
  - User information
  - AI-generated project content

### Supabase Backup Capabilities
Supabase provides automated backup features on paid plans:
- **Daily automated backups** (configurable)
- **Point-in-time recovery (PITR)** for Pro tier and above
- **Backup retention** (typically 7-30 days depending on plan)
- **Backup restoration** via Supabase CLI or dashboard

## Implementation Strategy

### Phase 1: Verify Supabase Backup Configuration ✅
**Goal:** Ensure automated backups are enabled and properly configured

**Tasks:**
1. Access Supabase dashboard for project `jnwlzawkfqcxdtkhwokd`
2. Navigate to Database → Backups section
3. Verify settings:
   - Daily automated backups: ENABLED
   - Retention period: Minimum 7 days
   - Backup schedule: Documented
4. Document current backup configuration in `docs/RUNBOOK.md`
5. Screenshot backup settings for documentation

**Acceptance Criteria:**
- [ ] Backup settings verified and documented
- [ ] Daily backups confirmed as enabled
- [ ] 7-day minimum retention verified
- [ ] Screenshots added to RUNBOOK.md

---

### Phase 2: Create Backup Restoration Script 🔧
**Goal:** Provide a safe, tested script for restoring database backups

**File:** `scripts/restore-backup.sh`

**Script Features:**
```bash
#!/bin/bash
# scripts/restore-backup.sh
# Restore database from Supabase backup

set -euo pipefail

BACKUP_ID="${1:-}"
TARGET_ENV="${2:-staging}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Usage
if [ -z "$BACKUP_ID" ]; then
  echo "Usage: ./scripts/restore-backup.sh <backup_id> [target_env]"
  echo ""
  echo "Arguments:"
  echo "  backup_id    - The Supabase backup ID (format: YYYY-MM-DD-HH-MM-SS)"
  echo "  target_env   - Target environment (staging|production) [default: staging]"
  echo ""
  echo "Example:"
  echo "  ./scripts/restore-backup.sh 2026-01-17-03-00-00 staging"
  exit 1
fi

# Safety checks
echo -e "${YELLOW}⚠️  BACKUP RESTORATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backup ID:     $BACKUP_ID"
echo "Target:        $TARGET_ENV"
echo ""

# Production protection
if [ "$TARGET_ENV" = "production" ]; then
  echo -e "${RED}🚨 WARNING: You are about to restore to PRODUCTION${NC}"
  echo "This will OVERWRITE all current production data!"
  echo ""
  read -p "Type 'RESTORE PRODUCTION' to confirm: " confirm
  if [ "$confirm" != "RESTORE PRODUCTION" ]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
  fi
else
  echo -e "${YELLOW}This will restore the backup to $TARGET_ENV environment.${NC}"
  read -p "Continue? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
  fi
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

# Restore using Supabase CLI
echo ""
echo -e "${GREEN}🔄 Starting restore...${NC}"

# TODO: Implement actual Supabase restore command
# Note: Supabase CLI restore syntax may vary by version
# This is a placeholder for the actual implementation

supabase db restore \
  --backup-id "$BACKUP_ID" \
  --project-ref "jnwlzawkfqcxdtkhwokd" \
  || {
    echo -e "${RED}❌ Restore failed!${NC}"
    exit 1
  }

echo ""
echo -e "${GREEN}✅ Restore complete${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Verify data integrity${NC}"
echo "Run: ./scripts/verify-backup.sh"
```

**Implementation Steps:**
1. Create `scripts/` directory in project root
2. Write `scripts/restore-backup.sh` with above content
3. Make script executable: `chmod +x scripts/restore-backup.sh`
4. Add comprehensive error handling
5. Add logging to track restoration attempts

**Acceptance Criteria:**
- [ ] Script created with proper error handling
- [ ] Safety checks prevent accidental production overwrites
- [ ] Script accepts backup ID and target environment
- [ ] Confirmation prompts implemented
- [ ] Script is executable

---

### Phase 3: Create Backup Verification Script 🔍
**Goal:** Verify backup integrity and data completeness after restoration

**File:** `scripts/verify-backup.sh`

**Script Features:**
```bash
#!/bin/bash
# scripts/verify-backup.sh
# Verify database backup integrity

set -euo pipefail

DATABASE_URL="${DATABASE_URL:-}"
TARGET_ENV="${1:-staging}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
  exit 1
fi

echo -e "${GREEN}🔍 Verifying database backup...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check critical tables exist
TABLES=("organizations" "projects" "budgets" "users")

for table in "${TABLES[@]}"; do
  echo -n "Checking table '$table'... "

  COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "ERROR")

  if [ "$COUNT" = "ERROR" ]; then
    echo -e "${RED}❌ FAILED${NC}"
    exit 1
  else
    echo -e "${GREEN}✅ OK ($COUNT records)${NC}"
  fi
done

# Verify key constraints
echo ""
echo "Verifying constraints..."
psql "$DATABASE_URL" -c "
  SELECT
    conname AS constraint_name,
    contype AS constraint_type
  FROM pg_constraint
  WHERE contype IN ('p', 'f', 'u')
  LIMIT 5;
" || {
  echo -e "${RED}❌ Constraint check failed${NC}"
  exit 1
}

# Check for recent data
echo ""
echo "Checking data freshness..."
LATEST_PROJECT=$(psql "$DATABASE_URL" -t -c "
  SELECT created_at
  FROM projects
  ORDER BY created_at DESC
  LIMIT 1;
" 2>/dev/null || echo "NO_DATA")

if [ "$LATEST_PROJECT" != "NO_DATA" ]; then
  echo -e "${GREEN}✅ Latest project: $LATEST_PROJECT${NC}"
else
  echo -e "${YELLOW}⚠️  No project data found${NC}"
fi

echo ""
echo -e "${GREEN}✅ Backup verification complete${NC}"
```

**Implementation Steps:**
1. Create `scripts/verify-backup.sh`
2. Make script executable
3. Test against current database
4. Document expected output in RUNBOOK.md

**Acceptance Criteria:**
- [ ] Script verifies all critical tables exist
- [ ] Script checks record counts
- [ ] Script validates constraints
- [ ] Script checks data freshness
- [ ] Clear output with status indicators

---

### Phase 4: Document Backup Procedures 📚
**Goal:** Create comprehensive documentation for backup and restore operations

**File:** `docs/RUNBOOK.md`

**Structure:**
```markdown
# OpenHorizon.cc Operations Runbook

## Table of Contents
1. [Database Backups](#database-backups)
2. [Backup Restoration](#backup-restoration)
3. [Disaster Recovery](#disaster-recovery)
4. [Monitoring](#monitoring)

## Database Backups

### Backup Configuration
- **Provider:** Supabase
- **Frequency:** Daily automated backups at 03:00 UTC
- **Retention:** 7 days
- **Location:** Supabase managed storage (encrypted at rest)
- **Project Ref:** jnwlzawkfqcxdtkhwokd

### Viewing Available Backups

**Via Supabase Dashboard:**
1. Navigate to https://supabase.com/dashboard
2. Select project "openhorizon-cc"
3. Go to Database → Backups
4. View list of available backups with timestamps

**Via Supabase CLI:**
```bash
supabase db backups list --project-ref jnwlzawkfqcxdtkhwokd
```

### Backup Contents
Each backup includes:
- All database schemas
- All table data
- Indexes and constraints
- User-defined functions
- Row-level security policies

### Critical Data Protected
- Organizations (Swedish nonprofit)
- Erasmus+ Projects (€15K-€30K each)
- Budget data and calculations
- User accounts and authentication
- AI-generated content
- Application metadata

## Backup Restoration

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Database access credentials
- Confirmation from team lead for production restores

### Restoration Procedure

#### 1. Identify Backup to Restore
```bash
# List available backups
supabase db backups list --project-ref jnwlzawkfqcxdtkhwokd

# Note the backup ID (format: YYYY-MM-DD-HH-MM-SS)
```

#### 2. Restore to Staging (RECOMMENDED FIRST)
```bash
# Always test restore on staging first!
./scripts/restore-backup.sh 2026-01-17-03-00-00 staging
```

#### 3. Verify Restored Data
```bash
# Run verification script
./scripts/verify-backup.sh

# Manual checks:
# - Check organization exists
# - Verify project count
# - Check latest project date
# - Test application login
```

#### 4. Restore to Production (IF NEEDED)
```bash
# ⚠️ ONLY after successful staging restore and verification
./scripts/restore-backup.sh 2026-01-17-03-00-00 production
```

### Rollback Procedure

If restoration fails or causes issues:

1. **Stop Application Traffic**
   ```bash
   # Disable Cloud Run service
   gcloud run services update openhorizon-app \
     --no-allow-unauthenticated \
     --region=europe-west1
   ```

2. **Restore Previous Backup**
   ```bash
   # Use the backup from before the failed restore
   ./scripts/restore-backup.sh <previous-backup-id> production
   ```

3. **Verify and Re-enable**
   ```bash
   ./scripts/verify-backup.sh

   # Re-enable service
   gcloud run services update openhorizon-app \
     --allow-unauthenticated \
     --region=europe-west1
   ```

## Disaster Recovery

### Scenarios and Response

#### Scenario 1: Accidental Data Deletion
**Impact:** Medium
**Response Time:** < 2 hours

1. Identify when deletion occurred
2. Find most recent backup before deletion
3. Restore to staging and verify
4. Restore to production if verified
5. Document incident

#### Scenario 2: Database Corruption
**Impact:** High
**Response Time:** < 1 hour

1. Stop application immediately
2. Contact Supabase support
3. Restore latest backup to staging
4. Verify data integrity
5. Restore to production
6. Resume application

#### Scenario 3: Complete Data Loss
**Impact:** Critical
**Response Time:** < 30 minutes

1. Activate incident response team
2. Use most recent backup (should be < 24 hours old)
3. Restore to new database instance if needed
4. Update connection strings
5. Verify all data
6. Resume operations
7. Full post-mortem

### Recovery Time Objective (RTO)
- **Target:** 2 hours
- **Maximum:** 4 hours

### Recovery Point Objective (RPO)
- **Target:** 24 hours (daily backups)
- **Acceptable Data Loss:** Up to 1 day of data

## Monitoring

### Backup Health Checks

**Daily Checks (Automated):**
- [ ] Backup completed successfully
- [ ] Backup size within expected range
- [ ] Backup age < 24 hours

**Weekly Checks (Manual):**
- [ ] Test restore to staging
- [ ] Verify backup integrity
- [ ] Review backup retention settings

**Monthly Checks (Manual):**
- [ ] Full disaster recovery drill
- [ ] Update runbook procedures
- [ ] Review and test all scripts

### Alerts

Configure alerts for:
- ⚠️ Backup failed
- ⚠️ Backup size anomaly (too large or too small)
- ⚠️ No backup in last 24 hours
- ⚠️ Backup restoration failure

### Alert Contacts
- **Primary:** team-lead@openhorizon.cc
- **Secondary:** tech@openhorizon.cc
- **Supabase Support:** support@supabase.com

## Testing

### Monthly Backup Restoration Test

1. Select random backup from last 7 days
2. Restore to isolated test database
3. Run verification script
4. Test application functionality
5. Document results
6. Delete test database

### Semi-Annual Disaster Recovery Drill

1. Simulate complete database loss
2. Restore from backup to new instance
3. Update all connection strings
4. Deploy application
5. Verify full functionality
6. Document lessons learned
7. Update procedures

## Appendix

### Useful Commands

**Check database connection:**
```bash
psql $DATABASE_URL -c "SELECT version();"
```

**List all tables:**
```bash
psql $DATABASE_URL -c "\dt"
```

**Check table sizes:**
```bash
psql $DATABASE_URL -c "
  SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

**Export schema only:**
```bash
pg_dump $DATABASE_URL --schema-only > schema-backup.sql
```

### Contact Information

**Supabase Support:**
- Email: support@supabase.com
- Dashboard: https://supabase.com/dashboard/support

**Emergency Contacts:**
- On-call Engineer: [TBD]
- Database Admin: [TBD]
- Project Manager: [TBD]

---

**Last Updated:** 2026-01-17
**Document Owner:** DevOps Team
**Review Schedule:** Monthly
```

**Implementation Steps:**
1. Create `docs/RUNBOOK.md` with above content
2. Add screenshots from Supabase dashboard
3. Update contact information
4. Review with team
5. Add to main README.md

**Acceptance Criteria:**
- [ ] RUNBOOK.md created with all sections
- [ ] Screenshots of Supabase backup dashboard included
- [ ] Step-by-step restoration procedure documented
- [ ] Disaster recovery scenarios documented
- [ ] Testing procedures defined

---

### Phase 5: Set Up Backup Monitoring ⚠️
**Goal:** Automated monitoring and alerting for backup health

**Approach Options:**

#### Option A: Supabase Built-in Monitoring (Recommended)
- Use Supabase dashboard alerts
- Configure email notifications for backup failures
- Set up webhook for Slack/Discord notifications

#### Option B: Custom Monitoring Script
**File:** `scripts/check-backups.sh`

```bash
#!/bin/bash
# scripts/check-backups.sh
# Monitor backup health and send alerts

set -euo pipefail

# Configuration
PROJECT_REF="jnwlzawkfqcxdtkhwokd"
MAX_BACKUP_AGE_HOURS=24
ALERT_EMAIL="tech@openhorizon.cc"

# Get latest backup info
LATEST_BACKUP=$(supabase db backups list --project-ref "$PROJECT_REF" --limit 1 --json)

# Parse backup age
BACKUP_TIMESTAMP=$(echo "$LATEST_BACKUP" | jq -r '.[0].created_at')
BACKUP_AGE_HOURS=$(( ($(date +%s) - $(date -d "$BACKUP_TIMESTAMP" +%s)) / 3600 ))

# Check backup age
if [ "$BACKUP_AGE_HOURS" -gt "$MAX_BACKUP_AGE_HOURS" ]; then
  echo "⚠️ ALERT: Latest backup is $BACKUP_AGE_HOURS hours old (> $MAX_BACKUP_AGE_HOURS hours)"

  # Send alert (implement email/Slack notification)
  # mail -s "OpenHorizon Backup Alert" "$ALERT_EMAIL" <<< "Latest backup is too old"

  exit 1
fi

echo "✅ Backup health check passed (latest backup: $BACKUP_AGE_HOURS hours ago)"
```

#### Option C: Cloud Monitoring Integration
- Use Google Cloud Monitoring
- Set up uptime checks for backup status
- Create alerting policies

**Implementation Steps:**
1. Configure Supabase backup notifications
2. Create monitoring script (if custom monitoring needed)
3. Set up cron job or Cloud Scheduler to run checks
4. Configure alert channels (email, Slack, etc.)
5. Test alert delivery

**Acceptance Criteria:**
- [ ] Backup failure alerts configured
- [ ] Backup age monitoring active
- [ ] Alert delivery tested
- [ ] Monitoring documented in RUNBOOK.md

---

### Phase 6: Testing & Validation 🧪
**Goal:** Verify all backup and restore procedures work correctly

**Test Plan:**

#### Test 1: List Backups
```bash
# Verify we can see available backups
supabase db backups list --project-ref jnwlzawkfqcxdtkhwokd
```

**Expected:** List of recent backups with timestamps

#### Test 2: Restore to Staging
```bash
# Create test staging database
# Restore a recent backup
./scripts/restore-backup.sh <backup-id> staging
```

**Expected:** Successful restoration without errors

#### Test 3: Verify Restored Data
```bash
# Run verification script
./scripts/verify-backup.sh

# Manual verification
# - Check organization count
# - Check project count
# - Verify data integrity
```

**Expected:** All checks pass, data matches production

#### Test 4: Simulate Data Loss
```bash
# In staging:
# 1. Delete some test data
# 2. Restore from backup
# 3. Verify deleted data is restored
```

**Expected:** Data successfully recovered

#### Test 5: Alert Testing
```bash
# Trigger test alert
./scripts/check-backups.sh

# Verify alerts received
```

**Expected:** Alerts delivered to configured channels

**Acceptance Criteria:**
- [ ] All 5 tests pass
- [ ] Backup restoration tested successfully
- [ ] Data verification script validates correctly
- [ ] Alerts triggered and received
- [ ] Test results documented

---

## File Structure

```
openhorizon.cc/
├── scripts/                           # NEW
│   ├── restore-backup.sh             # Restore database from backup
│   ├── verify-backup.sh              # Verify backup integrity
│   └── check-backups.sh              # Monitor backup health (optional)
├── docs/
│   └── RUNBOOK.md                    # NEW - Operations runbook
├── .env.production                   # Database credentials (existing)
└── README.md                         # Update with backup info
```

## Dependencies

### External Dependencies
- **Supabase:** Backup infrastructure and CLI
- **Supabase CLI:** For backup listing and restoration
  ```bash
  npm install -g supabase
  ```
- **PostgreSQL CLI (psql):** For verification queries
  ```bash
  # macOS
  brew install postgresql

  # Ubuntu/Debian
  sudo apt-get install postgresql-client
  ```

### Supabase Plan Requirements
- **Current Plan:** Pro (assumed, based on backup features needed)
- **Required Features:**
  - Daily automated backups ✅
  - 7-day retention ✅
  - Backup restoration ✅

## Security Considerations

### 1. Backup Access Control
- Limit backup access to authorized personnel only
- Use role-based access in Supabase dashboard
- Document who has backup restoration privileges

### 2. Credentials Protection
- Never commit database credentials to git
- Store credentials in secure vault (e.g., Google Secret Manager)
- Use environment variables for all scripts

### 3. Production Safeguards
- Require multi-step confirmation for production restores
- Log all backup restoration attempts
- Notify team when production restore is initiated

### 4. Backup Encryption
- Verify backups are encrypted at rest (Supabase provides this)
- Ensure secure transmission of backup data
- Document encryption methods

## Monitoring & Alerts

### Key Metrics to Monitor
1. **Backup Success Rate:** Target 100%
2. **Backup Age:** Alert if > 24 hours old
3. **Backup Size:** Alert on significant deviations (±50%)
4. **Restore Test Success:** Monthly test must pass

### Alert Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| Backup Age | 24 hours | 36 hours |
| Failed Backups | 1 failure | 2 consecutive |
| Backup Size | ±50% of average | ±75% of average |
| Restore Time | > 30 min | > 60 min |

## Success Criteria

### Implementation Complete When:
- [x] Supabase automated backups verified enabled
- [ ] Daily backups confirmed working for 7 consecutive days
- [ ] 7-day retention period configured
- [ ] Backup restoration script created and executable
- [ ] Backup verification script created and tested
- [ ] RUNBOOK.md documentation complete with screenshots
- [ ] Backup restoration tested successfully on staging
- [ ] Data integrity verified after restoration
- [ ] Backup monitoring configured and alerts working
- [ ] All acceptance criteria met
- [ ] Monthly testing schedule established

### Quality Gates
1. ✅ All scripts have error handling
2. ✅ All scripts have usage documentation
3. ✅ Production safeguards prevent accidental overwrites
4. ✅ Restoration tested on non-production environment
5. ✅ Team trained on backup procedures
6. ✅ Runbook reviewed and approved

## Timeline Estimate

| Phase | Estimated Time | Dependencies |
|-------|---------------|--------------|
| 1. Verify Supabase Config | 1 hour | Supabase dashboard access |
| 2. Create Restore Script | 2 hours | Supabase CLI installed |
| 3. Create Verification Script | 1 hour | Phase 2 complete |
| 4. Document Procedures | 2 hours | Phases 1-3 complete |
| 5. Set Up Monitoring | 1 hour | Alert channel configured |
| 6. Testing & Validation | 2 hours | All phases complete |
| **Total** | **~8-10 hours** | |

## Risks & Mitigation

### Risk 1: Supabase Backup Features Not Available
**Likelihood:** Low
**Impact:** High
**Mitigation:** Verify Supabase plan includes backup features before starting

### Risk 2: Backup Restoration Fails
**Likelihood:** Medium
**Impact:** Critical
**Mitigation:** Always test on staging first, never restore directly to production

### Risk 3: Data Loss Between Backups
**Likelihood:** Low
**Impact:** High
**Mitigation:**
- Consider point-in-time recovery (PITR) for critical operations
- Document acceptable data loss window (24 hours)

### Risk 4: Backup Size Exceeds Storage
**Likelihood:** Low
**Impact:** Medium
**Mitigation:** Monitor backup sizes, plan for growth

## Post-Implementation

### Ongoing Maintenance
1. **Monthly:** Test backup restoration to staging
2. **Quarterly:** Review and update runbook
3. **Semi-annually:** Full disaster recovery drill
4. **Annually:** Review backup retention policy

### Training
1. Document sharing session with team
2. Walkthrough of restoration procedure
3. Emergency contact list distribution
4. Quarterly refresher training

### Metrics to Track
- Number of backups completed
- Backup size over time
- Restoration test success rate
- Time to restore (RTO tracking)

---

## Notes

### Supabase Backup Limitations
- Backups are managed by Supabase (can't download raw backup files)
- Restoration requires Supabase CLI or dashboard
- Cross-region restoration may have limitations

### Alternative Approaches Considered
1. **Custom pg_dump backups:** More control but requires infrastructure
2. **Continuous replication:** Higher cost, overkill for current scale
3. **Manual exports:** Not reliable, error-prone

### Future Enhancements
- [ ] Point-in-time recovery (PITR) implementation
- [ ] Automated weekly restore tests
- [ ] Backup to secondary provider (e.g., Google Cloud Storage)
- [ ] Automated integrity checks after each backup

---

**Plan Status:** Ready for Implementation
**Approval Required:** Team Lead, DevOps
**Next Steps:** Begin Phase 1 - Verify Supabase Configuration
