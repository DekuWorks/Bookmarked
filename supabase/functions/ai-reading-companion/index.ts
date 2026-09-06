/**
 * Plus AI Reading Companion. Keys stay server-side.
 * Clients send book/progress context only — never a trust-me entitlement flag.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ACTIONS = new Set([
  "discussion_questions",
  "character_map",
  "timeline",
  "reading_schedule",
  "ending_explanation",
  "personalized_tbr",
]);

type CompanionBody = {
  action?: string;
  bookTitle?: string;
  format?: "book" | "audiobook";
  shelfStatus?: string | null;
  progressPercent?: number | null;
  finished?: boolean;
  endingConfirmed?: boolean;
  listeningSeconds?: number | null;
  days?: number | null;
  context?: Record<string, unknown>;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function isFinished(body: CompanionBody): boolean {
  return Boolean(body.finished) || body.shelfStatus === "read";
}

function endingBlocked(body: CompanionBody): boolean {
  return body.action === "ending_explanation" && !isFinished(body) && !body.endingConfirmed;
}

function systemPrompt(body: CompanionBody): string {
  const finished = isFinished(body);
  const percent = Math.max(0, Math.min(100, Number(body.progressPercent) || 0));
  const lines = [
    "You are the Bookmarked AI Reading Companion.",
    "Use only the supplied reader context. Never invent other users' private notes.",
    "Do not present guesses as certainty.",
    `Book: ${body.bookTitle ?? "Unknown"}`,
    `Format: ${body.format ?? "book"}`,
    finished
      ? "Reader has finished this book."
      : `Reader is about ${percent}% through and has not finished.`,
  ];
  if (!finished && body.action !== "ending_explanation") {
    lines.push("Do not spoil later plot, ending, or unrevealed identities.");
  }
  if (body.action === "character_map") {
    lines.push(
      "Character relationships are a reading aid, not a verified fact. Treat inferred links as suggestions."
    );
  }
  if (body.action === "reading_schedule" && body.format === "audiobook") {
    lines.push("Give listening time as HH:MM. Never invent page counts for audiobooks.");
  }
  if (body.action === "personalized_tbr") {
    lines.push("Explain each suggestion. Treat DNF history carefully.");
  }
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) return jsonResponse({ error: "Server misconfigured" }, 500);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return jsonResponse({ error: "Unauthorized" }, 401);

  let body: CompanionBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body.action || !ACTIONS.has(body.action)) {
    return jsonResponse({ error: "Unknown companion action" }, 400);
  }
  if (endingBlocked(body)) {
    return jsonResponse(
      { error: "ending_confirm_required", message: "Confirm you want ending thoughts before you finish." },
      409
    );
  }

  const usage = await supabase.rpc("try_increment_ai_companion_usage", { p_limit: 20 });
  if (usage.error) return jsonResponse({ error: usage.error.message }, 400);
  const usageRow = usage.data as { ok?: boolean; error?: string } | null;
  if (!usageRow?.ok) {
    const status = usageRow?.error === "plus_required" ? 403 : 429;
    return jsonResponse({ error: usageRow?.error ?? "rate_limited" }, status);
  }

  const cacheKey = [
    body.action,
    body.bookTitle ?? "",
    body.format ?? "book",
    String(body.progressPercent ?? 0),
    String(Boolean(body.endingConfirmed)),
  ].join("|");

  const { data: cached } = await supabase
    .from("ai_companion_cache")
    .select("payload, created_at")
    .eq("user_id", userData.user.id)
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (cached?.payload && cached.created_at) {
    const ageMs = Date.now() - new Date(cached.created_at).getTime();
    if (ageMs < 24 * 60 * 60 * 1000) {
      return jsonResponse({ source: "cache", result: cached.payload });
    }
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (!apiKey) {
    return jsonResponse({
      source: "fallback",
      result: {
        title: "Companion unavailable",
        body: "The companion could not reach a model just now. Try again later.",
      },
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt(body) },
          {
            role: "user",
            content: JSON.stringify({
              action: body.action,
              context: body.context ?? {},
              listeningSeconds: body.listeningSeconds ?? null,
              days: body.days ?? null,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[ai-reading-companion] OpenAI error", response.status);
      return jsonResponse({ source: "fallback", result: null }, 200);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return jsonResponse({ source: "fallback", result: null });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return jsonResponse({ source: "fallback", result: null });
    }

    const promptTokens = Number(payload?.usage?.prompt_tokens) || 0;
    const completionTokens = Number(payload?.usage?.completion_tokens) || 0;
    if (promptTokens || completionTokens) {
      await supabase.rpc("try_increment_ai_companion_usage", {
        p_limit: 1000,
        p_prompt_tokens: promptTokens,
        p_completion_tokens: completionTokens,
      });
    }

    await supabase.from("ai_companion_cache").upsert({
      user_id: userData.user.id,
      cache_key: cacheKey,
      payload: parsed,
    });

    return jsonResponse({ source: "openai", result: parsed });
  } catch (error) {
    console.error("[ai-reading-companion] request failed", error);
    return jsonResponse({ source: "fallback", result: null });
  }
});
