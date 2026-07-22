/**
 * Rate-limit stub — returns 429 when a shared secret header is missing.
 *
 * Not wired into production routes yet. Use as a template for Edge Function
 * rate limiting (e.g. ISBNdb proxy, subscription webhook) once Redis or
 * Supabase rate-limit tables are available.
 *
 * Deploy: supabase functions deploy rate-limit-stub
 * Test: curl -X POST -H "x-rate-limit-key: $RATE_LIMIT_STUB_SECRET" ...
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-rate-limit-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const expected = Deno.env.get("RATE_LIMIT_STUB_SECRET")?.trim();
  if (!expected) {
    console.error("[rate-limit-stub] RATE_LIMIT_STUB_SECRET is not set");
    return jsonResponse({ error: "Rate limiter not configured" }, 503);
  }

  const provided = req.headers.get("x-rate-limit-key")?.trim();
  if (provided !== expected) {
    return jsonResponse(
      {
        error: "Too many requests",
        retry_after_seconds: 60,
      },
      429
    );
  }

  return jsonResponse({
    ok: true,
    note: "Stub only — integrate per-IP or per-user counters before production use.",
  });
});
