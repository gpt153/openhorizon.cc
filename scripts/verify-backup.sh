#!/bin/bash
# scripts/verify-backup.sh
# Verify database backup integrity after restoration
#
# Usage: ./scripts/verify-backup.sh [target_env]
#
# Arguments:
#   target_env   - Target environment: staging|production (default: staging)
#
# Prerequisites:
#   - psql (PostgreSQL client) installed
#   - DATABASE_URL environment variable set (or env-specific variant)
#
# Examples:
#   ./scripts/verify-backup.sh staging
#   ./scripts/verify-backup.sh production

set -euo pipefail

TARGET_ENV="${1:-staging}"
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/verify-$(date +%Y%m%d-%H%M%S).log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Create log directory if it doesn't exist
    mkdir -p "$LOG_DIR"

    # Log to file
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Usage function
usage() {
    cat << EOF
Usage: ./scripts/verify-backup.sh [target_env]

Arguments:
  target_env   - Target environment (staging|production) [default: staging]

Example:
  ./scripts/verify-backup.sh staging

Prerequisites:
  - psql (PostgreSQL client) installed
  - DATABASE_URL environment variable set

Environment Variables:
  DATABASE_URL          - Default database connection string
  DATABASE_URL_STAGING  - Staging database connection string
  DATABASE_URL_PROD     - Production database connection string
EOF
    exit 1
}

# Validate environment
if [[ ! "$TARGET_ENV" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $TARGET_ENV${NC}"
    echo "   Must be 'staging' or 'production'"
    exit 1
fi

# Get appropriate database URL
if [ "$TARGET_ENV" = "production" ]; then
    DATABASE_URL="${DATABASE_URL_PROD:-${DATABASE_URL:-}}"
elif [ "$TARGET_ENV" = "staging" ]; then
    DATABASE_URL="${DATABASE_URL_STAGING:-${DATABASE_URL:-}}"
else
    DATABASE_URL="${DATABASE_URL:-}"
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set for environment: $TARGET_ENV${NC}"
    echo ""
    echo "Set the appropriate environment variable:"
    echo "  export DATABASE_URL_STAGING='your_connection_string'"
    echo "  export DATABASE_URL_PROD='your_connection_string'"
    echo ""
    echo "Or use the default:"
    echo "  export DATABASE_URL='your_connection_string'"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql (PostgreSQL client) not found${NC}"
    echo ""
    echo "Install psql:"
    echo "  macOS:   brew install postgresql"
    echo "  Ubuntu:  sudo apt-get install postgresql-client"
    echo "  Debian:  sudo apt-get install postgresql-client"
    exit 1
fi

# Display header
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔍 BACKUP VERIFICATION${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Environment: $TARGET_ENV"
echo "Log File:    $LOG_FILE"
echo ""

log INFO "Starting backup verification for $TARGET_ENV"

# Test database connectivity
echo -e "${YELLOW}Testing database connection...${NC}"
log INFO "Testing database connection"

if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
    log INFO "Database connection successful"

    # Get database version
    DB_VERSION=$(psql "$DATABASE_URL" -t -c "SELECT version();" 2>/dev/null | head -1 | xargs)
    echo "   Version: PostgreSQL $(echo $DB_VERSION | grep -oP '\d+\.\d+' | head -1)"
    log INFO "Database version: $DB_VERSION"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    log ERROR "Database connection failed"
    echo ""
    echo "Possible causes:"
    echo "  - Database is down"
    echo "  - Invalid connection string"
    echo "  - Network connectivity issues"
    echo "  - Firewall blocking connection"
    exit 1
fi
echo ""

# Check critical tables exist
echo -e "${YELLOW}Checking critical tables...${NC}"
log INFO "Checking critical tables"

TABLES=("Organisation" "User" "Project" "Seed" "Budget")
FAILED_TABLES=()

for table in "${TABLES[@]}"; do
    echo -n "  Checking '$table'... "

    COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pipeline.\"$table\";" 2>/dev/null || echo "ERROR")

    if [ "$COUNT" = "ERROR" ]; then
        echo -e "${RED}❌ FAILED${NC}"
        echo "     (table not found or inaccessible)"
        FAILED_TABLES+=("$table")
        log ERROR "Table check failed: $table"
    else
        # Trim whitespace
        COUNT=$(echo "$COUNT" | xargs)
        echo -e "${GREEN}✅ OK${NC} (${COUNT} records)"
        log INFO "Table $table: $COUNT records"
    fi
done

if [ ${#FAILED_TABLES[@]} -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Table verification failed${NC}"
    echo "   Failed tables: ${FAILED_TABLES[*]}"
    log ERROR "Table verification failed: ${FAILED_TABLES[*]}"
    exit 1
fi
echo ""

# Verify database constraints
echo -e "${YELLOW}Verifying database constraints...${NC}"
log INFO "Verifying database constraints"

CONSTRAINT_COUNT=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*)
    FROM pg_constraint
    WHERE contype IN ('p', 'f', 'u')
        AND connamespace = 'pipeline'::regnamespace;
" 2>/dev/null || echo "0")

CONSTRAINT_COUNT=$(echo "$CONSTRAINT_COUNT" | xargs)

if [ "$CONSTRAINT_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Database constraints intact${NC} (${CONSTRAINT_COUNT} constraints)"
    log INFO "Database constraints: $CONSTRAINT_COUNT found"

    # List constraint types
    echo "   Constraint breakdown:"
    psql "$DATABASE_URL" -t -c "
        SELECT
            CASE contype
                WHEN 'p' THEN 'Primary Key'
                WHEN 'f' THEN 'Foreign Key'
                WHEN 'u' THEN 'Unique'
            END AS constraint_type,
            COUNT(*) as count
        FROM pg_constraint
        WHERE contype IN ('p', 'f', 'u')
            AND connamespace = 'pipeline'::regnamespace
        GROUP BY contype
        ORDER BY count DESC;
    " 2>/dev/null | while read line; do
        if [ ! -z "$line" ]; then
            echo "   - $line"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Warning: No constraints found${NC}"
    echo "   This is unexpected and may indicate a schema issue"
    log WARNING "No database constraints found"
fi
echo ""

# Check data freshness
echo -e "${YELLOW}Checking data freshness...${NC}"
log INFO "Checking data freshness"

# Latest project
LATEST_PROJECT=$(psql "$DATABASE_URL" -t -c "
    SELECT MAX(\"createdAt\")
    FROM pipeline.\"Project\";
" 2>/dev/null || echo "NO_DATA")

LATEST_PROJECT=$(echo "$LATEST_PROJECT" | xargs)

if [ "$LATEST_PROJECT" != "NO_DATA" ] && [ ! -z "$LATEST_PROJECT" ]; then
    echo -e "${GREEN}✅ Latest project:${NC} $LATEST_PROJECT"
    log INFO "Latest project: $LATEST_PROJECT"
else
    echo -e "${YELLOW}⚠️  No project data found${NC}"
    log WARNING "No project data found"
fi

# Latest seed
LATEST_SEED=$(psql "$DATABASE_URL" -t -c "
    SELECT MAX(\"createdAt\")
    FROM pipeline.\"Seed\";
" 2>/dev/null || echo "NO_DATA")

LATEST_SEED=$(echo "$LATEST_SEED" | xargs)

if [ "$LATEST_SEED" != "NO_DATA" ] && [ ! -z "$LATEST_SEED" ]; then
    echo -e "${GREEN}✅ Latest seed:${NC} $LATEST_SEED"
    log INFO "Latest seed: $LATEST_SEED"
else
    echo -e "${YELLOW}⚠️  No seed data found${NC}"
    log WARNING "No seed data found"
fi
echo ""

# Check for orphaned records (data integrity)
echo -e "${YELLOW}Checking referential integrity...${NC}"
log INFO "Checking referential integrity"

# Check for orphaned projects (projects without organizations)
ORPHANED_PROJECTS=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*)
    FROM pipeline.\"Project\" p
    LEFT JOIN pipeline.\"Organisation\" o ON p.\"organisationId\" = o.id
    WHERE o.id IS NULL;
" 2>/dev/null || echo "ERROR")

ORPHANED_PROJECTS=$(echo "$ORPHANED_PROJECTS" | xargs)

if [ "$ORPHANED_PROJECTS" = "ERROR" ]; then
    echo -e "${RED}❌ Integrity check failed${NC}"
    log ERROR "Orphaned projects check failed"
elif [ "$ORPHANED_PROJECTS" = "0" ]; then
    echo -e "${GREEN}✅ No orphaned projects${NC}"
    log INFO "No orphaned projects found"
else
    echo -e "${RED}❌ Found ${ORPHANED_PROJECTS} orphaned projects${NC}"
    echo "   (Projects without valid organization references)"
    log ERROR "Found $ORPHANED_PROJECTS orphaned projects"
    exit 1
fi

# Check for orphaned seeds
ORPHANED_SEEDS=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*)
    FROM pipeline.\"Seed\" s
    LEFT JOIN pipeline.\"Organisation\" o ON s.\"organisationId\" = o.id
    WHERE o.id IS NULL;
" 2>/dev/null || echo "ERROR")

ORPHANED_SEEDS=$(echo "$ORPHANED_SEEDS" | xargs)

if [ "$ORPHANED_SEEDS" = "ERROR" ]; then
    echo -e "${YELLOW}⚠️  Seed integrity check failed${NC}"
    log WARNING "Orphaned seeds check failed"
elif [ "$ORPHANED_SEEDS" = "0" ]; then
    echo -e "${GREEN}✅ No orphaned seeds${NC}"
    log INFO "No orphaned seeds found"
else
    echo -e "${RED}❌ Found ${ORPHANED_SEEDS} orphaned seeds${NC}"
    log ERROR "Found $ORPHANED_SEEDS orphaned seeds"
fi
echo ""

# Database size check
echo -e "${YELLOW}Checking database size...${NC}"
log INFO "Checking database size"

DB_SIZE=$(psql "$DATABASE_URL" -t -c "
    SELECT pg_size_pretty(pg_database_size(current_database()));
" 2>/dev/null || echo "UNKNOWN")

DB_SIZE=$(echo "$DB_SIZE" | xargs)

if [ "$DB_SIZE" != "UNKNOWN" ]; then
    echo -e "${GREEN}✅ Database size:${NC} $DB_SIZE"
    log INFO "Database size: $DB_SIZE"
fi
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Backup verification complete${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

log INFO "Backup verification completed successfully"

# Next steps
echo -e "${BLUE}📋 Next steps:${NC}"
echo ""
echo "1. Manual application testing:"
echo "   □ Test user authentication"
echo "   □ Verify application pages load correctly"
echo "   □ Check dashboard functionality"
echo "   □ Test project creation/viewing"
echo "   □ Verify seed generation works"
echo "   □ Test budget calculator"
echo "   □ Check for console errors"
echo ""
echo "2. If all tests pass:"
echo "   □ Document results in RUNBOOK.md"
echo "   □ Update team on successful verification"
echo "   □ Mark restoration as successful"
echo ""
echo "3. If tests fail:"
echo "   □ DO NOT proceed to production"
echo "   □ Review log file: $LOG_FILE"
echo "   □ Refer to RUNBOOK.md for rollback procedures"
echo "   □ Contact team lead for guidance"
echo ""
echo "4. For production restores:"
echo "   □ Create manual backup of current state"
echo "   □ Notify team of restore completion"
echo "   □ Monitor application for 24 hours"
echo "   □ Document any anomalies"
echo ""

echo "Log file saved to: $LOG_FILE"
echo ""
