#!/usr/bin/env bash
# Create (or reuse) the Bookmarked Premium Stripe product and monthly price.
# Requires STRIPE_SECRET_KEY (sk_test_… or sk_live_…) in the environment.
#
# Usage:
#   STRIPE_SECRET_KEY=sk_test_… ./scripts/setup-stripe-catalog.sh
#   ./scripts/setup-stripe-catalog.sh   # reads STRIPE_SECRET_KEY from root .env if present
#
# Prints product ID and price ID on success. Does not set Supabase secrets.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
if [[ -z "$STRIPE_SECRET_KEY" ]]; then
  echo "error: set STRIPE_SECRET_KEY (sk_test_… or sk_live_…)" >&2
  exit 1
fi

PRODUCT_NAME="Bookmarked Premium"
PRODUCT_DESCRIPTION="Advanced analytics, AI reading insights, and early access across web and mobile."
PRICE_AMOUNT_CENTS=499
PRICE_CURRENCY=usd
PRICE_INTERVAL=month
LOOKUP_KEY="bookmarked_premium_monthly"

stripe_api() {
  local method="$1"
  local path="$2"
  shift 2
  curl -sS -X "$method" "https://api.stripe.com/v1${path}" \
    -u "${STRIPE_SECRET_KEY}:" \
    "$@"
}

json_field() {
  local field="$1"
  python3 -c 'import json,sys; print(json.load(sys.stdin).get(sys.argv[1],""))' "$field"
}

find_product_id() {
  local cursor=""
  while true; do
    local url="/products?limit=100&active=true"
    if [[ -n "$cursor" ]]; then
      url="${url}&starting_after=${cursor}"
    fi
    local response
    response="$(stripe_api GET "$url")"
    local product_id
    product_id="$(printf '%s' "$response" | python3 -c '
import json, sys
data = json.load(sys.stdin)
for item in data.get("data", []):
    if item.get("name") == sys.argv[1]:
        print(item["id"])
        break
' "$PRODUCT_NAME")"
    if [[ -n "$product_id" ]]; then
      echo "$product_id"
      return 0
    fi
    local has_more
    has_more="$(printf '%s' "$response" | json_field has_more)"
    if [[ "$has_more" != "True" ]]; then
      return 1
    fi
    cursor="$(printf '%s' "$response" | python3 -c 'import json,sys; d=json.load(sys.stdin).get("data",[]); print(d[-1]["id"] if d else "")')"
    if [[ -z "$cursor" ]]; then
      return 1
    fi
  done
}

find_price_id() {
  local product_id="$1"
  stripe_api GET "/prices?product=${product_id}&active=true&limit=100" | python3 -c '
import json, sys
product_id = sys.argv[1]
lookup_key = sys.argv[2]
amount = int(sys.argv[3])
interval = sys.argv[4]
for item in json.load(sys.stdin).get("data", []):
    recurring = item.get("recurring") or {}
    if (
        item.get("lookup_key") == lookup_key
        or (
            item.get("unit_amount") == amount
            and recurring.get("interval") == interval
            and item.get("currency") == "usd"
        )
    ):
        print(item["id"])
        break
' "$product_id" "$LOOKUP_KEY" "$PRICE_AMOUNT_CENTS" "$PRICE_INTERVAL"
}

echo "==> Resolving Stripe product: ${PRODUCT_NAME}"

if product_id="$(find_product_id)"; then
  echo "    Reusing product: ${product_id}"
else
  echo "    Creating product…"
  product_response="$(stripe_api POST /products \
    -d "name=${PRODUCT_NAME}" \
    -d "description=${PRODUCT_DESCRIPTION}" \
    -d "metadata[app]=bookmarked" \
    -d "metadata[tier]=premium" \
    -d "metadata[plan_code]=premium")"
  product_id="$(printf '%s' "$product_response" | json_field id)"
  if [[ -z "$product_id" ]]; then
    echo "error: product creation failed" >&2
    printf '%s\n' "$product_response" >&2
    exit 1
  fi
  echo "    Created product: ${product_id}"
fi

echo "==> Resolving monthly price (\$4.99 USD)"

if price_id="$(find_price_id "$product_id")"; then
  echo "    Reusing price: ${price_id}"
else
  echo "    Creating price…"
  price_response="$(stripe_api POST /prices \
    -d "product=${product_id}" \
    -d "unit_amount=${PRICE_AMOUNT_CENTS}" \
    -d "currency=${PRICE_CURRENCY}" \
    -d "recurring[interval]=${PRICE_INTERVAL}" \
    -d "lookup_key=${LOOKUP_KEY}" \
    -d "metadata[app]=bookmarked" \
    -d "metadata[tier]=premium" \
    -d "metadata[interval]=monthly")"
  price_id="$(printf '%s' "$price_response" | json_field id)"
  if [[ -z "$price_id" ]]; then
    echo "error: price creation failed" >&2
    printf '%s\n' "$price_response" >&2
    exit 1
  fi
  echo "    Created price: ${price_id}"
fi

cat <<EOF

Catalog ready.

  Product : ${PRODUCT_NAME} (${product_id})
  Price   : \$4.99/month (${price_id})
  Lookup  : ${LOOKUP_KEY}

Next steps (Supabase project xtdfeorhdlpnbxycpone):

  ./scripts/supabase-cli.sh secrets set \\
    STRIPE_SECRET_KEY=sk_... \\
    STRIPE_PRICE_ID=${price_id}

  # After creating the Stripe webhook endpoint (see docs/STRIPE_SETUP.md):
  ./scripts/supabase-cli.sh secrets set STRIPE_WEBHOOK_SECRET=whsec_...

  ./scripts/supabase-cli.sh functions deploy create-checkout-session
  ./scripts/supabase-cli.sh functions deploy subscription-webhook

EOF
