#!/usr/bin/env bash
# scripts/check-deploy.sh
# Quick post-push health check for bio-two-eta.vercel.app
# Designed for use with: /loop 30s ! bash scripts/check-deploy.sh
#
# Checks:
#   1. Live site HTTP status + CORS origin header
#   2. Latest GitHub Actions run (state + conclusion)
#   3. Open CodeQL code-scanning alert count
#
# All output is one line per check so /loop diff detection works cleanly.

SITE="https://bio-two-eta.vercel.app"
REPO="MikeGira/Bio"

# ── 1. Live site ──────────────────────────────────────────────────────────────
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SITE" 2>/dev/null || echo "ERR")
CORS=$(curl -s -D - -o /dev/null --max-time 10 -H "Origin: $SITE" "$SITE/api/chat" 2>/dev/null \
  | grep -i "access-control-allow-origin" | tr -d '\r' | awk '{print $2}' | head -1)
CORS="${CORS:-none}"

if [ "$HTTP" = "200" ]; then
  SITE_STATUS="✓ ${HTTP}"
else
  SITE_STATUS="✗ ${HTTP}"
fi

# ── 2. Latest GitHub Actions run ──────────────────────────────────────────────
RUN_JSON=$(gh run list --repo "$REPO" --limit 1 --json status,conclusion,displayTitle 2>/dev/null)
RUN_STATUS=$(echo "$RUN_JSON" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
RUN_CONCLUSION=$(echo "$RUN_JSON" | grep -o '"conclusion":"[^"]*"' | cut -d'"' -f4)
RUN_TITLE=$(echo "$RUN_JSON" | grep -o '"displayTitle":"[^"]*"' | cut -d'"' -f4 | cut -c1-40)

if [ "$RUN_STATUS" = "completed" ] && [ "$RUN_CONCLUSION" = "success" ]; then
  CI_STATUS="✓ CI passed"
elif [ "$RUN_STATUS" = "in_progress" ] || [ "$RUN_STATUS" = "queued" ]; then
  CI_STATUS="⏳ CI ${RUN_STATUS}"
else
  CI_STATUS="✗ CI ${RUN_CONCLUSION:-unknown}"
fi

# ── 3. Code scanning alerts ───────────────────────────────────────────────────
ALERT_COUNT=$(gh api "repos/${REPO}/code-scanning/alerts?state=open" 2>/dev/null \
  | grep -o '"number"' | wc -l | tr -d ' ')
ALERT_COUNT="${ALERT_COUNT:-?}"

if [ "$ALERT_COUNT" = "0" ]; then
  SCAN_STATUS="✓ 0 open alerts"
else
  SCAN_STATUS="⚠ ${ALERT_COUNT} open alert(s)"
fi

# ── Output ────────────────────────────────────────────────────────────────────
TIMESTAMP=$(date +"%H:%M:%S")
echo "[${TIMESTAMP}] Site: ${SITE_STATUS}  CORS: ${CORS}  |  ${CI_STATUS}: ${RUN_TITLE}  |  CodeQL: ${SCAN_STATUS}"
