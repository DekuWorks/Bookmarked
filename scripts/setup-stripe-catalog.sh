#!/usr/bin/env bash
# Create (or reuse) Bookmarked Plus Stripe product + monthly/yearly prices.
# Requires STRIPE_SECRET_KEY (sk_test_… or sk_live_…) in the environment.
#
# Usage:
#   STRIPE_SECRET_KEY=sk_test_… ./scripts/setup-stripe-catalog.sh
#   STRIPE_SECRET_KEY=sk_live_… ./scripts/setup-stripe-catalog.sh --live
#
# Pricing (product brief): Plus $5.99/mo · $59.99/yr
# Does not invent or hardcode live price IDs — prints placeholders to set as secrets.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIVE_MODE=0

for arg in "$@"; do
  case "$arg" in
    --live) LIVE_MODE=1 ;;
    -h|--help)
      cat <<'EOF'
Usage: ./scripts/setup-stripe-catalog.sh [--live]

  --live   Require sk_live_… and create/reuse the production Stripe catalog

Without --live, uses STRIPE_SECRET_KEY as-is (typically sk_test_… for staging).
EOF
      exit 0
      ;;
    *)
      echo "error: unknown argument: ${arg}" >&2
      exit 1
      ;;
  esac
done

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

if [[ -f "$ROOT/.env.stripe.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env.stripe.local"
  set +a
fi

STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
if [[ -z "$STRIPE_SECRET_KEY" ]]; then
  echo "error: set STRIPE_SECRET_KEY (sk_test_… or sk_live_…)" >&2
  exit 1
fi

if [[ "$LIVE_MODE" -eq 1 ]]; then
  if [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_live_ ]]; then
    echo "error: --live requires STRIPE_SECRET_KEY to start with sk_live_" >&2
    exit 1
  fi
  echo "==> Live mode (production Stripe catalog)"
elif [[ "$STRIPE_SECRET_KEY" =~ ^sk_live_ ]]; then
  echo "==> Live key detected (production catalog)"
else
  echo "==> Test mode catalog (pass --live with sk_live_… for production)"
fi

PRODUCT_NAME="Bookmarked Plus"
PRODUCT_DESCRIPTION="Unlimited shelves, full Reading DNA, advanced insights, and Plus features across web and iOS."
MONTHLY_AMOUNT_CENTS=599
YEARLY_AMOUNT_CENTS=5999
PRICE_CURRENCY=usd
MONTHLY_LOOKUP_KEY="bookmarked_plus_monthly"
YEARLY_LOOKUP_KEY="bookmarked_plus_yearly"

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
names = {sys.argv[1], "Bookmarked Premium"}
for item in data.get("data", []):
    if item.get("name") in names:
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
  local lookup_key="$2"
  local amount="$3"
  local interval="$4"
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
' "$product_id" "$lookup_key" "$amount" "$interval"
}

ensure_price() {
  local product_id="$1"
  local amount="$2"
  local interval="$3"
  local lookup_key="$4"
  local label="$5"

  echo "==> Resolving ${label}" >&2
  local price_id
  price_id="$(find_price_id "$product_id" "$lookup_key" "$amount" "$interval" || true)"
  if [[ -n "$price_id" ]]; then
    echo "    Reusing price: ${price_id}" >&2
    printf '%s' "$price_id"
    return 0
  fi

  echo "    Creating price…" >&2
  local price_response
  price_response="$(stripe_api POST /prices \
    -d "product=${product_id}" \
    -d "unit_amount=${amount}" \
    -d "currency=${PRICE_CURRENCY}" \
    -d "recurring[interval]=${interval}" \
    -d "lookup_key=${lookup_key}" \
    -d "metadata[app]=bookmarked" \
    -d "metadata[tier]=plus" \
    -d "metadata[interval]=${interval}")"
  price_id="$(printf '%s' "$price_response" | json_field id)"
  if [[ -z "$price_id" ]]; then
    echo "error: price creation failed for ${label}" >&2
    printf '%s\n' "$price_response" >&2
    exit 1
  fi
  echo "    Created price: ${price_id}" >&2
  printf '%s' "$price_id"
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
    -d "metadata[tier]=plus" \
    -d "metadata[plan_code]=plus")"
  product_id="$(printf '%s' "$product_response" | json_field id)"
  if [[ -z "$product_id" ]]; then
    echo "error: product creation failed" >&2
    printf '%s\n' "$product_response" >&2
    exit 1
  fi
  echo "    Created product: ${product_id}"
fi

monthly_price_id="$(ensure_price "$product_id" "$MONTHLY_AMOUNT_CENTS" "month" "$MONTHLY_LOOKUP_KEY" "monthly price (\$5.99 USD)")"
yearly_price_id="$(ensure_price "$product_id" "$YEARLY_AMOUNT_CENTS" "year" "$YEARLY_LOOKUP_KEY" "yearly price (\$59.99 USD)")"

mode_label="test"
if [[ "$STRIPE_SECRET_KEY" =~ ^sk_live_ ]]; then
  mode_label="live"
fi

cat <<EOF

Catalog ready (${mode_label} mode).

  Product : ${PRODUCT_NAME} (${product_id})
  Monthly : \$5.99/month (${monthly_price_id})
  Yearly  : \$59.99/year (${yearly_price_id})
  Lookups : ${MONTHLY_LOOKUP_KEY}, ${YEARLY_LOOKUP_KEY}

Next steps (set real IDs from this run — do not invent placeholders in production):

  ./scripts/supabase-cli.sh secrets set \\
    STRIPE_SECRET_KEY="\$STRIPE_SECRET_KEY" \\
    STRIPE_PRICE_ID=${monthly_price_id} \\
    STRIPE_PRICE_ID_YEARLY=${yearly_price_id}

  # After creating the Stripe webhook endpoint (see docs/STRIPE_SETUP.md):
  ./scripts/supabase-cli.sh secrets set STRIPE_WEBHOOK_SECRET=whsec_...

  ./scripts/supabase-cli.sh functions deploy create-checkout-session subscription-webhook apple-iap-verify

EOF
