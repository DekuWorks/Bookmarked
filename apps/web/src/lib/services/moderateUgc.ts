import {
  dedupeAsync,
  isModerationContentType,
  moderationRequestKey,
  MODERATION_UNAVAILABLE_MESSAGE,
  type ModerationContentType,
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

export type ModerateUgcResponse = ModerationResult & { error?: string };

async function callModerateUgc(input: ModerateUgcInput): Promise<ModerateUgcResponse> {
  if (!isModerationContentType(input.contentType)) {
    return {
      status: "block",
      categories: [],
      spans: [],
      reasonCode: "GUIDELINES",
      userMessage: "Unsupported content type.",
      moderationVersion: "",
      error: "Unsupported content type.",
    };
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return {
      status: "block",
      categories: [],
      spans: [],
      reasonCode: "GUIDELINES",
      userMessage: "You must be signed in.",
      moderationVersion: "",
      error: "You must be signed in.",
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return {
      status: "block",
      categories: [],
      spans: [],
      reasonCode: "PROVIDER_UNAVAILABLE",
      userMessage: MODERATION_UNAVAILABLE_MESSAGE,
      moderationVersion: "",
      unavailable: true,
      error: MODERATION_UNAVAILABLE_MESSAGE,
    };
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/moderate-ugc`, {
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
  });

  const body = (await response.json().catch(() => null)) as ModerateUgcResponse | null;
  if (!body) {
    return {
      status: "block",
      categories: [],
      spans: [],
      reasonCode: "PROVIDER_UNAVAILABLE",
      userMessage: MODERATION_UNAVAILABLE_MESSAGE,
      moderationVersion: "",
      unavailable: true,
      error: MODERATION_UNAVAILABLE_MESSAGE,
    };
  }

  if (body.status === "block") {
    return { ...body, error: body.userMessage ?? MODERATION_UNAVAILABLE_MESSAGE };
  }
  return body;
}

/** Preview or publish gate. Dedupes identical in-flight calls. */
export function moderateUgc(input: ModerateUgcInput): Promise<ModerateUgcResponse> {
  const key = moderationRequestKey(input.contentType, input.text, input.title);
  return dedupeAsync(key, () => callModerateUgc(input));
}

export async function requireModeration(
  input: ModerateUgcInput
): Promise<{ error?: string; result?: ModerationResult }> {
  const trimmed = input.text.trim();
  if (!trimmed && !input.title?.trim()) return {};
  const result = await moderateUgc({ ...input, persistDecision: true });
  if (result.error || result.status === "block") {
    return { error: result.error ?? result.userMessage ?? MODERATION_UNAVAILABLE_MESSAGE };
  }
  return { result };
}
