#!/bin/bash
# scripts/restore-backup.sh
# Restore database from Supabase backup
#
# Usage: ./scripts/restore-backup.sh <backup_id> [target_env]
#
# Arguments:
#   backup_id    - Supabase backup ID or timestamp (e.g., "2026-01-17T03:00:00Z")
#   target_env   - Target environment: staging|production (default: staging)
#
# Prerequisites:
#   - Supabase CLI installed: npm install -g supabase
#   - SUPABASE_ACCESS_TOKEN environment variable set
#   - Appropriate permissions for target environment
#
# Examples:
#   ./scripts/restore-backup.sh 2026-01-17T03:00:00Z staging
#   ./scripts/restore-backup.sh 2026-01-17T03:00:00Z production

set -euo pipefail

# Configuration
BACKUP_ID="${1:-}"
TARGET_ENV="${2:-staging}"
PROJECT_REF="jnwlzawkfqcxdtkhwokd"
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/restore-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

    # Also output to console
    case "$level" in
        ERROR)
            echo -e "${RED}[$level]${NC} $message"
            ;;
        SUCCESS)
            echo -e "${GREEN}[$level]${NC} $message"
            ;;
        WARNING)
            echo -e "${YELLOW}[$level]${NC} $message"
            ;;
        INFO)
            echo -e "${BLUE}[$level]${NC} $message"
            ;;
        *)
            echo "[$level] $message"
            ;;
    esac
}

# Usage function
usage() {
    cat << EOF
Usage: ./scripts/restore-backup.sh <backup_id> [target_env]

Arguments:
  backup_id    - Supabase backup ID or timestamp
  target_env   - Target environment (staging|production) [default: staging]

Example:
  ./scripts/restore-backup.sh 2026-01-17T03:00:00Z staging

Prerequisites:
  - Supabase CLI installed (npm install -g supabase)
  - SUPABASE_ACCESS_TOKEN environment variable set
  - Appropriate permissions for target environment

Environment Variables:
  SUPABASE_ACCESS_TOKEN - Authentication token for Supabase CLI
  DATABASE_URL_STAGING  - Staging database connection string (optional)
  DATABASE_URL_PROD     - Production database connection string (optional)
EOF
    exit 1
}

# Validate arguments
if [ -z "$BACKUP_ID" ]; then
    log ERROR "Backup ID is required"
    echo ""
    usage
fi

# Validate environment
if [[ ! "$TARGET_ENV" =~ ^(staging|production)$ ]]; then
    log ERROR "Invalid environment: $TARGET_ENV (must be 'staging' or 'production')"
    exit 1
fi

# Display header
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  DATABASE BACKUP RESTORATION${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Backup ID:     $BACKUP_ID"
echo "Target:        $TARGET_ENV"
echo "Project:       $PROJECT_REF"
echo "Log File:      $LOG_FILE"
echo ""

log INFO "Starting backup restoration: Backup=$BACKUP_ID, Target=$TARGET_ENV"

# Production protection
if [ "$TARGET_ENV" = "production" ]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}🚨 WARNING: PRODUCTION RESTORE${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "This will OVERWRITE all current production data!"
    echo ""
    echo -e "${YELLOW}⚠️  DATA LOSS RISK:${NC}"
    echo "   - All data created after backup will be PERMANENTLY LOST"
    echo "   - All users will be temporarily disconnected"
    echo "   - Application will be unavailable during restore"
    echo "   - This operation CANNOT be easily undone"
    echo ""
    echo -e "${YELLOW}BEFORE PROCEEDING:${NC}"
    echo "   1. Have you notified the team?"
    echo "   2. Have you created a manual backup?"
    echo "   3. Is there a rollback plan?"
    echo "   4. Have you tested this restore in staging?"
    echo ""

    log WARNING "Production restore initiated - awaiting confirmation"

    read -p "Type 'RESTORE PRODUCTION' to confirm (case-sensitive): " confirm
    if [ "$confirm" != "RESTORE PRODUCTION" ]; then
        log INFO "Production restore cancelled by user"
        echo -e "${YELLOW}Restore cancelled.${NC}"
        exit 0
    fi

    log WARNING "Production restore confirmed by user"
else
    echo -e "${YELLOW}Restoring to $TARGET_ENV environment.${NC}"
    echo ""
    read -p "Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log INFO "Restore cancelled by user"
        echo -e "${YELLOW}Restore cancelled.${NC}"
        exit 0
    fi

    log INFO "Restore confirmed by user"
fi

# Check prerequisites
echo ""
echo -e "${GREEN}📋 Checking prerequisites...${NC}"
log INFO "Checking prerequisites"

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    log ERROR "Supabase CLI not found"
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo ""
    echo "Install with:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or using Homebrew:"
    echo "  brew install supabase/tap/supabase"
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI installed${NC}"
log INFO "Supabase CLI found: $(command -v supabase)"

# Check Supabase CLI version
SUPABASE_VERSION=$(supabase --version 2>/dev/null || echo "unknown")
echo "   Version: $SUPABASE_VERSION"
log INFO "Supabase CLI version: $SUPABASE_VERSION"

# Check authentication
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
    log ERROR "SUPABASE_ACCESS_TOKEN not set"
    echo -e "${RED}❌ SUPABASE_ACCESS_TOKEN not set${NC}"
    echo ""
    echo "Set authentication token:"
    echo "  export SUPABASE_ACCESS_TOKEN=your_token_here"
    echo ""
    echo "Get your token from:"
    echo "  https://app.supabase.com/account/tokens"
    exit 1
fi
echo -e "${GREEN}✅ Supabase authentication configured${NC}"
log INFO "SUPABASE_ACCESS_TOKEN is set"

# List available backups (for verification)
echo ""
echo -e "${GREEN}📦 Listing available backups...${NC}"
log INFO "Fetching available backups"

if ! supabase backups list --project-ref "$PROJECT_REF" 2>&1 | tee -a "$LOG_FILE"; then
    log ERROR "Failed to list backups"
    echo ""
    echo -e "${RED}❌ Failed to list backups${NC}"
    echo ""
    echo "Possible causes:"
    echo "  - Invalid SUPABASE_ACCESS_TOKEN"
    echo "  - Insufficient permissions"
    echo "  - Network connectivity issues"
    echo "  - Invalid project reference"
    echo ""
    echo "Check log file for details: $LOG_FILE"
    exit 1
fi

# Confirm backup ID exists
echo ""
read -p "Is the backup ID '$BACKUP_ID' listed above? (yes/no): " backup_exists
if [ "$backup_exists" != "yes" ]; then
    log ERROR "Backup ID not confirmed by user"
    echo -e "${RED}❌ Backup verification failed${NC}"
    echo "Please verify the backup ID and try again."
    exit 1
fi

log INFO "Backup ID verified by user"

# Perform restoration
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔄 Starting restore process...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "This may take several minutes depending on database size."
echo "Please do not interrupt this process."
echo ""

log INFO "Starting database restore"
START_TIME=$(date +%s)

# Note: The exact Supabase CLI restore command may vary by version
# As of 2026, typical commands are:
#   supabase db restore --backup-id "$BACKUP_ID" --project-ref "$PROJECT_REF"
# Or via dashboard restoration API
# Check latest Supabase CLI documentation for exact syntax

# Attempt restore with error handling
if supabase db restore \
    --backup-id "$BACKUP_ID" \
    --project-ref "$PROJECT_REF" \
    2>&1 | tee -a "$LOG_FILE"; then

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Restore complete${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Restore completed in: ${DURATION}s"
    echo ""

    log SUCCESS "Database restore completed in ${DURATION}s"
else
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ Restore failed!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Failed after: ${DURATION}s"
    echo ""

    log ERROR "Database restore failed after ${DURATION}s"

    echo "Possible causes:"
    echo "  - Invalid backup ID"
    echo "  - Insufficient permissions"
    echo "  - Backup corrupted or unavailable"
    echo "  - Network connectivity issues"
    echo "  - Database compatibility issues"
    echo ""
    echo "Next steps:"
    echo "  1. Check log file: $LOG_FILE"
    echo "  2. Verify backup ID: supabase backups list --project-ref $PROJECT_REF"
    echo "  3. Check Supabase dashboard for backup status"
    echo "  4. Contact Supabase support if issue persists"
    echo ""
    echo "Supabase Support:"
    echo "  - Email: support@supabase.com"
    echo "  - Dashboard: https://app.supabase.com/support"
    echo "  - Status: https://status.supabase.com"
    exit 1
fi

# Post-restore instructions
echo -e "${YELLOW}⚠️  IMPORTANT: Verify data integrity${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Run verification script:"
echo "   ./scripts/verify-backup.sh $TARGET_ENV"
echo ""
echo "2. Manual verification checklist:"
echo "   □ Check organization count matches expected"
echo "   □ Verify project count is reasonable"
echo "   □ Test user authentication in application"
echo "   □ Check latest project timestamp"
echo "   □ Verify no console errors in application"
echo "   □ Test critical features (seed generation, budget calc)"
echo ""
echo "3. If verification fails:"
echo "   - DO NOT proceed to production"
echo "   - Refer to RUNBOOK.md for rollback procedures"
echo "   - Contact team lead for guidance"
echo ""
echo "4. If verification passes:"
echo "   - Document results in RUNBOOK.md"
echo "   - Update team on successful restore"
echo "   - Consider creating manual backup of current state"
echo ""

log INFO "Restore process completed - awaiting verification"

echo "Log file saved to: $LOG_FILE"
echo ""
