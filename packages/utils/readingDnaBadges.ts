import { READING_DNA_HOME_BADGE_DEFS } from "./readingDnaConfig";

export type ReadingDnaBadgeEvidence = {
  monthlySnapshotCount: number;
  bestVisibleMatchPercent: number | null;
  dataPointsCount: number;
};

export type ReadingDnaBadgeAward = {
  id: string;
  criterion: string;
  earned: boolean;
};

/** Placeholder Home badge architecture. No official names or art. */
export function evaluateReadingDnaHomeBadges(
  evidence: ReadingDnaBadgeEvidence
): ReadingDnaBadgeAward[] {
  return READING_DNA_HOME_BADGE_DEFS.map((def) => {
    let earned = false;
    if ("minMonthlySnapshots" in def) {
      earned = evidence.monthlySnapshotCount >= def.minMonthlySnapshots;
    } else if ("minVisibleMatchPercent" in def) {
      earned =
        evidence.bestVisibleMatchPercent != null &&
        evidence.bestVisibleMatchPercent >= def.minVisibleMatchPercent;
    } else if ("minDataPoints" in def) {
      earned = evidence.dataPointsCount >= def.minDataPoints;
    }
    return { id: def.id, criterion: def.criterion, earned };
  });
}
