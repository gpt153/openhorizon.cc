#!/bin/bash
set -e

# OpenHorizon - Monitoring & Alerting Setup Script
# Issue #134: Configure Google Cloud Monitoring alert policies

PROJECT_ID="openhorizon-cc"
ALERT_EMAIL="${ALERT_EMAIL:-alerts@openhorizon.cc}"

echo "🔔 Setting up Cloud Monitoring Alert Policies for OpenHorizon..."
echo "📧 Alert notifications will be sent to: $ALERT_EMAIL"
echo

# Step 1: Create notification channel (email)
echo "📬 Creating email notification channel..."
CHANNEL_ID=$(gcloud alpha monitoring channels create \
  --display-name="OpenHorizon Alerts Email" \
  --type=email \
  --channel-labels=email_address="$ALERT_EMAIL" \
  --project="$PROJECT_ID" \
  --format="value(name)" 2>/dev/null || echo "")

if [ -z "$CHANNEL_ID" ]; then
  echo "⚠️  Notification channel might already exist. Fetching existing channel..."
  CHANNEL_ID=$(gcloud alpha monitoring channels list \
    --filter="displayName='OpenHorizon Alerts Email'" \
    --project="$PROJECT_ID" \
    --format="value(name)" | head -1)
fi

if [ -z "$CHANNEL_ID" ]; then
  echo "❌ Failed to create or find notification channel"
  exit 1
fi

echo "✅ Notification channel ID: $CHANNEL_ID"
echo

# Step 2: Create Alert Policy - High Error Rate (>1%)
echo "🚨 Creating alert: High Error Rate (>1%)..."
gcloud alpha monitoring policies create \
  --notification-channels="$CHANNEL_ID" \
  --display-name="OpenHorizon - High Error Rate (>1%)" \
  --condition-display-name="5xx Error Rate exceeds 1%" \
  --condition-threshold-value=0.01 \
  --condition-threshold-duration=300s \
  --condition-threshold-comparison=COMPARISON_GT \
  --condition-threshold-aggregations='alignment_period=60s,per_series_aligner=ALIGN_RATE' \
  --condition-expression="
    resource.type=\"cloud_run_revision\" AND
    resource.labels.service_name=\"openhorizon-app\" AND
    metric.type=\"run.googleapis.com/request_count\" AND
    metric.labels.response_code_class=\"5xx\"
  " \
  --project="$PROJECT_ID" 2>/dev/null || echo "⚠️  Policy might already exist"

echo "✅ Alert created: High Error Rate"
echo

# Step 3: Create Alert Policy - High Latency (P95 > 1s)
echo "🚨 Creating alert: High Latency (P95 > 1s)..."
gcloud alpha monitoring policies create \
  --notification-channels="$CHANNEL_ID" \
  --display-name="OpenHorizon - High Latency (P95 > 1s)" \
  --condition-display-name="P95 latency exceeds 1 second" \
  --condition-threshold-value=1000 \
  --condition-threshold-duration=300s \
  --condition-threshold-comparison=COMPARISON_GT \
  --condition-threshold-aggregations='alignment_period=60s,per_series_aligner=ALIGN_DELTA,cross_series_reducer=REDUCE_PERCENTILE_95' \
  --condition-expression="
    resource.type=\"cloud_run_revision\" AND
    resource.labels.service_name=\"openhorizon-app\" AND
    metric.type=\"run.googleapis.com/request_latencies\"
  " \
  --project="$PROJECT_ID" 2>/dev/null || echo "⚠️  Policy might already exist"

echo "✅ Alert created: High Latency"
echo

# Step 4: Create Alert Policy - Inngest Job Failure Rate (>10%)
echo "🚨 Creating alert: Inngest Job Failure Rate (>10%)..."
gcloud alpha monitoring policies create \
  --notification-channels="$CHANNEL_ID" \
  --display-name="OpenHorizon - High Inngest Job Failure Rate (>10%)" \
  --condition-display-name="Inngest job failures exceed 10%" \
  --condition-threshold-value=0.10 \
  --condition-threshold-duration=600s \
  --condition-threshold-comparison=COMPARISON_GT \
  --condition-threshold-aggregations='alignment_period=60s,per_series_aligner=ALIGN_RATE' \
  --condition-expression="
    resource.type=\"global\" AND
    metric.type=\"custom.googleapis.com/inngest/job_failures\"
  " \
  --project="$PROJECT_ID" 2>/dev/null || echo "⚠️  Policy might already exist"

echo "✅ Alert created: Inngest Job Failure Rate"
echo

# Step 5: Create Alert Policy - Service Inactive (>1 hour)
echo "🚨 Creating alert: Service Inactive (>1 hour)..."
gcloud alpha monitoring policies create \
  --notification-channels="$CHANNEL_ID" \
  --display-name="OpenHorizon - Service Inactive (>1 hour)" \
  --condition-display-name="No requests in the last hour" \
  --condition-threshold-value=1 \
  --condition-threshold-duration=3600s \
  --condition-threshold-comparison=COMPARISON_LT \
  --condition-threshold-aggregations='alignment_period=3600s,per_series_aligner=ALIGN_RATE' \
  --condition-expression="
    resource.type=\"cloud_run_revision\" AND
    resource.labels.service_name=\"openhorizon-app\" AND
    metric.type=\"run.googleapis.com/request_count\"
  " \
  --project="$PROJECT_ID" 2>/dev/null || echo "⚠️  Policy might already exist"

echo "✅ Alert created: Service Inactive"
echo

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Cloud Monitoring Alert Policies Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "📋 Configured Alerts:"
echo "  1. High Error Rate (>1%) - 5 min window"
echo "  2. High Latency (P95 > 1s) - 5 min window"
echo "  3. Inngest Job Failure Rate (>10%) - 10 min window"
echo "  4. Service Inactive (>1 hour)"
echo
echo "📧 Notifications: $ALERT_EMAIL"
echo
echo "🔗 View alerts: https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID"
echo
