#!/bin/bash

set -euo pipefail

STRICT_MODE=false
if [ "${1:-}" = "--strict" ]; then
  STRICT_MODE=true
fi

ERRORS=0
WARNINGS=0

pass() { echo "OK   $1"; }
warn() { echo "WARN $1"; WARNINGS=$((WARNINGS + 1)); }
fail() { echo "FAIL $1"; ERRORS=$((ERRORS + 1)); }

[ -f .env ] && set -a && . ./.env && set +a

command -v node >/dev/null 2>&1 && pass "Node installed" || fail "Node missing"
command -v docker >/dev/null 2>&1 && pass "Docker installed" || fail "Docker missing"
docker compose version >/dev/null 2>&1 && pass "Docker Compose available" || fail "Docker Compose missing"
[ -f docker-compose.yml ] && pass "docker-compose.yml present" || fail "docker-compose.yml missing"
[ -f Dockerfile ] && pass "Dockerfile present" || fail "Dockerfile missing"

for var in DB_NAME DB_USER DB_PASSWORD LOCAL_AUTH_SECRET CRON_API_SECRET METABASE_DB_PASSWORD NEXT_PUBLIC_SITE_URL; do
  if [ -n "${!var:-}" ]; then
    pass "$var defined"
  else
    fail "$var missing"
  fi
done

for var in NEXT_PUBLIC_API_BASE_URL GNEWS_API_KEY FINNHUB_API_KEY SMTP_HOST; do
  if [ -n "${!var:-}" ]; then
    pass "$var defined"
  else
    warn "$var missing"
  fi
done

npm run build >/dev/null 2>&1 && pass "npm run build" || fail "npm run build failed"
docker compose -f docker-compose.yml config >/dev/null 2>&1 && pass "Compose config valid" || fail "Compose config invalid"

if [ "$ERRORS" -gt 0 ]; then
  echo "$ERRORS error(s), $WARNINGS warning(s)"
  exit 1
fi

if [ "$WARNINGS" -gt 0 ] && [ "$STRICT_MODE" = true ]; then
  echo "$WARNINGS warning(s) in strict mode"
  exit 1
fi

echo "Pre-deploy checks completed with $WARNINGS warning(s)."
