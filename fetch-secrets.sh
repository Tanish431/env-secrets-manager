#!/usr/bin/env bash
# Usage: source ./fetch-secrets.sh <environment> <api_key>
# Example: source ./fetch-secrets.sh production my-admin-key
#
# Must be sourced (not executed) so exports persist in current shell.

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "Error: this script must be sourced, not executed." >&2
  echo "Usage: source ./fetch-secrets.sh <environment> <api_key>" >&2
  exit 1
fi

set -uo pipefail

ENVIRONMENT="${1:-}"
API_KEY="${2:-}"
BASE_URL="${SECRETS_BASE_URL:-http://localhost:3000}"

if [[ -z "$ENVIRONMENT" ]]; then
  echo "Error: environment is required" >&2
  echo "Usage: source ./fetch-secrets.sh <environment> <api_key>" >&2
  return 1
fi

if [[ -z "$API_KEY" ]]; then
  echo "Error: api_key is required" >&2
  echo "Usage: source ./fetch-secrets.sh <environment> <api_key>" >&2
  return 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is required to parse API responses." >&2
  return 1
fi

echo "Fetching secrets for environment: $ENVIRONMENT"

AUDIT_RESPONSE="$(curl -fsS "$BASE_URL/admin/audit?limit=500" -H "X-API-Key: $API_KEY" 2>/dev/null || true)"

if [[ -z "$AUDIT_RESPONSE" ]]; then
  echo "Failed to fetch audit log. Make sure the API is running and use an admin key." >&2
  return 1
fi

KEYS="$(
  printf '%s' "$AUDIT_RESPONSE" | node -e '
    let input = "";
    process.stdin.on("data", (chunk) => { input += chunk; });
    process.stdin.on("end", () => {
      try {
        const payload = JSON.parse(input);
        const targetEnv = process.argv[1];
        const logs = Array.isArray(payload.logs) ? payload.logs : [];
        const keys = [...new Set(
          logs
            .filter((entry) => entry.environment === targetEnv && entry.secret_key)
            .map((entry) => entry.secret_key)
        )];
        process.stdout.write(keys.join("\n"));
      } catch {
        process.exit(1);
      }
    });
  ' "$ENVIRONMENT"
)"

if [[ -z "$KEYS" ]]; then
  echo "No secret keys found in audit log for environment: $ENVIRONMENT" >&2
  return 0
fi

COUNT=0
while IFS= read -r KEY; do
  [[ -z "$KEY" ]] && continue

  RESPONSE="$(
    curl -fsS "$BASE_URL/secrets/$KEY?environment=$ENVIRONMENT" \
      -H "X-API-Key: $API_KEY" 2>/dev/null || true
  )"

  if [[ -z "$RESPONSE" ]]; then
    echo "  Skipped $KEY (not readable or not found)"
    continue
  fi

  VALUE="$(
    printf '%s' "$RESPONSE" | node -e '
      let input = "";
      process.stdin.on("data", (chunk) => { input += chunk; });
      process.stdin.on("end", () => {
        try {
          const payload = JSON.parse(input);
          if (typeof payload.value === "string") {
            process.stdout.write(payload.value);
          } else {
            process.exit(1);
          }
        } catch {
          process.exit(1);
        }
      });
    '
  )"

  export "$KEY=$VALUE"
  echo "  Exported $KEY"
  COUNT=$((COUNT + 1))
done <<< "$KEYS"

echo "Done. $COUNT secret(s) exported to shell."
