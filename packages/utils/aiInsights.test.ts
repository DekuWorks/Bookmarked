import { describe, expect, it } from "vitest";
import {
  buildAiInsightsContext,
  generateAiInsights,
  mergeLlmSummary,
  parseOpenAiInsightsResponse,
  type AiInsightsSessionInput,
  type AiInsightsBookInput,
  type GenerateAiInsightsInput,
} from "./aiInsights";

const NOW = new Date("2026-07-23T18:00:00.000Z");

function session(
  overrides: Partial<AiInsightsSessionInput> & Pick<AiInsightsSessionInput, "id" | "created_at">
): AiInsightsSessionInput {
  return {
    user_book_id: "ub-1",
    pages_read: 20,
    note: null,
    mood: null,
    read_number: 1,
    bookTitle: "Test Book",
    bookId: "book-1",
    ...overrides,
  };
}

function book(overrides: Partial<AiInsightsBookInput> & Pick<AiInsightsBookInput, "id">): AiInsightsBookInput {
  return {
    shelf_status: "read",
    progress_pages: 100,
    progress_percent: 100,
    is_favorite: false,
    dnf: false,
    finished_at: "2026-07-20T12:00:00.000Z",
    rating: 4,
    bookTitle: "Test Book",
    subjects: ["Fantasy"],
    ...overrides,
  };
}

function baseInput(overrides: Partial<GenerateAiInsightsInput> = {}): GenerateAiInsightsInput {
  return {
    sessions: [],
    books: [],
    reviews: [],
    favoriteGenres: null,
    streakTimestamps: [],
    now: NOW,
    ...overrides,
  };
}

describe("generateAiInsights", () => {
  it("returns empty state for new users", () => {
    const result = generateAiInsights(baseInput());
    expect(result.hasData).toBe(false);
    expect(result.highlights).toHaveLength(0);
    expect(result.patterns).toHaveLength(0);
    expect(result.prompts).toHaveLength(1);
    expect(result.prompts[0]?.id).toBe("prompt-start");
  });

  it("computes weekly pages and pace trend", () => {
    const result = generateAiInsights(
      baseInput({
        sessions: [
          session({ id: "s1", created_at: "2026-07-22T10:00:00.000Z", pages_read: 40 }),
          session({ id: "s2", created_at: "2026-07-21T10:00:00.000Z", pages_read: 30 }),
          session({ id: "s3", created_at: "2026-07-14T10:00:00.000Z", pages_read: 10 }),
        ],
      })
    );

    expect(result.hasData).toBe(true);
    expect(result.highlights.some((h) => h.id === "highlight-week-pages")).toBe(true);
    expect(result.patterns.some((p) => p.id === "pattern-pace")).toBe(true);
    const pace = result.patterns.find((p) => p.id === "pattern-pace");
    expect(pace?.body).toContain("up");
  });

  it("detects reading streak from timestamps", () => {
    const result = generateAiInsights(
      baseInput({
        streakTimestamps: [
          "2026-07-23T08:00:00.000Z",
          "2026-07-22T08:00:00.000Z",
          "2026-07-21T08:00:00.000Z",
        ],
        sessions: [session({ id: "s1", created_at: "2026-07-23T09:00:00.000Z" })],
      })
    );

    const streak = result.highlights.find((h) => h.id === "highlight-streak");
    expect(streak?.body).toContain("3-day streak");
  });

  it("surfaces top mood and genre patterns", () => {
    const result = generateAiInsights(
      baseInput({
        sessions: [
          session({ id: "s1", created_at: "2026-07-22T10:00:00.000Z", mood: "cozy" }),
          session({ id: "s2", created_at: "2026-07-21T10:00:00.000Z", mood: "cozy" }),
          session({ id: "s3", created_at: "2026-07-20T10:00:00.000Z", mood: "tense" }),
        ],
        books: [book({ id: "b1", subjects: ["Science Fiction", "Adventure"] })],
      })
    );

    expect(result.patterns.some((p) => p.id === "pattern-mood")).toBe(true);
    expect(result.patterns.find((p) => p.id === "pattern-mood")?.body).toContain("Cozy");
    expect(result.patterns.some((p) => p.id === "pattern-genre")).toBe(true);
  });

  it("builds reflection prompts from session notes", () => {
    const result = generateAiInsights(
      baseInput({
        sessions: [
          session({
            id: "s1",
            created_at: "2026-07-22T10:00:00.000Z",
            note: "The twist at chapter 12 completely surprised me",
            bookTitle: "Mystery Novel",
          }),
        ],
      })
    );

    expect(result.prompts[0]?.title).toContain("Mystery Novel");
    expect(result.prompts[0]?.body).toContain("twist");
  });

  it("counts rereads from read_number", () => {
    const result = generateAiInsights(
      baseInput({
        sessions: [
          session({ id: "s1", created_at: "2026-07-22T10:00:00.000Z", read_number: 2 }),
          session({ id: "s2", created_at: "2026-07-10T10:00:00.000Z", read_number: 1 }),
        ],
      })
    );

    expect(result.patterns.some((p) => p.id === "pattern-reread")).toBe(true);
  });
});

describe("mergeLlmSummary", () => {
  it("prepends LLM summary when provided", () => {
    const base = generateAiInsights(
      baseInput({
        sessions: [session({ id: "s1", created_at: "2026-07-22T10:00:00.000Z" })],
      })
    );
    const merged = mergeLlmSummary(base, "You are building a steady evening reading habit.");
    expect(merged.highlights[0]?.id).toBe("highlight-llm-summary");
    expect(merged.highlights[0]?.body).toContain("evening reading");
  });

  it("returns unchanged insights when summary is empty", () => {
    const base = generateAiInsights(baseInput());
    expect(mergeLlmSummary(base, "")).toEqual(base);
    expect(mergeLlmSummary(base, null)).toEqual(base);
  });
});

describe("buildAiInsightsContext", () => {
  it("builds compact stats without raw session ids", () => {
    const input = baseInput({
      sessions: [
        session({ id: "s1", created_at: "2026-07-22T10:00:00.000Z", pages_read: 25, mood: "cozy" }),
      ],
      books: [book({ id: "b1" })],
      favoriteGenres: ["Fantasy"],
    });
    const context = buildAiInsightsContext(input);
    expect(context.hasData).toBe(true);
    expect(context.stats.pagesThisWeek).toBe(25);
    expect(context.topMood).toBe("Cozy");
    expect(context.favoriteGenres).toEqual(["Fantasy"]);
    expect(JSON.stringify(context)).not.toContain("s1");
  });
});

describe("parseOpenAiInsightsResponse", () => {
  it("parses valid OpenAI JSON", () => {
    const parsed = parseOpenAiInsightsResponse(
      {
        highlights: [{ id: "h1", title: "Great week", body: "You read 50 pages.", emoji: "📄" }],
        patterns: [{ title: "Mood", body: "Cozy sessions dominate." }],
        prompts: [{ title: "Reflect", body: "What stayed with you?" }],
      },
      true
    );
    expect(parsed?.highlights).toHaveLength(1);
    expect(parsed?.patterns[0]?.id).toMatch(/^pattern-/);
    expect(parsed?.hasData).toBe(true);
  });

  it("returns null for empty or invalid payloads", () => {
    expect(parseOpenAiInsightsResponse({}, true)).toBeNull();
    expect(parseOpenAiInsightsResponse({ highlights: [] }, true)).toBeNull();
  });
});
