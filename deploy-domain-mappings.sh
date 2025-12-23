#!/bin/bash
# Script to fix domain mappings for openhorizon.cc
# Run this manually after Cloud Build deploys both services
#
# Prerequisites:
# - Both services deployed (openhorizon-app, openhorizon-landing)
# - gcloud CLI authenticated
# - DNS records configured

set -e

PROJECT_ID="open-horizon-prod"
REGION="europe-west1"

echo "=== Fixing Domain Mappings for OpenHorizon ==="
echo

# Step 1: Check current domain mappings
echo "Current domain mappings:"
gcloud run domain-mappings list --region=$REGION --project=$PROJECT_ID || true
echo

# Step 2: Remove incorrect mapping (if exists)
echo "Removing incorrect mapping from root domain..."
gcloud run domain-mappings delete \
  --domain=openhorizon.cc \
  --region=$REGION \
  --project=$PROJECT_ID \
  --quiet || echo "No existing mapping for openhorizon.cc (this is OK)"
echo

# Step 3: Map landing page to root domain
echo "Mapping landing page to openhorizon.cc..."
gcloud run domain-mappings create \
  --service=openhorizon-landing \
  --domain=openhorizon.cc \
  --region=$REGION \
  --project=$PROJECT_ID
echo

# Step 4: Map application to subdomain
echo "Mapping application to app.openhorizon.cc..."
gcloud run domain-mappings create \
  --service=openhorizon-app \
  --domain=app.openhorizon.cc \
  --region=$REGION \
  --project=$PROJECT_ID
echo

# Step 5: Verify mappings
echo "=== Final Domain Mappings ==="
gcloud run domain-mappings list --region=$REGION --project=$PROJECT_ID
echo

echo "=== DNS Records Required ==="
echo "Make sure these DNS records are configured:"
echo "openhorizon.cc          → CNAME to ghs.googlehosted.com"
echo "app.openhorizon.cc      → CNAME to ghs.googlehosted.com"
echo

echo "=== SSL Certificate Provisioning ==="
echo "SSL certificates will be automatically provisioned."
echo "This may take 15-30 minutes."
echo
echo "Check certificate status with:"
echo "gcloud run domain-mappings describe --domain=openhorizon.cc --region=$REGION"
echo "gcloud run domain-mappings describe --domain=app.openhorizon.cc --region=$REGION"
echo

echo "Done! Test your domains:"
echo "- https://openhorizon.cc (should show landing page)"
echo "- https://app.openhorizon.cc (should show application)"
