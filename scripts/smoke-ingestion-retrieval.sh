#!/usr/bin/env bash
set -euo pipefail

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8080}"
EMAIL="${SMOKE_EMAIL:-smoke-$(date +%s)@grounded.dev}"
PASSWORD="${SMOKE_PASSWORD:-CorrectHorseBatteryStaple1}"
NAME="${SMOKE_NAME:-Smoke Tester}"
TENANT_NAME="${SMOKE_TENANT_NAME:-Smoke Workspace}"
TENANT_SLUG="${SMOKE_TENANT_SLUG:-smoke-$(date +%s)}"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local response_file
  local status_file
  LAST_REQUEST="$method $path"
  response_file="$(mktemp)"
  status_file="$(mktemp)"

  if [ -n "$body" ]; then
    curl -sS -X "$method" "$GATEWAY_URL$path" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${ACCESS_TOKEN:-}" \
      -d "$body" \
      -o "$response_file" \
      -w "%{http_code}" > "$status_file"
  else
    curl -sS -X "$method" "$GATEWAY_URL$path" \
      -H "Authorization: Bearer ${ACCESS_TOKEN:-}" \
      -o "$response_file" \
      -w "%{http_code}" > "$status_file"
  fi

  HTTP_STATUS="$(cat "$status_file")"
  RESPONSE_BODY="$(cat "$response_file")"
  rm -f "$response_file" "$status_file"
}

expect_success() {
  if [ "$HTTP_STATUS" -lt 200 ] || [ "$HTTP_STATUS" -gt 299 ]; then
    echo "Request failed: $LAST_REQUEST" >&2
    echo "HTTP status: $HTTP_STATUS" >&2
    echo "$RESPONSE_BODY" >&2
    exit 1
  fi
}

json_value() {
  JSON_BODY="$RESPONSE_BODY" python3 - "$1" <<'PY'
import json
import os
import sys

data = json.loads(os.environ["JSON_BODY"])
path = sys.argv[1].split(".")
value = data
for segment in path:
    if segment.isdigit():
        value = value[int(segment)]
    else:
        value = value[segment]
print(value)
PY
}

need curl
need python3

request GET /api/health
expect_success

REGISTER_BODY="$(python3 - <<PY
import json
print(json.dumps({
    "email": "$EMAIL",
    "password": "$PASSWORD",
    "name": "$NAME",
    "tenant_name": "$TENANT_NAME",
    "tenant_slug": "$TENANT_SLUG",
}))
PY
)"

request POST /api/auth/register "$REGISTER_BODY"
expect_success
VERIFICATION_TOKEN="$(json_value dev_verification_token)"

VERIFY_BODY="$(TOKEN="$VERIFICATION_TOKEN" python3 - <<'PY'
import json
import os
print(json.dumps({
    "token": os.environ["TOKEN"],
}))
PY
)"

request POST /api/auth/email/verify "$VERIFY_BODY"
expect_success

LOGIN_BODY="$(python3 - <<PY
import json
print(json.dumps({
    "email": "$EMAIL",
    "password": "$PASSWORD",
    "device_label": "backend-smoke",
}))
PY
)"

request POST /api/auth/login "$LOGIN_BODY"
expect_success
ACCESS_TOKEN="$(json_value access_token)"

DOCUMENT_BODY="$(python3 - <<'PY'
import json
print(json.dumps({
    "filename": "smoke-contract.md",
    "title": "Smoke Contract",
    "content_type": "text/markdown",
    "content": "# Smoke Contract\nTermination requires 30 days notice. Renewal requires written approval. Confidentiality survives termination.",
}))
PY
)"

request POST /api/documents "$DOCUMENT_BODY"
expect_success
DOCUMENT_ID="$(json_value document.id)"

for _ in $(seq 1 30); do
  request GET "/api/documents/$DOCUMENT_ID"
  expect_success
  DOCUMENT_STATUS="$(json_value status)"
  if [ "$DOCUMENT_STATUS" = "indexed" ]; then
    break
  fi
  if [ "$DOCUMENT_STATUS" = "failed" ]; then
    echo "Document indexing failed" >&2
    request GET "/api/documents/$DOCUMENT_ID/jobs"
    echo "$RESPONSE_BODY" >&2
    exit 1
  fi
  sleep 2
done

if [ "$DOCUMENT_STATUS" != "indexed" ]; then
  echo "Document did not become indexed in time" >&2
  request GET "/api/documents/$DOCUMENT_ID/jobs"
  echo "$RESPONSE_BODY" >&2
  exit 1
fi

QUESTION_BODY="$(python3 - <<'PY'
import json
print(json.dumps({
    "question": "What does the contract say about termination?",
}))
PY
)"

request POST /api/questions "$QUESTION_BODY"
expect_success
CITATION_COUNT="$(JSON_BODY="$RESPONSE_BODY" python3 -c 'import json, os; print(len(json.loads(os.environ["JSON_BODY"])["citations"]))')"

if [ "$CITATION_COUNT" -lt 1 ]; then
  echo "Expected at least one citation" >&2
  echo "$RESPONSE_BODY" >&2
  exit 1
fi

echo "Smoke test passed"
echo "Document: $DOCUMENT_ID"
echo "Citations: $CITATION_COUNT"
