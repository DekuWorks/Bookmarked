import { describe, expect, it } from "vitest";
import {
  MODERATION_BLOCK_MESSAGE,
  MODERATION_CLUB_UNAVAILABLE_MESSAGE,
  MODERATION_SHARE_UNAVAILABLE_MESSAGE,
  MODERATION_UNAVAILABLE_MESSAGE,
} from "./contentModeration";
import { gateFromModeration, parseModerationResponse } from "./moderateUgcClient";

describe("parseModerationResponse", () => {
  it("maps provider outage to SERVICE_UNAVAILABLE, not BLOCK", () => {
    const parsed = parseModerationResponse({
      status: "block",
      outcome: "SERVICE_UNAVAILABLE",
      categories: [],
      spans: [],
      reasonCode: "PROVIDER_UNAVAILABLE",
      userMessage: MODERATION_UNAVAILABLE_MESSAGE,
      moderationVersion: "2026.09.1",
      unavailable: true,
    });
    expect(parsed.outcome).toBe("SERVICE_UNAVAILABLE");
    expect(parsed.retryable).toBe(true);
    expect(parsed.error).toBe(MODERATION_UNAVAILABLE_MESSAGE);
  });

  it("keeps Community Guidelines copy only for BLOCK", () => {
    const parsed = parseModerationResponse({
      status: "block",
      outcome: "BLOCK",
      categories: ["hate"],
      spans: [],
      reasonCode: "HATE",
      userMessage: MODERATION_BLOCK_MESSAGE,
      moderationVersion: "2026.09.1",
    });
    expect(parsed.outcome).toBe("BLOCK");
    expect(parsed.retryable).toBe(false);
    expect(parsed.error).toBe(MODERATION_BLOCK_MESSAGE);
  });

  it("treats unreadable payloads as retryable ERROR", () => {
    const parsed = parseModerationResponse(null);
    expect(parsed.outcome).toBe("ERROR");
    expect(parsed.retryable).toBe(true);
  });
});

describe("gateFromModeration", () => {
  it("uses club-create outage copy and does not blame the reader", () => {
    const gate = gateFromModeration(
      {
        status: "block",
        outcome: "SERVICE_UNAVAILABLE",
        categories: [],
        spans: [],
        reasonCode: "PROVIDER_UNAVAILABLE",
        userMessage: MODERATION_UNAVAILABLE_MESSAGE,
        moderationVersion: "2026.09.1",
        unavailable: true,
        retryable: true,
      },
      { clubCreate: true }
    );
    expect(gate.retryable).toBe(true);
    expect(gate.outcome).toBe("SERVICE_UNAVAILABLE");
    expect(gate.error).toBe(MODERATION_CLUB_UNAVAILABLE_MESSAGE);
    expect(gate.error).not.toContain("Community Guidelines");
  });

  it("uses feed-share outage copy and keeps guidelines separate", () => {
    const gate = gateFromModeration(
      {
        status: "block",
        outcome: "SERVICE_UNAVAILABLE",
        categories: [],
        spans: [],
        reasonCode: "PROVIDER_UNAVAILABLE",
        userMessage: MODERATION_UNAVAILABLE_MESSAGE,
        moderationVersion: "2026.09.1",
        unavailable: true,
        retryable: true,
      },
      { feedShare: true }
    );
    expect(gate.retryable).toBe(true);
    expect(gate.outcome).toBe("SERVICE_UNAVAILABLE");
    expect(gate.error).toBe(MODERATION_SHARE_UNAVAILABLE_MESSAGE);
    expect(gate.error).not.toContain("Community Guidelines");
  });

  it("returns BLOCK for guideline violations", () => {
    const gate = gateFromModeration(
      {
        status: "block",
        outcome: "BLOCK",
        categories: ["guidelines"],
        spans: [],
        reasonCode: "GUIDELINES",
        userMessage: MODERATION_BLOCK_MESSAGE,
        moderationVersion: "2026.09.1",
        error: MODERATION_BLOCK_MESSAGE,
        retryable: false,
      },
      { clubCreate: true }
    );
    expect(gate.retryable).toBe(false);
    expect(gate.outcome).toBe("BLOCK");
    expect(gate.error).toBe(MODERATION_BLOCK_MESSAGE);
  });
});
