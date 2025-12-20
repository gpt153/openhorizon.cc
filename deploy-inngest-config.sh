#!/bin/bash

# Deploy Inngest Configuration to Cloud Run
# This script configures the environment variables needed for Inngest integration

set -e

PROJECT_ID="openhorizon-cc"
SERVICE_NAME="app"
REGION="us-central1"

echo "🔧 Configuring Cloud Run environment variables..."

# Set service account
gcloud config set account remote-coding-agent@openhorizon-cc.iam.gserviceaccount.com
gcloud config set project $PROJECT_ID

# Update Cloud Run service with Inngest and OpenAI credentials
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --update-env-vars="OPENAI_API_KEY=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,INNGEST_EVENT_KEY=I8TpIjCA-6J_x9wYoSVZ_2fKaSg9faLlqFBZMQF0e3Mgrw6JGA8CedF9FySf865rOchshVupoBvomcnii8bCCg,INNGEST_SIGNING_KEY=signkey-prod-7bd0264b3c6d7560d74cf345c7e1a8d4de13f53c5503878a16be3a6f9fbeb834"

echo "✅ Environment variables configured!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Inngest Cloud Dashboard (https://app.inngest.com)"
echo "2. Navigate to your 'open-horizon' app"
echo "3. Go to 'Manage' → 'Apps' → Click 'Sync App'"
echo "4. Enter your app URL: https://app.openhorizon.cc/api/inngest"
echo "5. Click 'Sync' - Inngest will discover your functions"
echo ""
echo "🧪 Test the integration:"
echo "   - Go to app.openhorizon.cc"
echo "   - Start a new brainstorm session"
echo "   - Seeds should generate within 10-30 seconds"
echo "   - Check Inngest dashboard for job execution logs"
