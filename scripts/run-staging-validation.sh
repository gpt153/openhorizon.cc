#!/bin/bash
set -e

# Staging Validation Execution Script
# Part of Issue #180: Deployment Validation - Staging Environment Testing

STAGING_URL="${STAGING_URL:-https://oh.153.se}"
REPORT_DIR="staging-validation-reports/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$REPORT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Staging Validation for Seed Elaboration Feature${NC}"
echo -e "${BLUE}  Issue #180: Deployment Validation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Staging URL:${NC} $STAGING_URL"
echo -e "${BLUE}Report Directory:${NC} $REPORT_DIR"
echo ""

# Track overall status
OVERALL_STATUS=0

# Helper function to run a test phase
run_phase() {
  local phase_name="$1"
  local phase_num="$2"
  local command="$3"
  local output_file="$4"

  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📋 Phase $phase_num: $phase_name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if eval "$command > '$REPORT_DIR/$output_file' 2>&1"; then
    echo -e "${GREEN}✅ $phase_name: PASSED${NC}"
    return 0
  else
    echo -e "${RED}❌ $phase_name: FAILED${NC}"
    echo -e "${YELLOW}   See report: $REPORT_DIR/$output_file${NC}"
    OVERALL_STATUS=1
    return 1
  fi
}

# Phase 1: Environment Configuration Check
run_phase "Environment Configuration" "1" \
  "tsx scripts/validate-staging-env.ts" \
  "env-check.log"
ENV_STATUS=$?

if [ $ENV_STATUS -ne 0 ]; then
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ ENVIRONMENT CHECK FAILED${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${YELLOW}Please fix environment issues before proceeding:${NC}"
  echo -e "  1. Check $REPORT_DIR/env-check.log for details"
  echo -e "  2. Ensure all required services are running"
  echo -e "  3. Verify environment variables are set correctly"
  echo ""
  exit 1
fi

# Phase 2: Smoke Tests
run_phase "Smoke Tests" "2" \
  "npm run smoke-test:staging || tsx scripts/smoke-test.ts $STAGING_URL" \
  "smoke-test.log"

# Phase 3: E2E Functional Tests
run_phase "E2E Functional Tests" "3" \
  "APP_URL=$STAGING_URL npx playwright test tests/e2e/seed-elaboration.spec.ts --reporter=list,json --output='$REPORT_DIR/playwright'" \
  "e2e-tests.log"

# Phase 4: Scenario Tests (Issue #177)
run_phase "5 E2E Scenarios (Issue #177)" "4" \
  "APP_URL=$STAGING_URL npx playwright test tests/e2e/seed-elaboration-scenarios.spec.ts --reporter=list,json --output='$REPORT_DIR/playwright'" \
  "scenario-tests.log"

# Phase 5: Error Handling Tests
run_phase "Error Handling Validation" "5" \
  "APP_URL=$STAGING_URL npx playwright test tests/e2e/seed-elaboration-error-handling.spec.ts --reporter=list,json --output='$REPORT_DIR/playwright'" \
  "error-handling-tests.log"

# Phase 6: Performance Benchmarks (optional - skip if script doesn't exist)
if [ -f "scripts/benchmark-elaboration.ts" ]; then
  run_phase "Performance Benchmarks" "6" \
    "STAGING_URL=$STAGING_URL tsx scripts/benchmark-elaboration.ts" \
    "performance-metrics.json"
else
  echo ""
  echo -e "${YELLOW}⚠️  Skipping Phase 6: Performance Benchmarks (script not found)${NC}"
fi

# Phase 7: Load Tests (optional - skip if script doesn't exist or k6 not installed)
if command -v k6 &> /dev/null && [ -f "scripts/load-test-elaboration.js" ]; then
  run_phase "Load Testing" "7" \
    "STAGING_URL=$STAGING_URL k6 run scripts/load-test-elaboration.js" \
    "load-test-results.json"
else
  echo ""
  echo -e "${YELLOW}⚠️  Skipping Phase 7: Load Testing (k6 not installed or script not found)${NC}"
fi

# Generate summary report
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Generating Summary Report...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create a simple text summary
cat > "$REPORT_DIR/SUMMARY.md" <<EOF
# Staging Validation Summary

**Date:** $(date +"%Y-%m-%d %H:%M:%S")
**Staging URL:** $STAGING_URL
**Report Directory:** $REPORT_DIR

---

## Test Results

### Phase 1: Environment Configuration
Status: $([ $ENV_STATUS -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
Report: env-check.log

### Phase 2: Smoke Tests
Status: $(grep -q "✅" "$REPORT_DIR/smoke-test.log" 2>/dev/null && echo "✅ PASSED" || echo "❌ FAILED")
Report: smoke-test.log

### Phase 3: E2E Functional Tests
Status: $(grep -q "passed" "$REPORT_DIR/e2e-tests.log" 2>/dev/null && echo "✅ PASSED" || echo "❌ FAILED")
Report: e2e-tests.log

### Phase 4: Scenario Tests (Issue #177)
Status: $(grep -q "passed" "$REPORT_DIR/scenario-tests.log" 2>/dev/null && echo "✅ PASSED" || echo "❌ FAILED")
Report: scenario-tests.log

### Phase 5: Error Handling
Status: $(grep -q "passed" "$REPORT_DIR/error-handling-tests.log" 2>/dev/null && echo "✅ PASSED" || echo "❌ FAILED")
Report: error-handling-tests.log

---

## Overall Status

$([ $OVERALL_STATUS -eq 0 ] && echo "✅ **ALL VALIDATION TESTS PASSED**" || echo "❌ **VALIDATION FAILED - SEE LOGS FOR DETAILS**")

---

## Next Steps

$([ $OVERALL_STATUS -eq 0 ] && cat <<EON
1. Review this summary report
2. Check individual test logs for detailed results
3. Review the production deployment checklist: docs/deployment/seed-elaboration-production-checklist.md
4. Schedule production deployment
5. Prepare rollback plan
EON
 || cat <<EON
1. Review failed test logs in $REPORT_DIR
2. Fix identified issues
3. Re-run validation: ./scripts/run-staging-validation.sh
4. DO NOT proceed to production until all tests pass
EON
)

---

## Files Generated

- Environment check: $REPORT_DIR/env-check.log
- Smoke tests: $REPORT_DIR/smoke-test.log
- E2E tests: $REPORT_DIR/e2e-tests.log
- Scenario tests: $REPORT_DIR/scenario-tests.log
- Error handling: $REPORT_DIR/error-handling-tests.log
- Playwright reports: $REPORT_DIR/playwright/

---

**Generated:** $(date)
EOF

echo ""
cat "$REPORT_DIR/SUMMARY.md"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $OVERALL_STATUS -eq 0 ]; then
  echo -e "${GREEN}✅ ALL VALIDATION TESTS PASSED${NC}"
  echo ""
  echo -e "${GREEN}Staging environment is ready for production deployment.${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo -e "  1. Review the full report: ${YELLOW}$REPORT_DIR/SUMMARY.md${NC}"
  echo -e "  2. Check the production deployment checklist:"
  echo -e "     ${YELLOW}docs/deployment/seed-elaboration-production-checklist.md${NC}"
  echo -e "  3. Schedule production deployment"
else
  echo -e "${RED}❌ VALIDATION FAILED${NC}"
  echo ""
  echo -e "${RED}Some tests failed. DO NOT proceed to production.${NC}"
  echo ""
  echo -e "${YELLOW}Action items:${NC}"
  echo -e "  1. Review failed tests in: ${YELLOW}$REPORT_DIR/${NC}"
  echo -e "  2. Fix identified issues"
  echo -e "  3. Re-run validation"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

exit $OVERALL_STATUS
