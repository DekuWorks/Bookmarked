import { monthPeriodKey, yearPeriodKey } from "./usageCounters";
import {
  READING_DNA_VERSION,
  type ReadingDnaPeriodType,
} from "./readingDnaConfig";
import type { ReadingDna, ReadingDnaTrait } from "./readingDna";

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
    dna.dnaVersion,
    dna.confidence,
    dna.confidenceScore,
    dna.sampleSize,
    dna.dataPointsCount,
    dna.forming,
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
    dnaVersion: dna.dnaVersion,
    summary: dna.summary,
    insight: dna.insight,
    confidence: dna.confidence,
    confidenceScore: dna.confidenceScore,
    sampleSize: dna.sampleSize,
    dataPointsCount: dna.dataPointsCount,
    forming: dna.forming,
    topTraits: dna.topTraits,
    personaTraits: dna.personaTraits,
    categories: dna.categories,
    habits: dna.habits,
    matchVector: dna.matchVector,
  };
}

/** @deprecated Prefer readingDnaPeriodKeys. Yearly key kept for older callers. */
export function readingDnaPeriodKey(date: Date = new Date()): string {
  return yearPeriodKey(date);
}

export function readingDnaPeriodKeys(date: Date = new Date()): {
  monthly: { periodType: ReadingDnaPeriodType; periodKey: string };
  yearly: { periodType: ReadingDnaPeriodType; periodKey: string };
} {
  return {
    monthly: { periodType: "monthly", periodKey: monthPeriodKey(date) },
    yearly: { periodType: "yearly", periodKey: yearPeriodKey(date) },
  };
}

export function readingDnaFromCachedPayload(
  payload: Record<string, unknown> | null | undefined
): ReadingDna | null {
  if (!payload || typeof payload !== "object") return null;
  const categories = payload.categories as ReadingDna["categories"] | undefined;
  const habits = (payload.habits as ReadingDna["habits"]) ?? [];
  const topTraits = payload.topTraits as ReadingDna["topTraits"] | undefined;
  const matchVector = payload.matchVector;
  if (!Array.isArray(categories) || !Array.isArray(topTraits) || !matchVector) {
    return null;
  }
  const traitsFromCategories = categories.flatMap((category) => category.traits ?? []);
  return {
    dnaVersion: typeof payload.dnaVersion === "string" ? payload.dnaVersion : READING_DNA_VERSION,
    topTraits,
    personaTraits: (payload.personaTraits as ReadingDna["personaTraits"]) ?? [],
    traits: (payload.traits as ReadingDna["traits"]) ?? [...traitsFromCategories, ...habits],
    categories,
    habits,
    summary: typeof payload.summary === "string" ? payload.summary : "",
    insight: typeof payload.insight === "string" ? payload.insight : "",
    confidence: (payload.confidence as ReadingDna["confidence"]) ?? "low",
    confidenceScore: Number(payload.confidenceScore ?? 0),
    sampleSize: Number(payload.sampleSize ?? 0),
    dataPointsCount: Number(payload.dataPointsCount ?? 0),
    forming: Boolean(payload.forming),
    matchVector: matchVector as ReadingDna["matchVector"],
  };
}

/** Debounce window for client-side DNA persistence (ms). */
export const READING_DNA_PERSIST_DEBOUNCE_MS = 8_000;
