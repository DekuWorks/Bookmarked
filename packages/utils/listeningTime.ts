/** Audiobook listening times. Stored as seconds; readers only see HH:MM. */

export const LISTENING_TIME_ERROR =
  "Enter listening time as hours and minutes, such as 2:30.";
export const CURRENT_EXCEEDS_TOTAL_ERROR =
  "Current listening time cannot be greater than the total listening time.";
export const SESSION_END_BEFORE_START_ERROR =
  "Ending listening position cannot be earlier than the starting position.";
export const SESSION_END_EXCEEDS_TOTAL_ERROR =
  "Ending listening position cannot exceed the audiobook's total listening time.";

export type TrackingFormat = "book" | "audiobook";

export type ListeningTimeParse =
  | { ok: true; seconds: number; hours: number; minutes: number; display: string }
  | { ok: false; error: string };

export type AudiobookProgressValidation =
  | { ok: true; currentSeconds: number; totalSeconds: number; percent: number }
  | { ok: false; error: string };

export type AudiobookSessionValidation =
  | {
      ok: true;
      startSeconds: number;
      endSeconds: number;
      durationSeconds: number;
    }
  | { ok: false; error: string };

const TIME_PATTERN = /^(\d{1,3}):(\d{1,2})$/;

export function parseListeningTime(
  value: string | number | null | undefined
): ListeningTimeParse {
  if (value == null) {
    return { ok: false, error: LISTENING_TIME_ERROR };
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
      return { ok: false, error: LISTENING_TIME_ERROR };
    }
    return fromHoursMinutes(Math.floor(value / 3600), Math.floor((value % 3600) / 60));
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: LISTENING_TIME_ERROR };
  }

  const match = TIME_PATTERN.exec(trimmed);
  if (!match) {
    return { ok: false, error: LISTENING_TIME_ERROR };
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || minutes < 0) {
    return { ok: false, error: LISTENING_TIME_ERROR };
  }
  if (minutes > 59) {
    return { ok: false, error: LISTENING_TIME_ERROR };
  }

  return fromHoursMinutes(hours, minutes);
}

function fromHoursMinutes(hours: number, minutes: number): ListeningTimeParse {
  const seconds = hours * 3600 + minutes * 60;
  return {
    ok: true,
    seconds,
    hours,
    minutes,
    display: formatHoursMinutes(hours, minutes),
  };
}

function formatHoursMinutes(hours: number, minutes: number): string {
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

/** Display `2:30`, never `02:30` or `02:30:00`. Rounds leftover seconds to the nearest minute. */
export function formatListeningTime(seconds: number | null | undefined): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Number(seconds)) : 0;
  const totalMinutes = Math.round(safe / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return formatHoursMinutes(hours, minutes);
}

export function formatListeningTimeSpoken(seconds: number | null | undefined): string {
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

export function listeningTimeParts(seconds: number | null | undefined): {
  hours: string;
  minutes: string;
} {
  const display = formatListeningTime(seconds);
  const [hours, minutes] = display.split(":");
  return { hours: hours ?? "0", minutes: minutes ?? "00" };
}

export function combineListeningTimeParts(hours: string, minutes: string): string {
  const parsedHours = hours.trim() === "" ? "0" : hours.trim();
  const parsedMinutes = minutes.trim() === "" ? "0" : minutes.trim();
  return `${parsedHours}:${parsedMinutes}`;
}

export function calculateAudiobookProgress(
  currentSeconds: number,
  totalSeconds: number
): number {
  if (totalSeconds <= 0) return 0;
  return Math.min(100, Math.round((Math.max(0, currentSeconds) / totalSeconds) * 1000) / 10);
}

export function calculateAudiobookSessionDuration(
  startSeconds: number,
  endSeconds: number
): number {
  return Math.max(0, endSeconds - startSeconds);
}

export function validateListeningProgress(input: {
  current: string | number | null | undefined;
  total: string | number | null | undefined;
}): AudiobookProgressValidation {
  const current = parseListeningTime(input.current);
  if (!current.ok) return current;
  const total = parseListeningTime(input.total);
  if (!total.ok) return total;
  if (total.seconds <= 0) {
    return { ok: false, error: LISTENING_TIME_ERROR };
  }
  if (current.seconds > total.seconds) {
    return { ok: false, error: CURRENT_EXCEEDS_TOTAL_ERROR };
  }
  return {
    ok: true,
    currentSeconds: current.seconds,
    totalSeconds: total.seconds,
    percent: calculateAudiobookProgress(current.seconds, total.seconds),
  };
}

export function validateListeningSession(input: {
  start: string | number | null | undefined;
  end: string | number | null | undefined;
  total?: string | number | null | undefined;
}): AudiobookSessionValidation {
  const start = parseListeningTime(input.start);
  if (!start.ok) return start;
  const end = parseListeningTime(input.end);
  if (!end.ok) return end;
  if (end.seconds < start.seconds) {
    return { ok: false, error: SESSION_END_BEFORE_START_ERROR };
  }
  if (input.total != null && input.total !== "") {
    const total = parseListeningTime(input.total);
    if (!total.ok) return total;
    if (end.seconds > total.seconds) {
      return { ok: false, error: SESSION_END_EXCEEDS_TOTAL_ERROR };
    }
  }
  return {
    ok: true,
    startSeconds: start.seconds,
    endSeconds: end.seconds,
    durationSeconds: calculateAudiobookSessionDuration(start.seconds, end.seconds),
  };
}

/** Historical sessions never rewind the saved current position. */
export function nextListeningProgressAfterSession(
  currentSeconds: number,
  sessionEndSeconds: number
): number {
  return Math.max(Math.max(0, currentSeconds), Math.max(0, sessionEndSeconds));
}

export function resolveTrackingFormat(input: {
  userFormat?: string | null;
  catalogFormat?: string | null;
}): TrackingFormat {
  if (input.userFormat === "audiobook" || input.userFormat === "book") {
    return input.userFormat;
  }
  if (input.catalogFormat === "audiobook") return "audiobook";
  return "book";
}

export function resolveAudiobookDurationSeconds(input: {
  userDurationSeconds?: number | null;
  catalogDurationSeconds?: number | null;
}): number {
  if (input.userDurationSeconds && input.userDurationSeconds > 0) {
    return input.userDurationSeconds;
  }
  if (input.catalogDurationSeconds && input.catalogDurationSeconds > 0) {
    return input.catalogDurationSeconds;
  }
  return 0;
}

export function formatAudiobookProgressLabel(
  currentSeconds: number,
  totalSeconds: number
): string {
  return `${formatListeningTime(currentSeconds)} of ${formatListeningTime(totalSeconds)}`;
}

export function formatListeningDurationLabel(seconds: number): string {
  return formatListeningTimeSpoken(seconds);
}

export function formatListeningRange(startSeconds: number, endSeconds: number): string {
  return `Listened from ${formatListeningTime(startSeconds)} to ${formatListeningTime(endSeconds)}`;
}

export function formatListeningSessionSummary(input: {
  listening_start_seconds?: number | null;
  listening_end_seconds?: number | null;
  listening_seconds?: number | null;
}): string {
  const start = Math.max(0, Number(input.listening_start_seconds) || 0);
  const explicitDuration = Number(input.listening_seconds);
  const end =
    input.listening_end_seconds != null && Number.isFinite(Number(input.listening_end_seconds))
      ? Math.max(0, Number(input.listening_end_seconds))
      : start + Math.max(0, Number.isFinite(explicitDuration) ? explicitDuration : 0);
  const duration = Number.isFinite(explicitDuration)
    ? Math.max(0, explicitDuration)
    : calculateAudiobookSessionDuration(start, end);
  return `${formatListeningRange(start, end)} · ${formatListeningDurationLabel(duration)}`;
}

export function formatHistorySessionDetail(input: {
  session_format?: string | null;
  pages_read?: number | null;
  listening_start_seconds?: number | null;
  listening_end_seconds?: number | null;
  listening_seconds?: number | null;
}): string {
  if (input.session_format === "audiobook") {
    return formatListeningDurationLabel(
      Number(input.listening_seconds) ||
        calculateAudiobookSessionDuration(
          Number(input.listening_start_seconds) || 0,
          Number(input.listening_end_seconds) || 0
        )
    );
  }
  const pages = Number(input.pages_read) || 0;
  return pages === 1 ? "1 page" : `${pages} pages`;
}
