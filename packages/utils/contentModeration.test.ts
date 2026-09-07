import { describe, expect, it } from "vitest";
import {
  classifyLocalContent,
  combineModerationResults,
  isServiceUnavailable,
  moderateContent,
  moderationOutcome,
  MODERATION_BLOCK_MESSAGE,
  MODERATION_UNAVAILABLE_MESSAGE,
  resolveWarnSpans,
  splitTextBySpans,
  withBoundedBackoff,
  type ModerationProvider,
  type ModerationSpan,
} from "./contentModeration";

const warnSpan = (start: number, end: number): ModerationSpan => ({
  start,
  end,
  category: "mild_profanity",
  severity: "warn",
  treatment: "blur_until_reveal",
});

describe("classifyLocalContent", () => {
  it("allows clean text", () => {
    const result = classifyLocalContent("Just finished a brilliant novel.", "FEED_POST");
    expect(result.status).toBe("allow");
    expect(result.reasonCode).toBe("ALLOW");
    expect(result.spans).toEqual([]);
  });

  it("warns on mild profanity and keeps original spans", () => {
    const text = "This book was damn good.";
    const result = classifyLocalContent(text, "FEED_POST");
    expect(result.status).toBe("warn");
    expect(result.reasonCode).toBe("MILD_PROFANITY");
    expect(result.spans.length).toBeGreaterThan(0);
    const [span] = result.spans;
    expect(text.slice(span.start, span.end).toLowerCase()).toContain("damn");
  });

  it("blocks hate slurs even with leetspeak / separators", () => {
    const result = classifyLocalContent("what a f@g g0t", "COMMENT");
    expect(result.status).toBe("block");
    expect(result.reasonCode).toBe("HATE");
    expect(result.userMessage).toBe(MODERATION_BLOCK_MESSAGE);
  });

  it("blocks threats", () => {
    const result = classifyLocalContent("I will kill you tomorrow", "COMMENT");
    expect(result.status).toBe("block");
    expect(result.reasonCode).toBe("THREATS");
  });

  it("blocks sexual exploitation language", () => {
    const result = classifyLocalContent("looking for child porn links", "FEED_POST");
    expect(result.status).toBe("block");
    expect(result.reasonCode).toBe("SEXUAL_EXPLOITATION");
  });

  it("blocks harassment phrases", () => {
    const result = classifyLocalContent("just kys already", "PROFILE_BIO");
    expect(result.status).toBe("block");
    expect(result.reasonCode).toBe("HARASSMENT");
  });

  it("treats club names strictly — warn becomes block", () => {
    const result = classifyLocalContent("The Fuck Club", "BOOK_CLUB_NAME");
    expect(result.status).toBe("block");
    expect(result.reasonCode).toBe("GUIDELINES");
  });

  it("warns on mild profanity in club descriptions instead of blocking", () => {
    const result = classifyLocalContent("A damn good mystery circle", "BOOK_CLUB_DESCRIPTION");
    expect(result.status).toBe("warn");
    expect(result.reasonCode).toBe("MILD_PROFANITY");
  });

  it("defeats zero-width and compatibility tricks", () => {
    const sneaky = "f\u200buck";
    const result = classifyLocalContent(sneaky, "FEED_POST");
    expect(result.status).toBe("warn");
  });
});

describe("moderateContent + provider", () => {
  it("blocks when the provider flags hate", async () => {
    const provider: ModerationProvider = {
      async moderate() {
        return { flagged: true, categories: ["hate"] };
      },
    };
    const result = await moderateContent({
      text: "hello friends",
      contentType: "FEED_POST",
      provider,
    });
    expect(result.status).toBe("block");
    expect(result.reasonCode).toBe("HATE");
  });

  it("fails closed when the provider throws", async () => {
    const provider: ModerationProvider = {
      async moderate() {
        throw new Error("timeout");
      },
    };
    const result = await moderateContent({
      text: "hello friends",
      contentType: "FEED_POST",
      provider,
      retry: { attempts: 2, delaysMs: [0], timeoutMs: 50 },
    });
    expect(result.status).toBe("block");
    expect(result.outcome).toBe("SERVICE_UNAVAILABLE");
    expect(result.unavailable).toBe(true);
    expect(isServiceUnavailable(result)).toBe(true);
    expect(result.userMessage).toBe(MODERATION_UNAVAILABLE_MESSAGE);
  });

  it("returns BLOCK, not SERVICE_UNAVAILABLE, when local rules already reject", async () => {
    const provider: ModerationProvider = {
      async moderate() {
        throw new Error("provider_down");
      },
    };
    const result = await moderateContent({
      text: "I will kill you tomorrow",
      contentType: "BOOK_CLUB_NAME",
      provider,
    });
    expect(moderationOutcome(result)).toBe("BLOCK");
    expect(result.userMessage).toBe(MODERATION_BLOCK_MESSAGE);
  });

  it("retries transient provider failures then allows", async () => {
    let calls = 0;
    const provider: ModerationProvider = {
      async moderate() {
        calls += 1;
        if (calls < 3) throw new Error("moderation_provider_503");
        return { flagged: false, categories: [] };
      },
    };
    const result = await moderateContent({
      text: "Sunday mystery club",
      contentType: "BOOK_CLUB_NAME",
      provider,
      retry: { attempts: 3, delaysMs: [0, 0], timeoutMs: 50 },
    });
    expect(calls).toBe(3);
    expect(result.status).toBe("allow");
    expect(moderationOutcome(result)).toBe("ALLOW");
  });

  it("does not treat a timeout as a Community Guidelines block", async () => {
    const provider: ModerationProvider = {
      async moderate() {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return { flagged: false, categories: [] };
      },
    };
    const result = await moderateContent({
      text: "Cozy readers",
      contentType: "BOOK_CLUB_DESCRIPTION",
      provider,
      retry: { attempts: 1, delaysMs: [], timeoutMs: 5 },
    });
    expect(moderationOutcome(result)).toBe("SERVICE_UNAVAILABLE");
    expect(result.userMessage).not.toBe(MODERATION_BLOCK_MESSAGE);
  });

  it("keeps local warn when the provider allows", async () => {
    const provider: ModerationProvider = {
      async moderate() {
        return { flagged: false, categories: [] };
      },
    };
    const result = await moderateContent({
      text: "this is shit",
      contentType: "COMMENT",
      provider,
    });
    expect(result.status).toBe("warn");
  });
});

describe("span masking", () => {
  it("splits text so only flagged spans are isolated", () => {
    const text = "Hello damn world";
    const parts = splitTextBySpans(text, [warnSpan(6, 10)]);
    expect(parts).toEqual([
      { text: "Hello ", span: null },
      { text: "damn", span: expect.objectContaining({ start: 6, end: 10 }) },
      { text: " world", span: null },
    ]);
  });

  it("uses stored warn spans before local fallback", () => {
    const text = "clean text with hidden span";
    const spans = resolveWarnSpans(text, {
      status: "warn",
      categories: ["mild_profanity"],
      spans: [warnSpan(6, 10)],
      reasonCode: "MILD_PROFANITY",
      moderationVersion: "test",
    });
    expect(spans).toHaveLength(1);
    expect(spans[0].start).toBe(6);
  });
});

describe("combineModerationResults", () => {
  it("lets block win over warn", () => {
    const combined = combineModerationResults([
      classifyLocalContent("damn", "FEED_POST"),
      classifyLocalContent("I will kill you", "FEED_POST"),
    ]);
    expect(combined.status).toBe("block");
    expect(combined.reasonCode).toBe("THREATS");
  });
});

describe("withBoundedBackoff", () => {
  it("gives up after the bounded attempt count", async () => {
    let calls = 0;
    await expect(
      withBoundedBackoff(
        async () => {
          calls += 1;
          throw new Error("still_down");
        },
        { attempts: 3, delaysMs: [0, 0] }
      )
    ).rejects.toThrow("still_down");
    expect(calls).toBe(3);
  });
});
