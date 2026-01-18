#!/bin/bash
# Quick status check for issue #156 supervision

LOG_FILE=".agents/supervision/issue-156-autonomous.log"
RESULT_FILE=".agents/supervision/issue-156-result.txt"

echo "=== Issue #156 Supervision Status ==="
echo ""

if [ -f "$RESULT_FILE" ]; then
  RESULT=$(cat "$RESULT_FILE")
  echo "🏁 COMPLETE - Result: $RESULT"
  echo ""
  echo "Last 10 log entries:"
  tail -10 "$LOG_FILE" 2>/dev/null
else
  echo "⏳ MONITORING IN PROGRESS"
  echo ""
  echo "Last 5 log entries:"
  tail -5 "$LOG_FILE" 2>/dev/null
fi

echo ""
echo "Latest issue comment:"
gh issue view 156 --json comments --jq '.comments[-1] | {author:.author.login,time:.createdAt,body:.body[0:200]}'
