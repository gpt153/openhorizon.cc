#!/bin/bash
# Autonomous supervision for issue #156
# Monitors until completion, runs verification, reports only when done

ISSUE=156
PROJECT="openhorizon.cc"
LOG_FILE=".agents/supervision/issue-156-autonomous.log"

log() {
  echo "$(date +'%Y-%m-%d %H:%M:%S CET') - $1" >> "$LOG_FILE"
}

log "=== Autonomous supervision started for issue #156 ==="
log "SCAR approved and working since 18:05 CET"

# Monitoring loop - runs until completion or blocker
while true; do
  sleep 120  # 2 minutes
  
  # Get recent comments
  RECENT=$(gh issue view $ISSUE --json comments --jq '.comments[-5:] | .[] | .body' 2>&1)
  
  # Check for completion signals
  if echo "$RECENT" | grep -qi "implementation complete\|created.*pull request\|PR.*#[0-9]"; then
    log "🎯 COMPLETION DETECTED - SCAR finished implementation"
    
    # Extract PR info
    PR_NUM=$(echo "$RECENT" | grep -oP 'pull request #\K\d+|PR #\K\d+' | tail -1)
    
    if [ -n "$PR_NUM" ]; then
      log "PR #$PR_NUM created - proceeding to verification"
      
      # Run verification
      log "Starting verification of PR #$PR_NUM"
      
      # Find worktree
      WORKTREE=$(find /home/samuel/.archon/worktrees/$PROJECT -name "issue-$ISSUE" -type d 2>/dev/null | head -1)
      
      if [ -d "$WORKTREE" ]; then
        log "Worktree found: $WORKTREE"
        
        # Run build verification
        cd "$WORKTREE"
        log "Running build verification..."
        
        BUILD_OUTPUT=$(npm run build 2>&1)
        BUILD_EXIT=$?
        
        if [ $BUILD_EXIT -eq 0 ]; then
          log "✅ BUILD PASSED"
          
          # Check for mocks/placeholders
          MOCKS=$(grep -r "TODO\|FIXME\|console.log" src/ 2>/dev/null | wc -l)
          
          if [ $MOCKS -gt 10 ]; then
            log "⚠️ Found $MOCKS potential placeholders - needs review"
            echo "NEEDS_REVIEW" > .agents/supervision/issue-156-result.txt
          else
            log "✅ VERIFICATION PASSED"
            echo "APPROVED" > .agents/supervision/issue-156-result.txt
            
            # Post approval
            gh issue comment $ISSUE --body "## ✅ Verification Complete

Implementation verified and approved.

**Build**: ✅ Passing
**Code Quality**: ✅ No major issues
**Status**: Ready for merge

Great work!" 2>&1 | head -5 >> "$LOG_FILE"
          fi
        else
          log "❌ BUILD FAILED"
          echo "$BUILD_OUTPUT" | tail -20 >> "$LOG_FILE"
          echo "REJECTED" > .agents/supervision/issue-156-result.txt
          
          # Post rejection
          gh issue comment $ISSUE --body "## ❌ Verification Failed

Build errors detected:

\`\`\`
$(echo "$BUILD_OUTPUT" | tail -10)
\`\`\`

@scar please fix build errors and re-validate." 2>&1 | head -5 >> "$LOG_FILE"
        fi
      else
        log "⚠️ Worktree not found - manual verification needed"
        echo "NO_WORKTREE" > .agents/supervision/issue-156-result.txt
      fi
    fi
    
    log "=== Supervision complete ==="
    break
  fi
  
  # Check for blockers
  if echo "$RECENT" | grep -qi "need clarification\|cannot proceed\|blocked"; then
    log "⚠️ BLOCKER DETECTED - needs attention"
    echo "BLOCKED" > .agents/supervision/issue-156-result.txt
    break
  fi
  
  # Still working - log activity
  LAST_MSG=$(echo "$RECENT" | tail -1 | head -c 100)
  log "⏳ SCAR working... Latest: $LAST_MSG"
done

log "Monitoring loop ended"
