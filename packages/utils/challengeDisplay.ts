import type {
  ChallengeProgressUnit,
  ChallengeVisibility,
} from "./challengeTypes";
import { COMMUNITY_MILESTONE_THRESHOLDS } from "./challengeTypes";

/** Compact listening display: `24h 30m`. Never pages or raw seconds. */
export function formatChallengeListeningTime(seconds: number | null | undefined): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Number(seconds)) : 0;
  const totalMinutes = Math.round(safe / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatChallengeListeningSpoken(seconds: number | null | undefined): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Number(seconds)) : 0;
  const totalMinutes = Math.round(safe / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const hourLabel = hours === 1 ? "1 hour" : `${hours} hours`;
  const minuteLabel = minutes === 1 ? "1 minute" : `${minutes} minutes`;
  if (hours === 0) return minuteLabel;
  if (minutes === 0) return hourLabel;
  return `${hourLabel} ${minuteLabel}`;
}

export function formatChallengeAmount(amount: number, unit: ChallengeProgressUnit): string {
  const safe = Math.max(0, Math.round(amount));
  switch (unit) {
    case "pages":
      return safe === 1 ? "1 page" : `${safe} pages`;
    case "listening_seconds":
      return formatChallengeListeningTime(safe);
    case "objectives":
      return safe === 1 ? "1 objective" : `${safe} objectives`;
    case "books":
    default:
      return safe === 1 ? "1 book" : `${safe} books`;
  }
}

export function formatCommunityMilestone(threshold: number): string {
  if (threshold >= 1_000_000 && threshold % 1_000_000 === 0) {
    return `${threshold / 1_000_000}M`;
  }
  if (threshold >= 1000 && threshold % 1000 === 0) {
    const thousands = threshold / 1000;
    return `${thousands}k`;
  }
  return String(threshold);
}

export function nextCommunityMilestone(currentTotal: number): number | null {
  for (const threshold of COMMUNITY_MILESTONE_THRESHOLDS) {
    if (currentTotal < threshold) return threshold;
  }
  return null;
}

export function crossedCommunityMilestones(
  previousTotal: number,
  nextTotal: number
): number[] {
  return COMMUNITY_MILESTONE_THRESHOLDS.filter(
    (threshold) => previousTotal < threshold && nextTotal >= threshold
  );
}

export function challengePercent(current: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  const ratio = Math.max(0, current) / target;
  return Math.min(100, Math.round(ratio * 1000) / 10);
}

export function timeRemainingLabel(
  endsAt: string | null | undefined,
  nowMs: number = Date.now()
): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(end)) return null;
  const diff = end - nowMs;
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86_400_000);
  if (days >= 60) {
    const months = Math.round(days / 30);
    return months === 1 ? "1 month left" : `${months} months left`;
  }
  if (days >= 14) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? "1 week left" : `${weeks} weeks left`;
  }
  if (days >= 1) return days === 1 ? "1 day left" : `${days} days left`;
  const hours = Math.max(1, Math.round(diff / 3_600_000));
  return hours === 1 ? "1 hour left" : `${hours} hours left`;
}

export function visibilityLabel(visibility: ChallengeVisibility): string {
  switch (visibility) {
    case "private":
      return "Private";
    case "friend":
      return "Friend-only";
    case "followers":
      return "Visible to Followers";
    case "public":
    default:
      return "Public";
  }
}

/** iPhone: 1 column. iPad / tablet pane (>= 768): 2 columns. Does not change Library grids. */
export function challengeCardColumns(width: number): 1 | 2 {
  return width >= 768 ? 2 : 1;
}

export function challengeProgressAnnouncement(input: {
  title: string;
  current: number;
  target: number;
  unit: ChallengeProgressUnit;
  percent: number;
}): string {
  return `${input.title}, ${formatChallengeAmount(input.current, input.unit)} of ${formatChallengeAmount(input.target, input.unit)}, ${input.percent} percent`;
}

export function checklistItemAnnouncement(title: string, completed: boolean): string {
  return completed ? `${title}, complete` : `${title}, incomplete`;
}
