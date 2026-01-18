#!/bin/bash
# Autonomous monitoring for issue #156
# Runs until SCAR completes or encounters blocker

ISSUE=156
LOG_FILE=".agents/supervision/issue-156-log.md"
STATE_FILE=".agents/supervision/issue-156-state.json"

# Initialize state
echo "{\"issue\":156,\"status\":\"monitoring\",\"scar_started\":true,\"last_check\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"retries\":0}" > "$STATE_FILE"

# Log start
echo "## Supervision Log - Issue #156" > "$LOG_FILE"
echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Monitoring loop
while true; do
  sleep 120  # Check every 2 minutes
  
  CURRENT_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  echo "[$CURRENT_TIME] Checking issue..." >> "$LOG_FILE"
  
  # Fetch recent comments
  RECENT_COMMENTS=$(gh issue view $ISSUE --json comments --jq '.comments[-10:] | .[] | {author:.author.login,body:.body[0:300],created:.createdAt}' 2>&1)
  
  # Check for completion signals
  if echo "$RECENT_COMMENTS" | grep -qi "implementation complete\|PR created\|pull request\|ready for review"; then
    echo "[$CURRENT_TIME] 🎯 COMPLETION DETECTED" >> "$LOG_FILE"
    echo "{\"issue\":156,\"status\":\"completed\",\"detected_at\":\"$CURRENT_TIME\"}" > "$STATE_FILE"
    break
  fi
  
  # Check for errors/blockers
  if echo "$RECENT_COMMENTS" | grep -qi "error:\|failed:\|cannot proceed\|need clarification"; then
    echo "[$CURRENT_TIME] ⚠️ BLOCKER DETECTED" >> "$LOG_FILE"
    echo "{\"issue\":156,\"status\":\"blocked\",\"detected_at\":\"$CURRENT_TIME\"}" > "$STATE_FILE"
    break
  fi
  
  # Update state with last activity
  echo "{\"issue\":156,\"status\":\"monitoring\",\"last_check\":\"$CURRENT_TIME\"}" > "$STATE_FILE"
done

echo "[$CURRENT_TIME] Monitoring loop ended" >> "$LOG_FILE"
