#!/bin/bash
# scripts/check-backups.sh
# Monitor backup health and alert if backups are missing or outdated
#
# Usage: ./scripts/check-backups.sh
#
# This script can be run:
#   - Manually for health checks
#   - Via cron for automated monitoring
#   - Via Cloud Scheduler for cloud-based monitoring
#
# Prerequisites:
#   - Supabase CLI installed: npm install -g supabase
#   - SUPABASE_ACCESS_TOKEN environment variable set
#   - jq installed (for JSON parsing)
#
# Example cron entry (daily at 9 AM):
#   0 9 * * * /path/to/check-backups.sh
#
# Environment Variables:
#   SUPABASE_ACCESS_TOKEN - Authentication token for Supabase CLI
#   BACKUP_MAX_AGE_HOURS  - Maximum backup age before alerting (default: 24)
#   ALERT_EMAIL          - Email address for alerts (optional)
#   SLACK_WEBHOOK_URL    - Slack webhook for alerts (optional)

set -euo pipefail

# Configuration
PROJECT_REF="jnwlzawkfqcxdtkhwokd"
MAX_AGE_HOURS="${BACKUP_MAX_AGE_HOURS:-24}"
ALERT_EMAIL="${ALERT_EMAIL:-}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/backup-check-$(date +%Y%m%d-%H%M%S).log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# Alert function
send_alert() {
    local severity="$1"
    local title="$2"
    local message="$3"

    log "ALERT" "$severity: $title - $message"

    # Send email alert if configured
    if [ ! -z "$ALERT_EMAIL" ]; then
        if command -v mail &> /dev/null; then
            echo "$message" | mail -s "[$severity] OpenHorizon Backup Alert: $title" "$ALERT_EMAIL"
            log "INFO" "Email alert sent to $ALERT_EMAIL"
        else
            log "WARNING" "mail command not found, cannot send email alert"
        fi
    fi

    # Send Slack alert if configured
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        if command -v curl &> /dev/null; then
            local color="danger"
            if [ "$severity" = "WARNING" ]; then
                color="warning"
            elif [ "$severity" = "INFO" ]; then
                color="good"
            fi

            curl -X POST "$SLACK_WEBHOOK_URL" \
                -H 'Content-Type: application/json' \
                -d "{
                    \"attachments\": [{
                        \"color\": \"$color\",
                        \"title\": \"[$severity] OpenHorizon Backup Alert\",
                        \"text\": \"$title\",
                        \"fields\": [{
                            \"title\": \"Details\",
                            \"value\": \"$message\",
                            \"short\": false
                        }],
                        \"footer\": \"OpenHorizon Backup Monitor\",
                        \"ts\": $(date +%s)
                    }]
                }" &> /dev/null
            log "INFO" "Slack alert sent"
        else
            log "WARNING" "curl not found, cannot send Slack alert"
        fi
    fi
}

# Display header
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🔍 BACKUP HEALTH CHECK${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Project:         $PROJECT_REF"
echo "Max Age:         $MAX_AGE_HOURS hours"
echo "Check Time:      $(date '+%Y-%m-%d %H:%M:%S')"
echo "Log File:        $LOG_FILE"
echo ""

log "INFO" "Starting backup health check"

# Check prerequisites
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    log "ERROR" "Supabase CLI not installed"
    send_alert "CRITICAL" "Supabase CLI Missing" "Cannot perform backup health check - Supabase CLI not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq not found${NC}"
    log "ERROR" "jq not installed"
    echo ""
    echo "Install jq:"
    echo "  macOS:   brew install jq"
    echo "  Ubuntu:  sudo apt-get install jq"
    exit 1
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
    echo -e "${RED}❌ SUPABASE_ACCESS_TOKEN not set${NC}"
    log "ERROR" "SUPABASE_ACCESS_TOKEN not configured"
    send_alert "CRITICAL" "Authentication Missing" "Cannot check backups - SUPABASE_ACCESS_TOKEN not set"
    exit 1
fi

# Fetch backup list
echo -e "${YELLOW}Fetching backup information...${NC}"
log "INFO" "Fetching backup list from Supabase"

BACKUP_LIST=$(supabase backups list --project-ref "$PROJECT_REF" --output json 2>&1 || echo "ERROR")

if [ "$BACKUP_LIST" = "ERROR" ] || [ -z "$BACKUP_LIST" ]; then
    echo -e "${RED}❌ Failed to fetch backup list${NC}"
    log "ERROR" "Failed to fetch backup list"
    send_alert "CRITICAL" "Backup List Fetch Failed" "Cannot retrieve backup information from Supabase. Check authentication and network connectivity."
    exit 1
fi

# Parse backup information
echo -e "${YELLOW}Analyzing backups...${NC}"

# Get latest backup
LATEST_BACKUP=$(echo "$BACKUP_LIST" | jq -r '.[0]' 2>/dev/null || echo "null")

if [ "$LATEST_BACKUP" = "null" ] || [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}❌ No backups found${NC}"
    log "CRITICAL" "No backups found for project"
    send_alert "CRITICAL" "No Backups Found" "No backups exist for project $PROJECT_REF. Automated backups may not be enabled!"
    exit 1
fi

# Extract backup details
BACKUP_ID=$(echo "$LATEST_BACKUP" | jq -r '.id // .backup_id // "unknown"' 2>/dev/null)
BACKUP_TIME=$(echo "$LATEST_BACKUP" | jq -r '.created_at // .timestamp // "unknown"' 2>/dev/null)
BACKUP_STATUS=$(echo "$LATEST_BACKUP" | jq -r '.status // "unknown"' 2>/dev/null)
BACKUP_SIZE=$(echo "$LATEST_BACKUP" | jq -r '.size // "unknown"' 2>/dev/null)

echo ""
echo "Latest Backup:"
echo "  ID:        $BACKUP_ID"
echo "  Created:   $BACKUP_TIME"
echo "  Status:    $BACKUP_STATUS"
echo "  Size:      $BACKUP_SIZE"
echo ""

log "INFO" "Latest backup: ID=$BACKUP_ID, Time=$BACKUP_TIME, Status=$BACKUP_STATUS"

# Calculate backup age
if [ "$BACKUP_TIME" != "unknown" ]; then
    CURRENT_TIME=$(date -u +%s)
    BACKUP_TIMESTAMP=$(date -u -d "$BACKUP_TIME" +%s 2>/dev/null || echo "0")

    if [ "$BACKUP_TIMESTAMP" = "0" ]; then
        echo -e "${YELLOW}⚠️  Cannot parse backup timestamp${NC}"
        log "WARNING" "Cannot parse backup timestamp: $BACKUP_TIME"
    else
        AGE_SECONDS=$((CURRENT_TIME - BACKUP_TIMESTAMP))
        AGE_HOURS=$((AGE_SECONDS / 3600))
        AGE_DAYS=$((AGE_HOURS / 24))

        echo "Backup Age:"
        if [ "$AGE_DAYS" -gt 0 ]; then
            echo "  ${AGE_DAYS} days, $((AGE_HOURS % 24)) hours"
        else
            echo "  ${AGE_HOURS} hours"
        fi
        echo ""

        log "INFO" "Backup age: ${AGE_HOURS} hours"

        # Check if backup is too old
        if [ "$AGE_HOURS" -gt "$MAX_AGE_HOURS" ]; then
            echo -e "${RED}❌ ALERT: Backup is too old!${NC}"
            echo "   Latest backup is ${AGE_HOURS} hours old (threshold: ${MAX_AGE_HOURS} hours)"
            echo ""
            log "CRITICAL" "Backup too old: ${AGE_HOURS} hours (threshold: ${MAX_AGE_HOURS})"

            send_alert "CRITICAL" \
                "Backup Too Old" \
                "Latest backup is ${AGE_HOURS} hours old (threshold: ${MAX_AGE_HOURS} hours). Backup ID: $BACKUP_ID. Check Supabase backup configuration immediately."
            exit 1
        fi
    fi
fi

# Check backup status
if [ "$BACKUP_STATUS" != "completed" ] && [ "$BACKUP_STATUS" != "success" ] && [ "$BACKUP_STATUS" != "unknown" ]; then
    echo -e "${RED}❌ ALERT: Backup status is not completed!${NC}"
    echo "   Status: $BACKUP_STATUS"
    echo ""
    log "CRITICAL" "Backup status: $BACKUP_STATUS (expected: completed)"

    send_alert "CRITICAL" \
        "Backup Status Abnormal" \
        "Latest backup status is '$BACKUP_STATUS' (expected: completed). Backup ID: $BACKUP_ID. Check Supabase dashboard for details."
    exit 1
fi

# Check backup size (optional - only if size info available)
if [ "$BACKUP_SIZE" != "unknown" ] && [ "$BACKUP_SIZE" != "null" ]; then
    # Extract numeric size (assuming format like "123MB" or "1.5GB")
    SIZE_NUM=$(echo "$BACKUP_SIZE" | grep -oP '[\d.]+' | head -1)
    SIZE_UNIT=$(echo "$BACKUP_SIZE" | grep -oP '[A-Z]+' | head -1)

    if [ ! -z "$SIZE_NUM" ]; then
        # Convert to MB for comparison
        SIZE_MB=$SIZE_NUM
        if [ "$SIZE_UNIT" = "GB" ]; then
            SIZE_MB=$(echo "$SIZE_NUM * 1024" | bc)
        elif [ "$SIZE_UNIT" = "KB" ]; then
            SIZE_MB=$(echo "$SIZE_NUM / 1024" | bc)
        fi

        # Warn if backup is suspiciously small (<1MB) or large (>10GB)
        if (( $(echo "$SIZE_MB < 1" | bc -l) )); then
            echo -e "${YELLOW}⚠️  WARNING: Backup size is very small (${BACKUP_SIZE})${NC}"
            log "WARNING" "Backup size unusually small: $BACKUP_SIZE"
            send_alert "WARNING" \
                "Backup Size Unusually Small" \
                "Latest backup size is only ${BACKUP_SIZE}. This may indicate an incomplete backup. Backup ID: $BACKUP_ID"
        elif (( $(echo "$SIZE_MB > 10240" | bc -l) )); then
            echo -e "${YELLOW}⚠️  INFO: Backup size is very large (${BACKUP_SIZE})${NC}"
            log "INFO" "Backup size large: $BACKUP_SIZE"
        fi
    fi
fi

# Count total backups
TOTAL_BACKUPS=$(echo "$BACKUP_LIST" | jq '. | length' 2>/dev/null || echo "unknown")

echo "Total Backups: $TOTAL_BACKUPS"
log "INFO" "Total backups available: $TOTAL_BACKUPS"

# Recommend retention check if low
if [ "$TOTAL_BACKUPS" != "unknown" ] && [ "$TOTAL_BACKUPS" -lt 3 ]; then
    echo -e "${YELLOW}⚠️  INFO: Low backup count${NC}"
    echo "   Consider increasing retention period if only ${TOTAL_BACKUPS} backups available"
fi
echo ""

# Success summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Backup health check passed${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Summary:"
echo "  ✅ Latest backup exists"
echo "  ✅ Backup age acceptable (${AGE_HOURS:-unknown} hours < ${MAX_AGE_HOURS} hours)"
echo "  ✅ Backup status: $BACKUP_STATUS"
echo "  ✅ Total backups: $TOTAL_BACKUPS"
echo ""

log "INFO" "Backup health check passed"

# Optional: Send success notification (can be commented out to reduce noise)
# send_alert "INFO" "Backup Health OK" "Backup health check passed. Latest backup: ${AGE_HOURS} hours old."

echo "Log file saved to: $LOG_FILE"
echo ""
echo "Next check recommendation: $(date -d '+1 day' '+%Y-%m-%d %H:%M:%S')"
echo ""
