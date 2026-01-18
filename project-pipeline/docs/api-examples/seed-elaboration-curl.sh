#!/bin/bash

# =============================================================================
# Seed Elaboration API - cURL Examples
# =============================================================================
# This script demonstrates how to interact with the Seed Elaboration API
# using cURL commands.
#
# Prerequisites:
# - Set JWT_TOKEN environment variable with your authentication token
# - Set API_BASE_URL (default: http://localhost:3000)
# - Have a valid seed ID
#
# Usage:
#   export JWT_TOKEN="your-jwt-token-here"
#   export SEED_ID="your-seed-uuid-here"
#   bash seed-elaboration-curl.sh
# =============================================================================

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
SEED_ID="${SEED_ID:-550e8400-e29b-41d4-a716-446655440000}"
JWT_TOKEN="${JWT_TOKEN}"

# Check if JWT token is set
if [ -z "$JWT_TOKEN" ]; then
  echo "❌ Error: JWT_TOKEN environment variable is not set"
  echo "Usage: export JWT_TOKEN='your-token-here'"
  exit 1
fi

echo "==================================================================="
echo "Seed Elaboration API - cURL Examples"
echo "==================================================================="
echo "API Base URL: $API_BASE_URL"
echo "Seed ID: $SEED_ID"
echo ""

# =============================================================================
# Example 1: Start Elaboration Session
# =============================================================================
echo "📝 Example 1: Start Elaboration Session"
echo "-------------------------------------------------------------------"

START_RESPONSE=$(curl -s -X POST \
  "$API_BASE_URL/seeds/$SEED_ID/elaborate/start" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$START_RESPONSE" | jq '.'

# Extract sessionId for subsequent requests
SESSION_ID=$(echo "$START_RESPONSE" | jq -r '.sessionId')
echo ""
echo "✅ Session started with ID: $SESSION_ID"
echo ""
echo ""

# =============================================================================
# Example 2: Submit Answer - Participants
# =============================================================================
echo "📝 Example 2: Submit Answer - Participants"
echo "-------------------------------------------------------------------"

ANSWER_1_RESPONSE=$(curl -s -X POST \
  "$API_BASE_URL/seeds/$SEED_ID/elaborate/answer" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"answer\": \"30 young people aged 18-25 from Turkey, Spain, and Germany\"
  }")

echo "Response:"
echo "$ANSWER_1_RESPONSE" | jq '.'
echo ""
echo "✅ Answer submitted successfully"
echo ""
echo ""

# =============================================================================
# Example 3: Submit Answer - Destination
# =============================================================================
echo "📝 Example 3: Submit Answer - Destination"
echo "-------------------------------------------------------------------"

ANSWER_2_RESPONSE=$(curl -s -X POST \
  "$API_BASE_URL/seeds/$SEED_ID/elaborate/answer" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"answer\": \"Barcelona, Spain, at the Youth Hostel Barcelona\"
  }")

echo "Response:"
echo "$ANSWER_2_RESPONSE" | jq '.'
echo ""
echo "✅ Answer submitted successfully"
echo ""
echo ""

# =============================================================================
# Example 4: Submit Answer - Duration and Dates
# =============================================================================
echo "📝 Example 4: Submit Answer - Duration and Dates"
echo "-------------------------------------------------------------------"

ANSWER_3_RESPONSE=$(curl -s -X POST \
  "$API_BASE_URL/seeds/$SEED_ID/elaborate/answer" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"answer\": \"7 days, from July 15 to July 21, 2024\"
  }")

echo "Response:"
echo "$ANSWER_3_RESPONSE" | jq '.'
echo ""
echo "✅ Answer submitted successfully"
echo ""
echo ""

# =============================================================================
# Example 5: Get Elaboration Status
# =============================================================================
echo "📝 Example 5: Get Elaboration Status"
echo "-------------------------------------------------------------------"

STATUS_RESPONSE=$(curl -s -X GET \
  "$API_BASE_URL/seeds/$SEED_ID/elaborate/status" \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "Response:"
echo "$STATUS_RESPONSE" | jq '.'

# Extract completeness percentage
COMPLETENESS=$(echo "$STATUS_RESPONSE" | jq -r '.completeness')
echo ""
echo "✅ Current completeness: $COMPLETENESS%"
echo ""
echo ""

# =============================================================================
# Summary
# =============================================================================
echo "==================================================================="
echo "Summary"
echo "==================================================================="
echo "Session ID: $SESSION_ID"
echo "Completeness: $COMPLETENESS%"
echo ""
echo "Next steps:"
echo "1. Continue answering questions until completeness reaches 100%"
echo "2. Use GET /seeds/$SEED_ID/elaborate/status to check progress"
echo "3. When complete, convert seed to project"
echo "==================================================================="
