import { READING_DNA_MOM_CHANGE_THRESHOLD } from "./readingDnaConfig";
import type { ReadingDna, ReadingDnaTraitCategory } from "./readingDna";

export type ReadingDnaSnapshotCompareRow = {
  category: ReadingDnaTraitCategory;
  label: string;
  previousPercent: number;
  currentPercent: number;
  delta: number;
};

function percentMap(dna: ReadingDna): Map<string, { category: ReadingDnaTraitCategory; percent: number }> {
  const map = new Map<string, { category: ReadingDnaTraitCategory; percent: number }>();
  for (const trait of dna.traits) {
    if (trait.category === "habit") continue;
    map.set(`${trait.category}:${trait.label}`, { category: trait.category, percent: trait.percent });
  }
  return map;
}

export function compareReadingDnaSnapshots(
  previous: ReadingDna,
  current: ReadingDna,
  threshold = READING_DNA_MOM_CHANGE_THRESHOLD
): ReadingDnaSnapshotCompareRow[] {
  const prev = percentMap(previous);
  const next = percentMap(current);
  const keys = new Set([...prev.keys(), ...next.keys()]);
  const rows: ReadingDnaSnapshotCompareRow[] = [];
  for (const key of keys) {
    const [category, ...labelParts] = key.split(":");
    const label = labelParts.join(":");
    const previousPercent = prev.get(key)?.percent ?? 0;
    const currentPercent = next.get(key)?.percent ?? 0;
    const delta = currentPercent - previousPercent;
    if (Math.abs(delta) < threshold) continue;
    rows.push({
      category: category as ReadingDnaTraitCategory,
      label,
      previousPercent,
      currentPercent,
      delta,
    });
  }
  return rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.label.localeCompare(b.label));
}
