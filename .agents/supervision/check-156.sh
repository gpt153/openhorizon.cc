#!/bin/bash
# Single check of issue #156 state

ISSUE=156
TIMESTAMP=$(date +"%H:%M CET")

# Get recent comments
COMMENTS=$(gh issue view $ISSUE --json comments --jq '.comments[-5:]')

# Check for completion
if echo "$COMMENTS" | grep -qi "implementation complete\|PR created at\|pull request #\|ready for review"; then
  echo "[$TIMESTAMP] 🎯 COMPLETION DETECTED"
  
  # Extract PR URL if present
  PR_URL=$(echo "$COMMENTS" | grep -oP 'https://github.com/[^/]+/[^/]+/pull/\d+' | tail -1)
  
  if [ -n "$PR_URL" ]; then
    echo "PR: $PR_URL"
  fi
  
  exit 0  # Completion
fi

# Check for blockers
if echo "$COMMENTS" | grep -qi "error:\|failed:\|cannot proceed\|need clarification\|awaiting approval"; then
  echo "[$TIMESTAMP] ⚠️ BLOCKER/NEEDS ATTENTION"
  echo "$COMMENTS" | grep -i "error:\|failed:\|cannot proceed\|need clarification\|awaiting approval" | tail -3
  exit 2  # Blocker
fi

# Check for activity
LAST_COMMENT=$(echo "$COMMENTS" | jq -r '.[-1].body' 2>/dev/null | head -c 200)
echo "[$TIMESTAMP] ⏳ SCAR working... Latest: ${LAST_COMMENT}"
exit 1  # Still working
