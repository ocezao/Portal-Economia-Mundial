#!/bin/bash

set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js not found"
  exit 1
fi

[ -f .env ] && set -a && . ./.env && set +a

for var in DB_NAME DB_USER DB_PASSWORD LOCAL_AUTH_SECRET; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: missing required variable $var"
    exit 1
  fi
done

rm -rf .next
npm ci
npm run build
docker compose -f docker-compose.yml config >/dev/null

echo "Build completed successfully."
echo "Next step: bash ./scripts/deploy-check.sh --strict"
