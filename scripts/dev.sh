#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

cd "$ROOT_DIR"

docker compose -f infra/docker/docker-compose.yml stop web >/dev/null 2>&1 || true

npm run dev:backend

for attempt in {1..60}; do
  if curl -fsS "$GATEWAY_URL/api/health" >/dev/null; then
    break
  fi

  if [ "$attempt" -eq 60 ]; then
    echo "Gateway did not become healthy at $GATEWAY_URL"
    exit 1
  fi

  sleep 2
done

npm run db:migrate

if curl -fsS "$WEB_URL" >/dev/null; then
  echo "Backend is ready at $GATEWAY_URL"
  echo "Web is already running at $WEB_URL"
  while true; do
    sleep 3600
  done
fi

NEXT_PUBLIC_GATEWAY_URL="$GATEWAY_URL" npm run dev:web
