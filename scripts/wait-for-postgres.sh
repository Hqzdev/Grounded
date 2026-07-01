#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-infra/docker/docker-compose.yml}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-grounded}"
POSTGRES_DB="${POSTGRES_DB:-grounded}"

for _ in $(seq 1 60); do
  if docker compose -f "$COMPOSE_FILE" exec -T "$POSTGRES_SERVICE" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    exit 0
  fi
  sleep 2
done

echo "Postgres did not become ready" >&2
exit 1
