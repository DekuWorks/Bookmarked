import { describe, expect, it } from "vitest";
import {
  SPOILER_AUTO_HIDE_MS,
  initialSpoilerRevealState,
  remainingSpoilerHideMs,
  spoilerShouldAutoHide,
  toggleSpoilerReveal,
} from "./spoilerReveal";

describe("spoilerReveal", () => {
  it("starts hidden", () => {
    expect(initialSpoilerRevealState()).toEqual({ revealed: false, hideAt: null });
  });

  it("reveals and schedules auto-hide", () => {
    const next = toggleSpoilerReveal(initialSpoilerRevealState(), 1_000);
    expect(next.revealed).toBe(true);
    expect(next.hideAt).toBe(1_000 + SPOILER_AUTO_HIDE_MS);
  });

  it("manual hide clears the timer", () => {
    const revealed = toggleSpoilerReveal(initialSpoilerRevealState(), 1_000);
    const hidden = toggleSpoilerReveal(revealed, 2_000);
    expect(hidden).toEqual({ revealed: false, hideAt: null });
  });

  it("resets the timer on a later reveal", () => {
    const first = toggleSpoilerReveal(initialSpoilerRevealState(), 1_000);
    const hidden = toggleSpoilerReveal(first, 2_000);
    const second = toggleSpoilerReveal(hidden, 5_000);
    expect(second.hideAt).toBe(5_000 + SPOILER_AUTO_HIDE_MS);
  });

  it("auto-hides only after the deadline", () => {
    const revealed = toggleSpoilerReveal(initialSpoilerRevealState(), 1_000);
    expect(spoilerShouldAutoHide(revealed, 1_000 + SPOILER_AUTO_HIDE_MS - 1)).toBe(false);
    expect(spoilerShouldAutoHide(revealed, 1_000 + SPOILER_AUTO_HIDE_MS)).toBe(true);
    expect(remainingSpoilerHideMs(revealed, 1_000 + 1_000)).toBe(SPOILER_AUTO_HIDE_MS - 1_000);
  });
});
