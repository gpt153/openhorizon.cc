# Database Backup & Recovery - Quick Reference

## 🚨 Emergency Restore Procedure

### If Production Database Fails

```bash
# 1. List available backups
supabase db backups list --project-ref jnwlzawkfqcxdtkhwokd

# 2. Restore to staging FIRST
./scripts/restore-backup.sh <backup-id> staging

# 3. Verify restored data
./scripts/verify-backup.sh

# 4. If verification passes, restore to production
./scripts/restore-backup.sh <backup-id> production

# 5. Verify production
./scripts/verify-backup.sh
```

## 📋 Key Information

### Supabase Project Details
```
Project Name: OpenHorizon.cc
Project Ref:  jnwlzawkfqcxdtkhwokd
Region:       aws-1-eu-west-1
Database:     PostgreSQL (pooled via pgbouncer)
```

### Backup Schedule
- **Frequency:** Daily at 03:00 UTC
- **Retention:** 7 days
- **Location:** Supabase managed storage (encrypted)

### Recovery Objectives
- **RTO (Recovery Time):** 2 hours target, 4 hours max
- **RPO (Recovery Point):** 24 hours (daily backups)
- **Data Loss:** Maximum 1 day acceptable

## 📁 File Locations

```
openhorizon.cc/
├── scripts/
│   ├── restore-backup.sh     # Restore from backup
│   ├── verify-backup.sh      # Verify data integrity
│   └── check-backups.sh      # Monitor backup health
├── docs/
│   └── RUNBOOK.md            # Full operations guide
└── .plans/
    ├── issue-135-database-backup-recovery.md  # Detailed plan
    └── IMPLEMENTATION_SUMMARY.md              # Summary
```

## 🔐 Critical Commands

### List Backups
```bash
supabase db backups list --project-ref jnwlzawkfqcxdtkhwokd
```

### Check Database Connection
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### Count Critical Records
```bash
psql $DATABASE_URL -c "
  SELECT 'organizations' AS table, COUNT(*) FROM organizations
  UNION ALL
  SELECT 'projects', COUNT(*) FROM projects
  UNION ALL
  SELECT 'budgets', COUNT(*) FROM budgets;
"
```

### Check Backup Age
```bash
./scripts/check-backups.sh
```

## ⚠️ Safety Rules

1. **ALWAYS restore to staging first**
2. **NEVER restore directly to production without testing**
3. **ALWAYS verify data integrity after restore**
4. **ALWAYS notify team before production restore**
5. **ALWAYS log restoration attempts**

## 📞 Emergency Contacts

### Escalation Path
1. **On-call Engineer:** [TBD]
2. **Database Admin:** [TBD]
3. **Team Lead:** team-lead@openhorizon.cc
4. **Supabase Support:** support@supabase.com

### Supabase Dashboard
https://supabase.com/dashboard/project/jnwlzawkfqcxdtkhwokd

## 🧪 Testing Schedule

### Daily (Automated)
- ✅ Backup completed successfully
- ✅ Backup size within expected range
- ✅ Backup age < 24 hours

### Monthly (Manual)
- ✅ Restore random backup to staging
- ✅ Verify data integrity
- ✅ Test application functionality
- ✅ Document results

### Semi-Annual (Manual)
- ✅ Full disaster recovery drill
- ✅ Simulate complete database loss
- ✅ Restore to new instance
- ✅ Update procedures based on learnings

## 📊 What Data Gets Backed Up

### Critical Tables
- `organizations` - Swedish nonprofit data
- `projects` - Erasmus+ grant applications (€15K-€30K each)
- `budgets` - Financial data and calculations
- `users` - User accounts and authentication
- All other application tables

### Backup Includes
- All schemas
- All table data
- Indexes and constraints
- Functions and procedures
- Row-level security policies

## 🎯 Common Scenarios

### Scenario 1: Accidental Data Deletion
```bash
# 1. Find backup before deletion
supabase db backups list --project-ref jnwlzawkfqcxdtkhwokd

# 2. Restore to staging
./scripts/restore-backup.sh <backup-before-deletion> staging

# 3. Export just the deleted data
pg_dump $STAGING_URL -t <deleted_table> > recovered-data.sql

# 4. Import to production
psql $PRODUCTION_URL < recovered-data.sql
```

### Scenario 2: Test New Migration
```bash
# 1. Restore latest backup to staging
./scripts/restore-backup.sh <latest-backup> staging

# 2. Run migration on staging
cd app
DATABASE_URL=$STAGING_URL npx prisma migrate dev

# 3. Verify migration
./scripts/verify-backup.sh

# 4. If good, run on production
DATABASE_URL=$PRODUCTION_URL npx prisma migrate deploy
```

### Scenario 3: Clone Production to Development
```bash
# 1. Get latest backup
supabase db backups list --project-ref jnwlzawkfqcxdtkhwokd --limit 1

# 2. Restore to development database
./scripts/restore-backup.sh <latest-backup> development

# 3. Verify and sanitize PII
./scripts/verify-backup.sh
# Run sanitization script to remove sensitive data
```

## 📈 Monitoring Checklist

### Daily Automated Checks
- [ ] Backup completed successfully
- [ ] Backup size: 50MB - 500MB (adjust range as needed)
- [ ] Backup age < 24 hours
- [ ] No backup errors in logs

### Weekly Manual Checks
- [ ] Review backup logs
- [ ] Check backup size trend
- [ ] Verify retention policy
- [ ] Test backup access

### Monthly Manual Checks
- [ ] Test restoration to staging
- [ ] Verify data integrity
- [ ] Test application with restored data
- [ ] Update documentation if needed
- [ ] Review and update this runbook

## 🔧 Troubleshooting

### Backup Not Found
```bash
# Check project ref is correct
echo "jnwlzawkfqcxdtkhwokd"

# Verify Supabase CLI is authenticated
supabase login

# Try listing with explicit auth
supabase db backups list --project-ref jnwlzawkfqcxdtkhwokd
```

### Restore Fails
```bash
# Check Supabase CLI version
supabase --version

# Update if needed
npm install -g supabase@latest

# Check project permissions
# Ensure user has database admin access
```

### Verification Fails
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check table permissions
psql $DATABASE_URL -c "\dt"

# Check for missing tables
psql $DATABASE_URL -c "
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
"
```

## 📝 Logging

All backup operations should be logged:

```bash
# Log restoration attempt
echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") - Restore initiated: backup=$BACKUP_ID env=$TARGET_ENV user=$USER" >> /var/log/backup-restore.log

# Log verification
echo "$(date -u +"%Y-%m-%d %H:%M:%S UTC") - Verification: status=$STATUS tables=$TABLE_COUNT" >> /var/log/backup-restore.log
```

## 🎓 Training Checklist

New team members should:
- [ ] Read full RUNBOOK.md
- [ ] Understand backup schedule and retention
- [ ] Practice restoration on staging
- [ ] Run verification script
- [ ] Simulate data recovery scenario
- [ ] Know emergency contacts
- [ ] Understand safety rules

---

**Last Updated:** 2026-01-17
**Next Review:** 2026-02-17
**Owner:** DevOps Team

**Quick Links:**
- [Full Implementation Plan](.plans/issue-135-database-backup-recovery.md)
- [Implementation Summary](.plans/IMPLEMENTATION_SUMMARY.md)
- [Supabase Dashboard](https://supabase.com/dashboard/project/jnwlzawkfqcxdtkhwokd)
- [Epic 003: Production Readiness](https://github.com/gpt153/openhorizon-planning/blob/main/.bmad/epics/003-production-readiness.md)
