import {
  dedupeAsync,
  fetchWithTimeout,
  gateFromModeration,
  isModerationContentType,
  moderationRequestKey,
  parseModerationResponse,
  withModerationRetries,
  MODERATION_CLIENT_TIMEOUT_MS,
  MODERATION_UNAVAILABLE_MESSAGE,
  type ModerationContentType,
  type ModerationOutcome,
  type ModerationResult,
} from "../../../../../packages/utils";
import { createClient } from "@/lib/supabase/client";

export type ModerateUgcInput = {
  text: string;
  contentType: ModerationContentType;
  title?: string | null;
  persistDecision?: boolean;
  contentId?: string | null;
};

export type ModerateUgcResponse = ModerationResult & {
  error?: string;
  retryable?: boolean;
};

async function callModerateUgc(input: ModerateUgcInput): Promise<ModerateUgcResponse> {
  if (!isModerationContentType(input.contentType)) {
    return {
      status: "block",
      outcome: "BLOCK",
      categories: [],
      spans: [],
      reasonCode: "GUIDELINES",
      userMessage: "Unsupported content type.",
      moderationVersion: "",
      error: "Unsupported content type.",
      retryable: false,
    };
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return {
      status: "block",
      outcome: "BLOCK",
      categories: [],
      spans: [],
      reasonCode: "GUIDELINES",
      userMessage: "You must be signed in.",
      moderationVersion: "",
      error: "You must be signed in.",
      retryable: false,
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return parseModerationResponse({
      status: "block",
      outcome: "SERVICE_UNAVAILABLE",
      unavailable: true,
      reasonCode: "PROVIDER_UNAVAILABLE",
      userMessage: MODERATION_UNAVAILABLE_MESSAGE,
    });
  }

  try {
    const response = await fetchWithTimeout(
      `${supabaseUrl}/functions/v1/moderate-ugc`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: input.text,
          title: input.title ?? "",
          contentType: input.contentType,
          persistDecision: input.persistDecision !== false,
          contentId: input.contentId ?? null,
        }),
      },
      MODERATION_CLIENT_TIMEOUT_MS
    );

    const body = await response.json().catch(() => null);
    if (!body) {
      return parseModerationResponse({
        status: "block",
        outcome: "SERVICE_UNAVAILABLE",
        unavailable: true,
        reasonCode: "PROVIDER_UNAVAILABLE",
        userMessage: MODERATION_UNAVAILABLE_MESSAGE,
      });
    }
    // 503/5xx from the edge function still carries ALLOW/WARN/BLOCK/SERVICE_UNAVAILABLE/ERROR.
    return parseModerationResponse(body);
  } catch {
    return parseModerationResponse({
      status: "block",
      outcome: "SERVICE_UNAVAILABLE",
      unavailable: true,
      reasonCode: "PROVIDER_UNAVAILABLE",
      userMessage: MODERATION_UNAVAILABLE_MESSAGE,
    });
  }
}

/** Preview or publish gate. Dedupes identical in-flight calls. */
export function moderateUgc(input: ModerateUgcInput): Promise<ModerateUgcResponse> {
  const key = moderationRequestKey(input.contentType, input.text, input.title);
  return dedupeAsync(key, () => callModerateUgc(input));
}

export async function requireModeration(
  input: ModerateUgcInput & { clubCreate?: boolean; feedShare?: boolean }
): Promise<{
  error?: string;
  retryable?: boolean;
  outcome?: ModerationOutcome;
  result?: ModerationResult;
}> {
  const trimmed = input.text.trim();
  if (!trimmed && !input.title?.trim()) return {};

  const run = async () => {
    const result = await moderateUgc({ ...input, persistDecision: true });
    return gateFromModeration(result, {
      clubCreate: input.clubCreate,
      feedShare: input.feedShare,
    });
  };

  // Bounded retry on provider outage only — never silently bypass moderation.
  if (input.feedShare || input.clubCreate) {
    return withModerationRetries(run);
  }
  return run();
}
