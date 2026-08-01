/**
 * AI reading insights via OpenAI (server-side).
 * Requires OPENAI_API_KEY Supabase secret. Falls back client-side when unavailable.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AiInsightItem = {
  id: string;
  title: string;
  body: string;
  emoji?: string;
};

type AiInsightsResult = {
  highlights: AiInsightItem[];
  patterns: AiInsightItem[];
  prompts: AiInsightItem[];
  hasData: boolean;
};

type AiInsightsContext = {
  stats: Record<string, number | null>;
  topMood: string | null;
  topGenre: string | null;
  favoriteGenres: string[];
  topBooksByPages: { title: string; pages: number }[];
  recentFinished: { title: string; rating: number | null }[];
  currentlyReading: { title: string; progressPercent: number } | null;
  recentNoteExcerpts: { bookTitle: string; excerpt: string }[];
  reviewFeelings: string[];
  hasData: boolean;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function subscriptionIsActive(row: {
  subscription_tier: string;
  subscription_status: string;
  subscription_expires_at: string | null;
}): boolean {
  if (!["plus", "home"].includes(row.subscription_tier)) return false;
  const status = row.subscription_status;
  if (status === "expired" || status === "inactive") return false;
  const entitled = ["active", "trialing", "past_due", "grace_period", "canceled"].includes(status);
  if (!entitled) return false;
  if (!row.subscription_expires_at) return status !== "canceled";
  const expiresAt = new Date(row.subscription_expires_at).getTime();
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

function buildUserPrompt(context: AiInsightsContext): string {
  return [
    "Generate personalized reading insights for this Bookmarked user.",
    "Use ONLY the facts below. Do not invent books, stats, or moods.",
    "Return JSON with keys: highlights, patterns, prompts.",
    "Each array item: { id, title, body, emoji }.",
    "- highlights: 2-4 celebratory stats (pace, streak, top book)",
    "- patterns: 2-4 observations (genre, mood, rereads, favorites)",
    "- prompts: 2-3 reflection questions tied to their notes or current read",
    "",
    JSON.stringify(context, null, 2),
  ].join("\n");
}

function sanitizeList(raw: unknown, prefix: string, max: number): AiInsightItem[] {
  if (!Array.isArray(raw)) return [];
  const items: AiInsightItem[] = [];
  for (let i = 0; i < raw.length && items.length < max; i++) {
    const row = raw[i];
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const body = typeof item.body === "string" ? item.body.trim() : "";
    if (!title || !body) continue;
    items.push({
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id.trim()
          : `${prefix}-${items.length + 1}`,
      title,
      body,
      emoji:
        typeof item.emoji === "string" && item.emoji.trim() ? item.emoji.trim() : undefined,
    });
  }
  return items;
}

function parseOpenAiPayload(raw: string, hasData: boolean): AiInsightsResult | null {
  try {
    const payload = JSON.parse(raw) as Record<string, unknown>;
    const highlights = sanitizeList(payload.highlights, "highlight", 5);
    const patterns = sanitizeList(payload.patterns, "pattern", 5);
    const prompts = sanitizeList(payload.prompts, "prompt", 3);
    if (highlights.length === 0 && patterns.length === 0 && prompts.length === 0) {
      return null;
    }
    return { highlights, patterns, prompts, hasData };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { data: subscription, error: subError } = await supabase
    .from("user_subscriptions")
    .select("subscription_tier, subscription_status, subscription_expires_at")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (subError) {
    console.error("[ai-insights] subscription lookup failed", subError);
    return jsonResponse({ source: "fallback", error: "subscription_check_failed" });
  }

  if (!subscription || !subscriptionIsActive(subscription)) {
    return jsonResponse({ error: "Premium required" }, 403);
  }

  let body: { context?: AiInsightsContext };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const context = body.context;
  if (!context?.hasData) {
    return jsonResponse({ source: "fallback", insights: null });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (!apiKey) {
    return jsonResponse({ source: "fallback", insights: null });
  }

  const model = Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-4o-mini";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a warm, concise reading coach for Bookmarked. Output valid JSON only. Never fabricate data.",
          },
          { role: "user", content: buildUserPrompt(context) },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[ai-insights] OpenAI error", response.status, await response.text());
      return jsonResponse({ source: "fallback", insights: null });
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return jsonResponse({ source: "fallback", insights: null });
    }

    const insights = parseOpenAiPayload(content, context.hasData);
    if (!insights) {
      return jsonResponse({ source: "fallback", insights: null });
    }

    return jsonResponse({ source: "openai", insights });
  } catch (error) {
    console.error("[ai-insights] request failed", error);
    return jsonResponse({ source: "fallback", insights: null });
  }
});
