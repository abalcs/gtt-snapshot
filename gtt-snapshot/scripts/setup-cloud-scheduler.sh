#!/bin/bash
# Setup Google Cloud Scheduler jobs for travel data auto-sync
#
# Prerequisites:
#   1. gcloud CLI installed and authenticated
#   2. CRON_SECRET stored in Secret Manager:
#      echo -n "your-secret" | gcloud secrets create CRON_SECRET --data-file=-
#   3. TUGO_API_KEY stored in Secret Manager (optional, for health data):
#      echo -n "your-key" | gcloud secrets create TUGO_API_KEY --data-file=-
#
# Usage: ./scripts/setup-cloud-scheduler.sh

set -euo pipefail

PROJECT_ID="gtt-country-snapshot"
APP_URL="https://gtt-country-snapshot.web.app"
LOCATION="us-east4"

# Read CRON_SECRET from Secret Manager
CRON_SECRET=$(gcloud secrets versions access latest --secret=CRON_SECRET --project="$PROJECT_ID")

echo "Setting up Cloud Scheduler jobs for $APP_URL"

# Daily: Sync travel advisories (6:00 AM UTC)
gcloud scheduler jobs create http sync-travel-advisories \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --schedule="0 6 * * *" \
  --uri="$APP_URL/api/admin/sync-travel-data?type=advisories" \
  --http-method=POST \
  --headers="x-cron-secret=$CRON_SECRET" \
  --time-zone="UTC" \
  --attempt-deadline="300s" \
  --description="Daily sync of US State Dept travel advisories" \
  2>/dev/null || \
gcloud scheduler jobs update http sync-travel-advisories \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --schedule="0 6 * * *" \
  --uri="$APP_URL/api/admin/sync-travel-data?type=advisories" \
  --http-method=POST \
  --headers="x-cron-secret=$CRON_SECRET" \
  --time-zone="UTC" \
  --attempt-deadline="300s" \
  --description="Daily sync of US State Dept travel advisories"

echo "Created/updated: sync-travel-advisories (daily 6:00 AM UTC)"

# Weekly: Sync visa requirements (Sunday 6:00 AM UTC)
gcloud scheduler jobs create http sync-travel-visa \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --schedule="0 6 * * 0" \
  --uri="$APP_URL/api/admin/sync-travel-data?type=visa" \
  --http-method=POST \
  --headers="x-cron-secret=$CRON_SECRET" \
  --time-zone="UTC" \
  --attempt-deadline="300s" \
  --description="Weekly sync of Passport Index visa requirements" \
  2>/dev/null || \
gcloud scheduler jobs update http sync-travel-visa \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --schedule="0 6 * * 0" \
  --uri="$APP_URL/api/admin/sync-travel-data?type=visa" \
  --http-method=POST \
  --headers="x-cron-secret=$CRON_SECRET" \
  --time-zone="UTC" \
  --attempt-deadline="300s" \
  --description="Weekly sync of Passport Index visa requirements"

echo "Created/updated: sync-travel-visa (weekly Sunday 6:00 AM UTC)"

# Weekly: Sync health data (Sunday 7:00 AM UTC)
gcloud scheduler jobs create http sync-travel-health \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --schedule="0 7 * * 0" \
  --uri="$APP_URL/api/admin/sync-travel-data?type=health" \
  --http-method=POST \
  --headers="x-cron-secret=$CRON_SECRET" \
  --time-zone="UTC" \
  --attempt-deadline="600s" \
  --description="Weekly sync of TuGo TravelSafe health data" \
  2>/dev/null || \
gcloud scheduler jobs update http sync-travel-health \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --schedule="0 7 * * 0" \
  --uri="$APP_URL/api/admin/sync-travel-data?type=health" \
  --http-method=POST \
  --headers="x-cron-secret=$CRON_SECRET" \
  --time-zone="UTC" \
  --attempt-deadline="600s" \
  --description="Weekly sync of TuGo TravelSafe health data"

echo "Created/updated: sync-travel-health (weekly Sunday 7:00 AM UTC)"
echo ""
echo "All scheduler jobs configured. List them with:"
echo "  gcloud scheduler jobs list --project=$PROJECT_ID --location=$LOCATION"
