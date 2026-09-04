#!/usr/bin/env bash
# PHASE 0/8 — hit every GET route declared in server.ts and print a status table.
# Usage: BASE=http://localhost:3000 bash scripts/audit/smoke-endpoints.sh
set -uo pipefail
BASE="${BASE:-http://localhost:3000}"
# PHASE 4 batch 2: admin reads are now RBAC-gated, so the smoke run signs in as
# staff first. Without a token the protected surfaces correctly answer 401 and
# the table would report false regressions. Override with TOKEN=... to skip.
TOKEN="${TOKEN:-}"
if [[ -z "$TOKEN" ]]; then
  TOKEN=$(curl -s --max-time 15 "$BASE/api/security/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${STAFF_EMAIL:-admin@kisholoy.com}\",\"password\":\"${STAFF_PASSWORD:-Kisholoy@2026!}\"}" \
    | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
fi
if [[ -z "$TOKEN" ]]; then
  echo "WARN: staff sign-in failed; protected routes will report 401." >&2
fi
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Sample ids used to fill :params so routes are actually exercisable.
declare -A SAMPLE=(
  [id]="ord-101" [orderId]="ord-101" [orderNumber]="KSH-2026-0891"
  [productId]="prod-001" [customerId]="cust-1" [supplierId]="sup-001"
  [returnId]="ret-req-01" [poId]="po-001" [snapshotId]="bk-001"
  [transferId]="tr-001" [pickListId]="pl-001" [manifestId]="man-001"
  [campaignId]="camp-001" [channelId]="ch-001" [reportType]="sales"
  [trackingId]="KSH-TRACK-1" [addressId]="addr-1" [revisionId]="rev-1"
)

fill() {
  local p="$1"
  while [[ "$p" =~ :([A-Za-z]+) ]]; do
    local key="${BASH_REMATCH[1]}"
    local val="${SAMPLE[$key]:-1}"
    p="${p/:$key/$val}"
  done
  echo "$p"
}

printf "%-6s %-60s %s\n" "CODE" "PATH" "NOTE"
printf '%.0s-' {1..90}; echo

pass=0; fail=0
while read -r route; do
  url="$BASE$(fill "$route")"
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 -H "Authorization: Bearer $TOKEN" "$url")
  note=""
  if [[ "$code" == 2* ]]; then pass=$((pass+1));
  else fail=$((fail+1)); note="<-- CHECK"; fi
  printf "%-6s %-60s %s\n" "$code" "$route" "$note"
done < <(grep -oE "app\.get\('[^']+'" "$ROOT/server.ts" | sed "s/app\.get('//;s/'//" | grep -v '^\*$' | sort -u)

echo
echo "PASS(2xx)=$pass  NON-2XX=$fail"
