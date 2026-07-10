/**
 * Proxies ISBNdb API v2 requests so the API key stays server-side.
 * Client calls: GET /functions/v1/isbndb?path=books/query&page=1&pageSize=12
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ISBNDB_BASE = "https://api2.isbndb.com";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const ALLOWED_PATH_PREFIXES = ["book/", "books/", "author/", "authors/"];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function isAllowedPath(path: string): boolean {
  const cleaned = path.replace(/^\/+/, "");
  return ALLOWED_PATH_PREFIXES.some((prefix) => cleaned.startsWith(prefix));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ISBNDB_API_KEY")?.trim();
  if (!apiKey) {
    console.error("[isbndb] ISBNDB_API_KEY secret is not set");
    return jsonResponse({ error: "ISBNdb proxy is not configured" }, 500);
  }

  const url = new URL(req.url);
  const pathParam = url.searchParams.get("path")?.trim() ?? "";
  if (!pathParam || !isAllowedPath(pathParam)) {
    return jsonResponse(
      {
        error:
          "Invalid path. Use path=book/{isbn}, books/{query}, or author/{name}",
      },
      400
    );
  }

  const upstream = new URL(`${ISBNDB_BASE}/${pathParam.replace(/^\/+/, "")}`);
  for (const [key, value] of url.searchParams.entries()) {
    if (key === "path") continue;
    upstream.searchParams.set(key, value);
  }

  try {
    const upstreamRes = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12000),
    });

    const text = await upstreamRes.text();
    const contentType =
      upstreamRes.headers.get("Content-Type") ?? "application/json";

    return new Response(text, {
      status: upstreamRes.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("[isbndb] upstream fetch failed:", error);
    return jsonResponse({ error: "Could not reach ISBNdb" }, 502);
  }
});
