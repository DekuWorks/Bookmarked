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
const DEFAULT_MODERATION_MODELS = ["omni-moderation-latest", "text-moderation-latest"] as const;

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

const PROVIDER_ERROR_FLAGS = [
  "quota",
  "billing",
  "budget",
  "rate",
  "limit",
  "exceeded",
  "overloaded",
  "organization",
  "project",
  "permission",
  "country",
  "region",
  "verify",
  "usage",
] as const;

function providerErrorCode(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const error = (payload as { error?: { code?: unknown; type?: unknown; message?: unknown } }).error;
  const code = typeof error?.code === "string" ? error.code : "";
  const type = typeof error?.type === "string" ? error.type : "";
  const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  // Classify only. Never persist the raw OpenAI message.
  if (code) return code.replace(/[^a-z0-9_]/gi, "").slice(0, 40);
  const hits = PROVIDER_ERROR_FLAGS.filter((flag) => message.includes(flag));
  if (hits.includes("quota") || hits.includes("billing") || hits.includes("budget")) {
    return "insufficient_quota";
  }
  if (hits.includes("rate") || (hits.includes("limit") && hits.includes("exceeded"))) {
    return "rate_limit_exceeded";
  }
  if (hits.length > 0) return hits.slice(0, 3).join("_");
  return type.replace(/[^a-z0-9_]/gi, "").slice(0, 40);
}

function providerErrorMessage(status: number, payload: unknown): string {
  const code = providerErrorCode(payload);
  return code ? `moderation_provider_${status}:${code}` : `moderation_provider_${status}`;
}

function moderationModels(preferred: string): string[] {
  const ordered = [preferred, ...DEFAULT_MODERATION_MODELS];
  return [...new Set(ordered.filter(Boolean))];
}

function persistableUnavailableReason(reason?: string): string | null {
  if (!reason) return "provider_unavailable";
  const redacted = reason.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]").slice(0, 120);
  const type = providerErrorType(new Error(redacted));
  const codeMatch = redacted.match(/moderation_provider_\d+:([a-z0-9_]+)/i);
  return codeMatch ? `${type}:${codeMatch[1]}` : type;
}

function createOpenAiProvider(apiKey: string, models: string[]): ModerationProvider {
  return {
    async moderate(text: string, signal?: AbortSignal): Promise<ProviderModerationResult> {
      let lastError: unknown;
      for (let index = 0; index < models.length; index += 1) {
        const model = models[index];
        try {
          const response = await fetch(OPENAI_MODERATION_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ model, input: text }),
            signal,
          });
          if (response.ok) {
            const payload = (await response.json()) as {
              results?: Array<{ flagged?: boolean; categories?: Record<string, boolean> }>;
            };
            const first = payload.results?.[0];
            const categories = Object.entries(first?.categories ?? {})
              .filter(([, flagged]) => flagged)
              .map(([name]) => name);
            return { flagged: Boolean(first?.flagged), categories };
          }
          const payload = await response.json().catch(() => null);
          const error = new Error(providerErrorMessage(response.status, payload));
          // Same key will fail the same way on the next model.
          if (response.status === 401 || response.status === 403) throw error;
          // Invalid / retired model: try the next documented text model.
          if (response.status === 400 && index < models.length - 1) {
            lastError = error;
            continue;
          }
          throw error;
        } catch (error) {
          if (error instanceof Error && (error.name === "AbortError" || error.message.includes("abort"))) {
            throw new Error("moderation_timeout");
          }
          lastError = error;
          if (
            error instanceof Error &&
            /moderation_provider_400/.test(error.message) &&
            index < models.length - 1
          ) {
            continue;
          }
          throw error;
        }
      }
      throw lastError instanceof Error ? lastError : new Error("moderation_provider_error");
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
  const provider = createOpenAiProvider(openaiKey, moderationModels(openaiModel));

  let result: ModerationResult;
  try {
    result = await moderateContent({
      text,
      contentType,
      userId: userData.user.id,
      provider,
    });
  } catch (error) {
    result = unavailableResult();
    result.unavailableReason = error instanceof Error ? error.message : "unknown";
  }

  const outcome = moderationOutcome(result);
  const providerError = result.unavailableReason
    ? new Error(result.unavailableReason)
    : result.unavailable
      ? new Error("provider_unavailable")
      : undefined;

  await admin.from("moderation_logs").insert({
    content_type: contentType,
    content_id: contentId,
    user_id: userData.user.id,
    decision: result.unavailable ? "unavailable" : result.status,
    categories: result.categories,
    moderation_version: result.moderationVersion,
    unavailable_reason: result.unavailable ? persistableUnavailableReason(result.unavailableReason) : null,
    latency_ms: Date.now() - started,
  });

  logModerationEvent({
    requestId,
    contentType,
    contentFamily,
    outcome,
    providerErrorType: result.unavailable ? providerErrorType(providerError) : undefined,
    providerStatus: providerStatusFromError(providerError),
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
