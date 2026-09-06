import { describe, expect, it } from "vitest";
import {
  canonicalizeTrope,
  classifyMoodTag,
  computeReadingDna,
  deriveReadingPersonality,
  largestRemainderPercents,
  normalizeDnaTag,
  type ReadingDnaBookSignal,
} from "./readingDna";
import { READING_DNA_FORMING_COPY, READING_DNA_MIN_DATA_POINTS } from "./readingDnaConfig";
import { cosineReadingDnaMatch, readingDnaMatchPercent, scoreReadingDnaCandidates } from "./readingDnaMatch";
import { canExposeReadingDna, canMatchReadingDna } from "./readingDnaMatch";
import { readingDnaPublicTopThreeAllowed, readingDnaReaderMapFilterAllowed } from "./readingDnaPrivacy";
import { compareReadingDnaSnapshots } from "./readingDnaCompare";
import { canAccessFeature, getReadingDnaAccess } from "./subscription";

const NOW = "2026-09-01T12:00:00.000Z";

function book(partial: ReadingDnaBookSignal): ReadingDnaBookSignal {
  return {
    shelfStatus: "read",
    finishedAt: "2026-06-01T12:00:00.000Z",
    ...partial,
  };
}

/** 10 books: 6 Fantasy, 2 Mystery, 2 Romance — plus ratings / favorites / DNF / reread. */
function tenBookFixture(): ReadingDnaBookSignal[] {
  return [
    book({ subjects: ["Fantasy"], rating: 5, isFavorite: true, vibeTags: ["cozy"], tropeTags: ["found family"] }),
    book({ subjects: ["Fantasy"], rating: 5, vibeTags: ["cozy"], tropeTags: ["found family"] }),
    book({ subjects: ["Fantasy"], rating: 4, vibeTags: ["magical"], tropeTags: ["slow burn"] }),
    book({ subjects: ["Fantasy"], rating: 4, isFavorite: true, vibeTags: ["cozy"] }),
    book({ subjects: ["Fantasy"], rating: 5, reread: true, readCount: 2, tropeTags: ["found family"] }),
    book({ subjects: ["Fantasy", "Romance"], rating: 4, vibeTags: ["romantic"], tropeTags: ["enemies to lovers"] }),
    book({ subjects: ["Mystery"], rating: 4, vibeTags: ["dark"], tropeTags: ["small town"] }),
    book({ subjects: ["Mystery"], rating: 3, vibeTags: ["suspenseful"] }),
    book({ subjects: ["Romance"], rating: 5, isFavorite: true, vibeTags: ["romantic"], tropeTags: ["slow burn"] }),
    book({ subjects: ["Romance"], rating: 1, dnf: true, shelfStatus: "dnf" }),
  ];
}

const TEN_BOOK_REVIEWS = [
  { feelings: ["Hopeful", "Inspired"], rating: 5 },
  { feelings: ["Comforted"], rating: 4 },
  { feelings: ["Hopeful"], rating: 5 },
  { feelings: ["Emotional"], rating: 4 },
];

describe("largestRemainderPercents", () => {
  it("always sums to 100 when there is positive mass", () => {
    expect(largestRemainderPercents([6, 2, 2]).reduce((sum, n) => sum + n, 0)).toBe(100);
    expect(largestRemainderPercents([1, 1, 1]).reduce((sum, n) => sum + n, 0)).toBe(100);
  });
});

describe("tag normalize", () => {
  it("case-normalises tropes and classifies existing mood tags", () => {
    expect(normalizeDnaTag("  Found Family ")).toBe("found family");
    expect(canonicalizeTrope("Enemies To Lovers")).toBe("enemies to lovers");
    expect(canonicalizeTrope("Finished")).toBeNull();
    expect(classifyMoodTag("Cozy")).toBe("vibe");
    expect(classifyMoodTag("Hopeful")).toBe("emotion");
  });
});

describe("computeReadingDna fixture", () => {
  it("is stable, sums each pie to 100%, and does not invent emotion %", () => {
    const a = computeReadingDna({
      books: tenBookFixture(),
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    const b = computeReadingDna({
      books: tenBookFixture(),
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });

    expect(a.forming).toBe(false);
    expect(a.dataPointsCount).toBeGreaterThanOrEqual(READING_DNA_MIN_DATA_POINTS);
    expect(a.topTraits).toHaveLength(3);
    expect(new Set(a.topTraits.map((trait) => trait.category)).size).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(a.matchVector)).toBe(JSON.stringify(b.matchVector));

    for (const category of a.categories) {
      if (!category.traits.length) continue;
      const total = category.traits.reduce((sum, trait) => sum + trait.percent, 0);
      expect(total).toBe(100);
    }

    const genres = a.categories.find((row) => row.category === "genre")!.traits;
    const fantasy = genres.find((trait) => trait.label === "fantasy");
    const mystery = genres.find((trait) => trait.label === "mystery");
    const romance = genres.find((trait) => trait.label === "romance");
    expect(fantasy?.percent ?? 0).toBeGreaterThan(mystery?.percent ?? 0);
    expect(fantasy?.percent ?? 0).toBeGreaterThan(romance?.percent ?? 0);

    expect(a.habits.every((habit) => habit.category === "habit")).toBe(true);
    expect(a.categories.every((category) => category.traits.every((trait) => trait.category !== "habit"))).toBe(
      true
    );
  });

  it("splits multi-genre books proportionally", () => {
    const dna = computeReadingDna({
      books: [
        book({ subjects: ["Fantasy", "Romance"], rating: 5 }),
        book({ subjects: ["Fantasy", "Romance"], rating: 5 }),
        book({ subjects: ["Fantasy", "Romance"], rating: 4 }),
        book({ subjects: ["Mystery"], rating: 4 }),
        book({ subjects: ["Mystery"], rating: 4 }),
        book({ subjects: ["Fantasy"], rating: 5 }),
        book({ subjects: ["Fantasy"], rating: 5 }),
        book({ subjects: ["Fantasy"], rating: 4 }),
      ],
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    const genres = dna.categories.find((row) => row.category === "genre")!.traits;
    expect(genres.find((trait) => trait.label === "fantasy")?.percent ?? 0).toBeGreaterThan(
      genres.find((trait) => trait.label === "romance")?.percent ?? 0
    );
  });

  it("treats DNF as a soft negative and does not let one 1-star erase a genre", () => {
    const base = computeReadingDna({
      books: [
        book({ subjects: ["Fantasy"], rating: 5 }),
        book({ subjects: ["Fantasy"], rating: 5 }),
        book({ subjects: ["Fantasy"], rating: 4 }),
        book({ subjects: ["Fantasy"], rating: 5 }),
        book({ subjects: ["Mystery"], rating: 4 }),
        book({ subjects: ["Mystery"], rating: 4 }),
        book({ subjects: ["Romance"], rating: 5 }),
        book({ subjects: ["Romance"], rating: 4 }),
      ],
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    const withHits = computeReadingDna({
      books: [
        book({ subjects: ["Fantasy"], rating: 5 }),
        book({ subjects: ["Fantasy"], rating: 5 }),
        book({ subjects: ["Fantasy"], rating: 4 }),
        book({ subjects: ["Fantasy"], rating: 5 }),
        book({ subjects: ["Mystery"], rating: 4 }),
        book({ subjects: ["Mystery"], rating: 4 }),
        book({ subjects: ["Romance"], rating: 5 }),
        book({ subjects: ["Romance"], rating: 4 }),
        book({ subjects: ["Fantasy"], rating: 1 }),
        book({ subjects: ["Fantasy"], rating: 3, dnf: true, shelfStatus: "dnf" }),
      ],
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    const baseFantasy = base.categories.find((row) => row.category === "genre")!.traits.find((t) => t.label === "fantasy");
    const hitFantasy = withHits.categories
      .find((row) => row.category === "genre")!
      .traits.find((t) => t.label === "fantasy");
    expect(hitFantasy?.percent ?? 0).toBeGreaterThan(20);
    expect(baseFantasy).toBeTruthy();
  });

  it("does not infer vibes from review blurbs", () => {
    const dna = computeReadingDna({
      books: tenBookFixture().map((row) => ({ ...row, vibeTags: [] })),
      reviews: [{ feelings: [], rating: 5, review_body: "A cozy found family slow burn at midnight." }],
      now: NOW,
    });
    const vibe = dna.categories.find((row) => row.category === "vibe")!;
    expect(vibe.traits).toHaveLength(0);
    expect(vibe.emptyCopy).toMatch(/tag the mood/i);
  });

  it("treats Christian Fiction as a normal catalog genre", () => {
    const dna = computeReadingDna({
      books: [
        book({ subjects: ["Christian Fiction"], rating: 5 }),
        book({ subjects: ["Christian Fiction"], rating: 4 }),
        book({ subjects: ["Christian Fiction"], rating: 5 }),
        book({ subjects: ["Fantasy"], rating: 4 }),
        book({ subjects: ["Fantasy"], rating: 5 }),
        book({ subjects: ["Mystery"], rating: 4 }),
        book({ subjects: ["Mystery"], rating: 3 }),
        book({ subjects: ["Romance"], rating: 4 }),
      ],
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    expect(
      dna.categories
        .find((row) => row.category === "genre")!
        .traits.some((trait) => trait.label === "christian fiction")
    ).toBe(true);
    expect(dna.summary).not.toMatch(/faith|religion|church/i);
  });

  it("shows forming copy below the min data-point threshold", () => {
    const dna = computeReadingDna({
      books: [{ subjects: ["Fantasy"], rating: 5, shelfStatus: "read" }],
      now: NOW,
    });
    expect(dna.forming).toBe(true);
    expect(dna.summary).toBe(READING_DNA_FORMING_COPY);
    expect(dna.topTraits).toHaveLength(0);
    expect(dna.categories.every((category) => category.traits.length === 0)).toBe(true);
  });
});

describe("habits", () => {
  it("does not label Audiobook Lover from one listen", () => {
    const dna = computeReadingDna({
      books: [
        ...tenBookFixture().map((row) => ({ ...row, format: "book" as const })),
        book({ subjects: ["Fantasy"], rating: 4, format: "audiobook" }),
      ],
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    expect(dna.habits.some((habit) => habit.habitId === "audiobook_lover")).toBe(false);
  });

  it("labels Audiobook Lover only with enough evidence", () => {
    const books = [
      ...Array.from({ length: 5 }, () => book({ subjects: ["Fantasy"], rating: 5, format: "audiobook" })),
      book({ subjects: ["Mystery"], rating: 4, format: "book" }),
      book({ subjects: ["Romance"], rating: 4, format: "book" }),
      book({ subjects: ["Fantasy"], rating: 4, format: "audiobook" }),
    ];
    const dna = computeReadingDna({
      books,
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    expect(dna.habits.some((habit) => habit.habitId === "audiobook_lover")).toBe(true);
  });

  it("does not emit both morning and night unless both truly clear", () => {
    const sessions = [
      ...Array.from({ length: 8 }, (_, i) => ({
        createdAt: `2026-08-0${(i % 8) + 1}T08:00:00.000Z`,
        sessionDate: `2026-08-0${(i % 8) + 1}`,
        pagesRead: 20,
      })),
      { createdAt: "2026-08-09T22:00:00.000Z", sessionDate: "2026-08-09", pagesRead: 12 },
    ];
    const dna = computeReadingDna({
      books: tenBookFixture(),
      reviews: TEN_BOOK_REVIEWS,
      sessions,
      now: NOW,
    });
    const ids = dna.habits.map((habit) => habit.habitId);
    expect(ids.includes("morning_reader")).toBe(true);
    expect(ids.includes("night_owl")).toBe(false);
  });
});

describe("match", () => {
  it("scores A/B high, A/C low, with no randomness", () => {
    const a = computeReadingDna({
      books: tenBookFixture(),
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    const b = computeReadingDna({
      books: tenBookFixture().map((row, index) =>
        index < 8 ? row : book({ subjects: ["Fantasy"], rating: 4, vibeTags: ["cozy"] })
      ),
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    const c = computeReadingDna({
      books: [
        book({ subjects: ["Thriller"], rating: 5, vibeTags: ["dark"], tropeTags: ["chosen one"] }),
        book({ subjects: ["Thriller"], rating: 5, vibeTags: ["dark"] }),
        book({ subjects: ["Horror"], rating: 4, vibeTags: ["dark"] }),
        book({ subjects: ["Horror"], rating: 4 }),
        book({ subjects: ["Thriller"], rating: 3 }),
        book({ subjects: ["Horror"], rating: 5, tropeTags: ["chosen one"] }),
        book({ subjects: ["Science Fiction"], rating: 4 }),
        book({ subjects: ["Science Fiction"], rating: 5 }),
      ],
      reviews: [
        { feelings: ["Scared"], rating: 5 },
        { feelings: ["Scared"], rating: 4 },
        { feelings: ["Excited"], rating: 4 },
      ],
      now: NOW,
    });

    const ab1 = readingDnaMatchPercent(a, b);
    const ab2 = readingDnaMatchPercent(a, b);
    const ba = readingDnaMatchPercent(b, a);
    const ac = readingDnaMatchPercent(a, c);
    expect(ab1).toBe(ab2);
    expect(ab1).toBe(ba);
    expect(ab1).toBeGreaterThan(ac);
    expect(ab1).toBeGreaterThan(60);
    expect(ac).toBeLessThan(45);
    expect(cosineReadingDnaMatch(a.matchVector, b.matchVector)).toBe(ab1);
  });

  it("drops private candidates and does not leak traits", () => {
    const self = computeReadingDna({
      books: tenBookFixture(),
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    const other = computeReadingDna({
      books: tenBookFixture(),
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    const scored = scoreReadingDnaCandidates(self, [
      {
        userId: "private-user",
        vector: other.matchVector,
        privacy: { visibility: "private" },
        visibleTraits: other.topTraits,
      },
    ]);
    expect(scored).toHaveLength(0);
    expect(canExposeReadingDna({ visibility: "private" })).toBe(false);
    expect(canMatchReadingDna({ visibility: "private" })).toBe(false);
    expect(
      readingDnaReaderMapFilterAllowed({
        visibility: "private",
        matchEnabled: null,
        publicTopTraitsApproved: true,
        sharePersonalityOnReaderMap: true,
      })
    ).toBe(false);
    expect(
      readingDnaPublicTopThreeAllowed({
        visibility: "private",
        matchEnabled: null,
        publicTopTraitsApproved: true,
        sharePersonalityOnReaderMap: false,
      })
    ).toBe(false);
  });
});

describe("snapshots", () => {
  it("does not treat algorithm history as rewritten — compares two frozen payloads", () => {
    const previous = computeReadingDna({
      books: tenBookFixture(),
      reviews: TEN_BOOK_REVIEWS,
      now: "2025-09-01T12:00:00.000Z",
    });
    const current = computeReadingDna({
      books: [
        ...tenBookFixture(),
        book({ subjects: ["Mystery"], rating: 5, vibeTags: ["dark"], finishedAt: "2026-08-01T12:00:00.000Z" }),
        book({ subjects: ["Mystery"], rating: 5, finishedAt: "2026-08-10T12:00:00.000Z" }),
      ],
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    const frozenPrevious = structuredClone(previous);
    const changes = compareReadingDnaSnapshots(previous, current, 1);
    expect(JSON.stringify(previous)).toBe(JSON.stringify(frozenPrevious));
    expect(Array.isArray(changes)).toBe(true);
  });
});

describe("tier gates", () => {
  const plus = {
    subscription_tier: "plus" as const,
    subscription_status: "active" as const,
    subscription_expires_at: null,
  };
  const home = { ...plus, subscription_tier: "home" as const };

  it("keeps Free at top_three, Plus full, Home advanced", () => {
    expect(getReadingDnaAccess(null)).toBe("top_three");
    expect(canAccessFeature("full_reading_dna", null)).toBe(false);
    expect(canAccessFeature("reading_dna_book_matches", plus)).toBe(true);
    expect(canAccessFeature("reading_dna_year_comparison", plus)).toBe(true);
    expect(canAccessFeature("reading_dna_match", plus)).toBe(false);
    expect(canAccessFeature("reading_dna_match", home)).toBe(true);
    expect(getReadingDnaAccess(home)).toBe("advanced");
  });
});

describe("personality", () => {
  it("reuses existing persona labels and stays explainable", () => {
    const dna = computeReadingDna({
      books: tenBookFixture(),
      reviews: TEN_BOOK_REVIEWS,
      now: NOW,
    });
    const personality = deriveReadingPersonality(dna);
    expect(personality).not.toBeNull();
    expect(personality?.explanation).toMatch(/scored from/i);
  });
});
