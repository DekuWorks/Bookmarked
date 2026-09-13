import {
  errorResult,
  isModerationBlock,
  isModerationContentType,
  isServiceUnavailable,
  MODERATION_BLOCK_MESSAGE,
  MODERATION_CLUB_UNAVAILABLE_MESSAGE,
  MODERATION_CLIENT_RETRY_ATTEMPTS,
  MODERATION_CLIENT_TIMEOUT_MS,
  MODERATION_SHARE_UNAVAILABLE_MESSAGE,
  MODERATION_UNAVAILABLE_MESSAGE,
  moderationOutcome,
  unavailableResult,
  type ModerationContentType,
  type ModerationOutcome,
  type ModerationResult,
} from "./contentModeration";

const inflight = new Map<string, Promise<unknown>>();

export function moderationRequestKey(
  contentType: ModerationContentType,
  text: string,
  title?: string | null
): string {
  return `${contentType}:${title ?? ""}:${text}`;
}

export function dedupeAsync<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const pending = run().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, pending);
  return pending;
}

export type ModerateUgcParsed = ModerationResult & {
  error?: string;
  retryable?: boolean;
};

export function parseModerationResponse(body: unknown): ModerateUgcParsed {
  if (!body || typeof body !== "object") {
    return {
      ...errorResult(),
      error: MODERATION_UNAVAILABLE_MESSAGE,
      retryable: true,
    };
  }

  const row = body as Partial<ModerationResult> & { error?: string };
  const result: ModerationResult = {
    status: row.status === "allow" || row.status === "warn" || row.status === "block" ? row.status : "block",
    outcome: row.outcome,
    categories: Array.isArray(row.categories) ? row.categories : [],
    spans: Array.isArray(row.spans) ? row.spans : [],
    reasonCode: row.reasonCode ?? "PROVIDER_UNAVAILABLE",
    userMessage: typeof row.userMessage === "string" ? row.userMessage : null,
    moderationVersion: typeof row.moderationVersion === "string" ? row.moderationVersion : "",
    unavailable: Boolean(row.unavailable),
    unavailableReason:
      typeof row.unavailableReason === "string" ? row.unavailableReason : undefined,
  };

  if (!row.status && (row.error || row.userMessage)) {
    const message = row.error ?? row.userMessage ?? MODERATION_UNAVAILABLE_MESSAGE;
    const unavailable =
      /temporarily unavailable|try again|service unavailable|timeout/i.test(message);
    return {
      ...(unavailable ? unavailableResult(message) : errorResult(message)),
      error: message,
      retryable: unavailable,
    };
  }

  const outcome = moderationOutcome(result);
  if (outcome === "SERVICE_UNAVAILABLE" || outcome === "ERROR") {
    return {
      ...result,
      outcome,
      unavailable: true,
      error: result.userMessage ?? MODERATION_UNAVAILABLE_MESSAGE,
      retryable: true,
    };
  }
  if (isModerationBlock(result)) {
    return {
      ...result,
      outcome: "BLOCK",
      error: result.userMessage ?? MODERATION_BLOCK_MESSAGE,
      retryable: false,
    };
  }
  return { ...result, outcome, retryable: false };
}

export function gateFromModeration(
  parsed: ModerateUgcParsed,
  options?: { clubCreate?: boolean; feedShare?: boolean }
): { error?: string; retryable?: boolean; outcome?: ModerationOutcome; result?: ModerationResult } {
  if (isServiceUnavailable(parsed) || parsed.outcome === "ERROR" || parsed.retryable) {
    const technical = options?.clubCreate
      ? MODERATION_CLUB_UNAVAILABLE_MESSAGE
      : options?.feedShare
        ? MODERATION_SHARE_UNAVAILABLE_MESSAGE
        : parsed.error ?? parsed.userMessage ?? MODERATION_UNAVAILABLE_MESSAGE;
    return {
      error: technical,
      retryable: true,
      outcome: parsed.outcome === "ERROR" ? "ERROR" : "SERVICE_UNAVAILABLE",
    };
  }
  if (parsed.error || isModerationBlock(parsed)) {
    return {
      error: parsed.error ?? parsed.userMessage ?? MODERATION_BLOCK_MESSAGE,
      retryable: false,
      outcome: "BLOCK",
    };
  }
  return { result: parsed, outcome: moderationOutcome(parsed) };
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number = MODERATION_CLIENT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("moderation_timeout");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** Bounded retries for transient outages only — never bypass moderation. */
export async function withModerationRetries<T extends { retryable?: boolean; error?: string }>(
  run: () => Promise<T>,
  attempts: number = MODERATION_CLIENT_RETRY_ATTEMPTS
): Promise<T> {
  let last = await run();
  for (let i = 1; i < attempts; i += 1) {
    if (!last.retryable || !last.error) return last;
    await new Promise((resolve) => setTimeout(resolve, 400 * i));
    last = await run();
  }
  return last;
}

export function clubCreateUnavailableMessage(): string {
  return MODERATION_CLUB_UNAVAILABLE_MESSAGE;
}

export function feedShareUnavailableMessage(): string {
  return MODERATION_SHARE_UNAVAILABLE_MESSAGE;
}

export function isModerationContentTypeSafe(value: unknown): value is ModerationContentType {
  return isModerationContentType(value);
}
