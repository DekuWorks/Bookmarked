/**
 * Canonical gate for progress → reading_sessions inserts.
 * No-op and backward (correction) updates must not create positive sessions.
 */

export type ProgressSessionDecision =
  | { create: true; kind: "pages" | "listening"; delta: number }
  | { create: false; reason: "noop" | "correction" };

export function shouldCreateProgressReadingSession(input: {
  format: "book" | "audiobook";
  previousPosition: number;
  nextPosition: number;
}): ProgressSessionDecision {
  const previous = Number(input.previousPosition) || 0;
  const next = Number(input.nextPosition) || 0;

  if (next === previous) {
    return { create: false, reason: "noop" };
  }
  if (next < previous) {
    return { create: false, reason: "correction" };
  }

  return {
    create: true,
    kind: input.format === "audiobook" ? "listening" : "pages",
    delta: next - previous,
  };
}
