import {
  dedupeAsync,
  fetchWithTimeout,
  gateFromModeration,
  isModerationContentType,
  moderationRequestKey,
  parseModerationResponse,
  MODERATION_CLIENT_TIMEOUT_MS,
  MODERATION_UNAVAILABLE_MESSAGE,
  type ModerationContentType,
  type ModerationOutcome,
  type ModerationResult,
} from "../../../../packages/utils";
import { supabase } from "./supabase";

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

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
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
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
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

export function moderateUgc(input: ModerateUgcInput): Promise<ModerateUgcResponse> {
  const key = moderationRequestKey(input.contentType, input.text, input.title);
  return dedupeAsync(key, () => callModerateUgc(input));
}

export async function requireModeration(
  input: ModerateUgcInput & { clubCreate?: boolean }
): Promise<{
  error?: string;
  retryable?: boolean;
  outcome?: ModerationOutcome;
  result?: ModerationResult;
}> {
  const trimmed = input.text.trim();
  if (!trimmed && !input.title?.trim()) return {};
  const result = await moderateUgc({ ...input, persistDecision: true });
  return gateFromModeration(result, { clubCreate: input.clubCreate });
}
