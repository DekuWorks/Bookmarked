/**
 * Server-side UGC gate. Issues a short-lived moderation decision that
 * Postgres consumes on insert/update. OpenAI keys stay on the server.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  blockMessageWithOptionalCategory,
  isModerationContentType,
  moderateContent,
  moderationContentFamily,
  moderationOutcome,
  unavailableResult,
  type ModerationContentType,
  type ModerationProvider,
  type ModerationResult,
  type ProviderModerationResult,
} from "../_shared/contentModeration.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function discussionPayload(title: string | null | undefined, body: string): string {
  return `${title ?? ""}\n${body}`;
}

function providerErrorType(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  const message = error.message;
  if (message === "moderation_timeout") return "timeout";
  const statusMatch = message.match(/moderation_provider_(\d+)/);
  if (statusMatch) return `http_${statusMatch[1]}`;
  if (message.includes("abort") || message.includes("network")) return "network";
  return "exception";
}

function providerStatusFromError(error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined;
  const statusMatch = error.message.match(/moderation_provider_(\d+)/);
  return statusMatch ? Number(statusMatch[1]) : undefined;
}

function logModerationEvent(event: Record<string, unknown>): void {
  console.log(JSON.stringify({ source: "moderate-ugc", ...event }));
}

function createOpenAiProvider(apiKey: string, model: string): ModerationProvider {
  return {
    async moderate(text: string): Promise<ProviderModerationResult> {
      const response = await fetch(OPENAI_MODERATION_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, input: text }),
      });
      if (!response.ok) {
        throw new Error(`moderation_provider_${response.status}`);
      }
      const payload = (await response.json()) as {
        results?: Array<{ flagged?: boolean; categories?: Record<string, boolean> }>;
      };
      const first = payload.results?.[0];
      const categories = Object.entries(first?.categories ?? {})
        .filter(([, flagged]) => flagged)
        .map(([name]) => name);
      return { flagged: Boolean(first?.flagged), categories };
    },
  };
}

Deno.serve(async (req) => {
  const started = Date.now();
  const requestId = crypto.randomUUID();

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const openaiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  const openaiModel = Deno.env.get("OPENAI_MODERATION_MODEL")?.trim() || "omni-moderation-latest";

  if (!supabaseUrl || !serviceKey || !anonKey) {
    logModerationEvent({
      requestId,
      outcome: "SERVICE_UNAVAILABLE",
      providerErrorType: "missing_supabase_env",
      latencyMs: Date.now() - started,
    });
    return jsonResponse(unavailableResult(), 503);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const jwt = authHeader.slice("Bearer ".length);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
  if (userError || !userData.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload: {
    text?: unknown;
    title?: unknown;
    contentType?: unknown;
    persistDecision?: unknown;
    contentId?: unknown;
  };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return jsonResponse({ error: "Invalid request." }, 400);
  }

  if (!isModerationContentType(payload.contentType) || payload.contentType === "FUTURE") {
    return jsonResponse({ error: "Unsupported content type." }, 400);
  }

  const contentType = payload.contentType as ModerationContentType;
  const rawText = typeof payload.text === "string" ? payload.text : "";
  const title = typeof payload.title === "string" ? payload.title : "";
  const text =
    contentType === "BOOK_CLUB_DISCUSSION" ? discussionPayload(title, rawText) : rawText;
  const persistDecision = payload.persistDecision !== false;
  const contentId = typeof payload.contentId === "string" ? payload.contentId : null;
  const contentFamily = moderationContentFamily(contentType);

  if (!openaiKey) {
    logModerationEvent({
      requestId,
      contentType,
      contentFamily,
      outcome: "SERVICE_UNAVAILABLE",
      providerErrorType: "missing_provider_key",
      latencyMs: Date.now() - started,
    });
    return jsonResponse(unavailableResult(), 503);
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const provider = createOpenAiProvider(openaiKey, openaiModel);

  let result: ModerationResult;
  let lastProviderError: unknown;
  try {
    result = await moderateContent({
      text,
      contentType,
      userId: userData.user.id,
      provider,
    });
  } catch (error) {
    lastProviderError = error;
    result = unavailableResult();
  }

  const outcome = moderationOutcome(result);

  await admin.from("moderation_logs").insert({
    content_type: contentType,
    content_id: contentId,
    user_id: userData.user.id,
    decision: result.unavailable ? "unavailable" : result.status,
    categories: result.categories,
    moderation_version: result.moderationVersion,
  });

  logModerationEvent({
    requestId,
    contentType,
    contentFamily,
    outcome,
    providerErrorType: result.unavailable ? providerErrorType(lastProviderError ?? new Error("provider_unavailable")) : undefined,
    providerStatus: providerStatusFromError(lastProviderError),
    latencyMs: Date.now() - started,
  });

  if (outcome === "SERVICE_UNAVAILABLE" || outcome === "ERROR") {
    return jsonResponse({ ...result, outcome }, 503);
  }

  if (result.status === "block") {
    return jsonResponse({
      ...result,
      outcome: "BLOCK",
      userMessage: blockMessageWithOptionalCategory(result),
    });
  }

  if (persistDecision && text.trim()) {
    const { data: hashRow, error: hashError } = await admin.rpc("moderation_content_hash", {
      p_text: text,
    });
    if (hashError || typeof hashRow !== "string") {
      logModerationEvent({
        requestId,
        contentType,
        contentFamily,
        outcome: "SERVICE_UNAVAILABLE",
        providerErrorType: "hash_rpc",
        latencyMs: Date.now() - started,
      });
      return jsonResponse(unavailableResult(), 503);
    }

    const { error: decisionError } = await admin.from("moderation_decisions").insert({
      user_id: userData.user.id,
      content_type: contentType,
      content_hash: hashRow,
      status: result.status,
      categories: result.categories,
      spans: result.spans,
      reason_code: result.reasonCode,
      moderation_version: result.moderationVersion,
    });
    if (decisionError) {
      logModerationEvent({
        requestId,
        contentType,
        contentFamily,
        outcome: "SERVICE_UNAVAILABLE",
        providerErrorType: "decision_insert",
        latencyMs: Date.now() - started,
      });
      return jsonResponse(unavailableResult(), 503);
    }
  }

  return jsonResponse({ ...result, outcome });
});
