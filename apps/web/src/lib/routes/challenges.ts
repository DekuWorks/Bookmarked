import { withOriginQuery } from "@bookmarked/utils/navigationOrigin";

export function challengesPath(origin?: string | null): string {
  return withOriginQuery("/challenges/", { origin });
}

export function challengeDetailPath(
  challengeId: string,
  options?: { origin?: string | null }
): string {
  return withOriginQuery(`/challenges/challenge/?id=${encodeURIComponent(challengeId)}`, {
    origin: options?.origin ?? "challenges",
  });
}

export function challengeCreatePath(origin?: string | null): string {
  return withOriginQuery("/challenges/create/", { origin: origin ?? "challenges" });
}
