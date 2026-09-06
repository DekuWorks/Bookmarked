/**
 * AI Reading Companion safety — progress-aware spoilers, no certainty on maps.
 */

export const AI_COMPANION_ACTIONS = [
  "discussion_questions",
  "character_map",
  "timeline",
  "reading_schedule",
  "ending_explanation",
  "personalized_tbr",
] as const;

export type AiCompanionAction = (typeof AI_COMPANION_ACTIONS)[number];

export type ReaderProgress = {
  shelfStatus?: string | null;
  progressPercent?: number | null;
  finished?: boolean;
};

export type CompanionSafety = {
  allowSpoilers: boolean;
  requireEndingConfirm: boolean;
  progressHint: string;
};

export function isFinishedProgress(progress: ReaderProgress): boolean {
  if (progress.finished) return true;
  return progress.shelfStatus === "read";
}

export function companionSafetyFor(
  action: AiCompanionAction,
  progress: ReaderProgress,
  endingConfirmed = false
): CompanionSafety {
  const finished = isFinishedProgress(progress);
  const percent = Number(progress.progressPercent) || 0;
  const requireEndingConfirm = action === "ending_explanation" && !finished && !endingConfirmed;

  return {
    allowSpoilers: finished || (action === "ending_explanation" && endingConfirmed),
    requireEndingConfirm,
    progressHint: finished
      ? "Reader has finished this book."
      : `Reader is about ${Math.max(0, Math.min(100, percent))}% through and has not finished.`,
  };
}

export function endingExplanationBlocked(progress: ReaderProgress, endingConfirmed: boolean): boolean {
  return companionSafetyFor("ending_explanation", progress, endingConfirmed).requireEndingConfirm;
}

export function characterMapDisclaimer(): string {
  return "Character relationships are a reading aid, not a verified fact. Treat inferred links as suggestions.";
}

export function audiobookScheduleLabel(totalSeconds: number, days: number): string {
  const safeDays = Math.max(1, days);
  const perDay = Math.round(totalSeconds / safeDays);
  const hours = Math.floor(perDay / 3600);
  const minutes = Math.floor((perDay % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} listening / day`;
}

export function buildCompanionSystemPrompt(input: {
  action: AiCompanionAction;
  safety: CompanionSafety;
  bookTitle: string;
  format: "book" | "audiobook";
}): string {
  const lines = [
    "You are the Bookmarked AI Reading Companion.",
    "Use only the supplied reader context. Never invent other users' private notes.",
    "Do not present guesses as certainty.",
    `Book: ${input.bookTitle}`,
    `Format: ${input.format}`,
    input.safety.progressHint,
  ];
  if (!input.safety.allowSpoilers) {
    lines.push("Do not spoil later plot, ending, or unrevealed identities.");
  }
  if (input.action === "character_map") {
    lines.push(characterMapDisclaimer());
  }
  if (input.action === "reading_schedule" && input.format === "audiobook") {
    lines.push("Give listening time as HH:MM. Never invent page counts for audiobooks.");
  }
  if (input.action === "personalized_tbr") {
    lines.push("Explain each suggestion. Treat DNF history carefully — do not shame or over-index on one DNF.");
  }
  return lines.join("\n");
}

export const AI_COMPANION_RATE_LIMIT = {
  requestsPerDay: 20,
  cacheTtlHours: 24,
} as const;
