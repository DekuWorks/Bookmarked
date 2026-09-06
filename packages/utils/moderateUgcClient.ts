import type { ModerationContentType } from "./contentModeration";

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
