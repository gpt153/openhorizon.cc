#!/bin/bash
#
# OpenHorizon Load Testing Script
#
# This script runs K6 load tests against the OpenHorizon application
# to validate performance under realistic load conditions.
#
# Usage:
#   ./scripts/load-test.sh [options]
#
# Options:
#   --url URL           Base URL to test (default: https://app.openhorizon.cc)
#   --users N           Number of concurrent users (default: 50)
#   --duration DURATION Duration for steady state (default: 5m)
#   --report            Generate HTML report
#   --smoke             Run smoke test (1 user, 30s)
#   --help              Show this help message
#

set -e

# Default configuration
BASE_URL="${BASE_URL:-https://app.openhorizon.cc}"
MAX_USERS=50
STEADY_DURATION="5m"
GENERATE_REPORT=false
SMOKE_TEST=false
K6_BIN="${K6_BIN:-$HOME/bin/k6}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      BASE_URL="$2"
      shift 2
      ;;
    --users)
      MAX_USERS="$2"
      shift 2
      ;;
    --duration)
      STEADY_DURATION="$2"
      shift 2
      ;;
    --report)
      GENERATE_REPORT=true
      shift
      ;;
    --smoke)
      SMOKE_TEST=true
      shift
      ;;
    --help)
      head -n 20 "$0" | tail -n 16
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run with --help for usage information"
      exit 1
      ;;
  esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   OpenHorizon Load Testing${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if K6 is installed
if ! command -v "$K6_BIN" &> /dev/null; then
  echo -e "${RED}Error: K6 not found at $K6_BIN${NC}"
  echo "Please install K6 or set K6_BIN environment variable"
  echo "Installation: https://k6.io/docs/get-started/installation/"
  exit 1
fi

# Show K6 version
K6_VERSION=$("$K6_BIN" version | head -n 1)
echo -e "${GREEN}✓${NC} K6 found: $K6_VERSION"
echo ""

# Configuration summary
echo -e "${YELLOW}Configuration:${NC}"
echo "  Target URL:      $BASE_URL"

if [ "$SMOKE_TEST" = true ]; then
  echo "  Test Type:       Smoke Test"
  echo "  Users:           1"
  echo "  Duration:        30 seconds"
  # Override settings for smoke test
  export K6_STAGES="[{\"duration\":\"10s\",\"target\":1},{\"duration\":\"20s\",\"target\":1}]"
else
  echo "  Test Type:       Load Test"
  echo "  Max Users:       $MAX_USERS"
  echo "  Steady Duration: $STEADY_DURATION"
  echo "  Ramp-up:         1 minute"
  echo "  Ramp-down:       1 minute"
fi

echo "  Report:          $([ "$GENERATE_REPORT" = true ] && echo "Enabled" || echo "Disabled")"
echo ""

# Create results directory
RESULTS_DIR="$(dirname "$0")/../test-results/load-tests"
mkdir -p "$RESULTS_DIR"

# Generate timestamp for results
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$RESULTS_DIR/results_${TIMESTAMP}.json"

echo -e "${YELLOW}Preparing test...${NC}"
echo ""

# Build K6 command
K6_COMMAND="$K6_BIN run"
K6_COMMAND="$K6_COMMAND --out json=$RESULTS_FILE"

# Add summary export
SUMMARY_FILE="$RESULTS_DIR/summary_${TIMESTAMP}.json"
K6_COMMAND="$K6_COMMAND --summary-export=$SUMMARY_FILE"

# Add environment variables
K6_COMMAND="BASE_URL=$BASE_URL $K6_COMMAND"

# Add custom stages if not smoke test
if [ "$SMOKE_TEST" != true ]; then
  # Export options via environment (K6 will read from options in script)
  export K6_MAX_USERS=$MAX_USERS
  export K6_STEADY_DURATION=$STEADY_DURATION
fi

# Add script path
SCRIPT_PATH="$(dirname "$0")/load-test.js"
K6_COMMAND="$K6_COMMAND $SCRIPT_PATH"

# Check if target is reachable
echo -e "${YELLOW}Testing connectivity to $BASE_URL...${NC}"
if curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Target is reachable"
else
  echo -e "${YELLOW}⚠${NC}  Warning: Could not reach target (this may be expected if behind auth)"
fi
echo ""

# Run the test
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Starting Load Test${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Execute K6
eval "$K6_COMMAND"

EXIT_CODE=$?

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ Load test completed successfully${NC}"
else
  echo -e "${RED}✗ Load test failed with exit code $EXIT_CODE${NC}"
fi

echo ""
echo -e "${YELLOW}Results:${NC}"
echo "  JSON output:     $RESULTS_FILE"
echo "  Summary:         $SUMMARY_FILE"

# Generate HTML report if requested
if [ "$GENERATE_REPORT" = true ]; then
  echo ""
  echo -e "${YELLOW}Generating HTML report...${NC}"

  REPORT_FILE="$RESULTS_DIR/report_${TIMESTAMP}.html"

  # Use k6-reporter if available, otherwise just note the JSON location
  if command -v k6-reporter &> /dev/null; then
    k6-reporter "$SUMMARY_FILE" "$REPORT_FILE"
    echo -e "${GREEN}✓${NC} HTML report: $REPORT_FILE"
  else
    echo -e "${YELLOW}⚠${NC}  k6-reporter not found. Install with: npm install -g k6-reporter"
    echo "  For now, view results in: $SUMMARY_FILE"
  fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Quick summary from the JSON
if [ -f "$SUMMARY_FILE" ]; then
  echo ""
  echo -e "${YELLOW}Quick Summary:${NC}"

  # Extract key metrics using jq if available
  if command -v jq &> /dev/null; then
    HTTP_REQS=$(jq -r '.metrics.http_reqs.values.count // "N/A"' "$SUMMARY_FILE")
    HTTP_REQ_DURATION_P95=$(jq -r '.metrics.http_req_duration.values["p(95)"] // "N/A"' "$SUMMARY_FILE")
    HTTP_REQ_DURATION_P99=$(jq -r '.metrics.http_req_duration.values["p(99)"] // "N/A"' "$SUMMARY_FILE")
    HTTP_FAILURES=$(jq -r '.metrics.http_req_failed.values.passes // "0"' "$SUMMARY_FILE")

    echo "  Total Requests:  $HTTP_REQS"
    echo "  p95 Latency:     ${HTTP_REQ_DURATION_P95}ms"
    echo "  p99 Latency:     ${HTTP_REQ_DURATION_P99}ms"
    echo "  Failed Requests: $HTTP_FAILURES"
  else
    echo "  Install 'jq' for detailed summary: sudo apt-get install jq"
    echo "  View full results in: $SUMMARY_FILE"
  fi
fi

echo ""

exit $EXIT_CODE
