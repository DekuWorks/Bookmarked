import { describe, expect, it } from "vitest";
import { computeReadingDna, deriveReadingPersonality, readingDnaMatchPercent } from "./readingDna";

describe("computeReadingDna", () => {
  it("normalizes each DNA category to 100% and keeps habits separate", () => {
    const dna = computeReadingDna({
      books: [
        {
          subjects: ["Fantasy", "Mystery"],
          rating: 5,
          completion_tags: ["found family", "slow burn"],
          shelf_status: "read",
          format: "audiobook",
        },
        {
          subjects: ["Fantasy", "Romance"],
          rating: 4,
          completion_tags: ["found family"],
          shelf_status: "read",
        },
        {
          subjects: ["Thriller"],
          rating: 3,
          completion_tags: ["chosen one", "chosen one"],
          shelf_status: "currently_reading",
        },
        { subjects: ["Fantasy"], rating: 5, completion_tags: ["slow burn"], shelf_status: "read" },
        { subjects: ["Mystery"], rating: 4, completion_tags: ["small town"], shelf_status: "read" },
      ],
      reviews: [
        { feelings: ["Hopeful", "Inspired"], rating: 5, review_body: "A cozy found family story." },
        { feelings: ["Comforted"], rating: 4, review_body: "Magical and heartwarming night read." },
        { feelings: ["Hopeful"], rating: 5, review_body: "Cozy slow burn with morning coffee." },
        { feelings: ["Excited"], rating: 4, review_body: "Dark and adventurous thriller energy." },
      ],
      shelves: [
        { genre: "Fantasy", name: "Cozy favorites" },
        { genre: "Mystery", name: "Dark shelves" },
      ],
      tags: ["found family", "slow burn", "found family"],
    });

    expect(["medium", "high"]).toContain(dna.confidence);
    expect(dna.topTraits.length).toBeGreaterThan(0);
    expect(dna.topTraits.length).toBeLessThanOrEqual(3);
    expect(dna.categories).toHaveLength(4);

    for (const category of dna.categories) {
      if (!category.traits.length) continue;
      const total = category.traits.reduce((sum, trait) => sum + trait.percent, 0);
      expect(total).toBe(100);
    }

    expect(dna.habits.some((habit) => habit.label.includes("audiobook") || habit.persona?.includes("Audiobook"))).toBe(
      true
    );
    // Habits must not be mixed into the four 100% category pies.
    expect(dna.categories.every((category) => category.traits.every((t) => t.category !== "habit"))).toBe(
      true
    );
  });

  it("does not invent traits from tiny data", () => {
    const dna = computeReadingDna({
      books: [{ subjects: ["Fantasy"], rating: 5, shelf_status: "read" }],
    });
    expect(dna.confidence === "none" || dna.confidence === "low").toBe(true);
    // Single subject hit with weight 2 can surface fantasy, but overall confidence stays low.
    expect(dna.sampleSize).toBeLessThan(8);
  });

  it("calculates the shared trait percentage", () => {
    const a = computeReadingDna({
      books: [
        { subjects: ["Fantasy"], rating: 5 },
        { subjects: ["Fantasy"], rating: 4 },
      ],
      tags: ["found family", "found family"],
    });
    const b = computeReadingDna({
      books: [
        { subjects: ["Mystery"], rating: 5 },
        { subjects: ["Mystery"], rating: 4 },
      ],
      tags: ["found family", "found family"],
    });
    expect(readingDnaMatchPercent(a, b)).toBeGreaterThanOrEqual(0);
    expect(readingDnaMatchPercent(a, b)).toBeLessThanOrEqual(100);
  });

  it("derives an explainable personality from existing persona labels", () => {
    const dna = computeReadingDna({
      books: [
        { subjects: ["Fantasy"], rating: 5, completion_tags: ["found family"], shelf_status: "read" },
        { subjects: ["Fantasy"], rating: 5, completion_tags: ["found family"], shelf_status: "read" },
        { subjects: ["Fantasy"], rating: 4, completion_tags: ["slow burn"], shelf_status: "read" },
        { subjects: ["Fantasy"], rating: 5, shelf_status: "read" },
      ],
      reviews: [
        { feelings: ["Hopeful"], rating: 5, review_body: "A cozy found family story." },
        { feelings: ["Hopeful"], rating: 5, review_body: "Cozy magical night read." },
      ],
      shelves: [{ genre: "Fantasy", name: "Cozy favorites" }],
    });
    const personality = deriveReadingPersonality(dna);
    expect(personality).not.toBeNull();
    expect(personality?.label.length).toBeGreaterThan(0);
    expect(personality?.explanation).toMatch(/scored from/i);
    expect(personality?.sourceTraits.length).toBeGreaterThan(0);
  });
});
