/** Feed spoiler reveal: tap to show, tap to hide, auto re-hide after a delay. */

export const SPOILER_AUTO_HIDE_MS = 30_000;

export type SpoilerRevealState = {
  revealed: boolean;
  hideAt: number | null;
};

export function initialSpoilerRevealState(): SpoilerRevealState {
  return { revealed: false, hideAt: null };
}

export function toggleSpoilerReveal(
  current: SpoilerRevealState,
  now = Date.now(),
  autoHideMs = SPOILER_AUTO_HIDE_MS
): SpoilerRevealState {
  if (current.revealed) {
    return { revealed: false, hideAt: null };
  }
  return { revealed: true, hideAt: now + autoHideMs };
}

export function spoilerShouldAutoHide(state: SpoilerRevealState, now = Date.now()): boolean {
  return state.revealed && state.hideAt != null && now >= state.hideAt;
}

export function remainingSpoilerHideMs(state: SpoilerRevealState, now = Date.now()): number {
  if (!state.revealed || state.hideAt == null) return 0;
  return Math.max(0, state.hideAt - now);
}

export const SPOILER_WARNING_COPY = {
  hidden: "Spoiler (tap to view)",
  hide: "Hide spoiler",
} as const;
