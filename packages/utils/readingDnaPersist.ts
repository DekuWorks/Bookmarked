import type { ReadingDna, ReadingDnaTrait } from "./readingDna";
import { yearPeriodKey } from "./usageCounters";

export type ReadingDnaTraitPayload = {
  category: ReadingDnaTrait["category"];
  label: string;
  score: number;
  percent: number;
  emoji: string;
  persona?: string;
  is_top_trait: boolean;
};

/** Stable fingerprint so clients can skip redundant upserts. */
export function readingDnaFingerprint(dna: ReadingDna): string {
  const traits = dna.traits
    .map(
      (trait) =>
        `${trait.category}:${trait.label}:${trait.percent}:${trait.score}:${trait.confidence}`
    )
    .sort();
  return [
    dna.confidence,
    dna.confidenceScore,
    dna.sampleSize,
    dna.summary,
    dna.insight,
    ...traits,
  ].join("|");
}

export function readingDnaTraitsPayload(dna: ReadingDna): ReadingDnaTraitPayload[] {
  const topKeys = new Set(
    dna.topTraits.map((trait) => `${trait.category}:${trait.label.toLocaleLowerCase()}`)
  );

  return dna.traits.map((trait) => ({
    category: trait.category,
    label: trait.label.toLocaleLowerCase(),
    score: trait.score,
    percent: trait.percent,
    emoji: trait.emoji,
    persona: trait.persona,
    is_top_trait: topKeys.has(`${trait.category}:${trait.label.toLocaleLowerCase()}`),
  }));
}

export function readingDnaSnapshotPayload(dna: ReadingDna): Record<string, unknown> {
  return {
    summary: dna.summary,
    insight: dna.insight,
    confidence: dna.confidence,
    confidenceScore: dna.confidenceScore,
    sampleSize: dna.sampleSize,
    topTraits: dna.topTraits,
    personaTraits: dna.personaTraits,
    categories: dna.categories,
    habits: dna.habits,
  };
}

export function readingDnaPeriodKey(date: Date = new Date()): string {
  return yearPeriodKey(date);
}

/** Debounce window for client-side DNA persistence (ms). */
export const READING_DNA_PERSIST_DEBOUNCE_MS = 8_000;
