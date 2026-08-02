/** Shared profile & settings validation (web + mobile). */

export const MAX_BIO_LENGTH = 500;
export const MAX_DISPLAY_NAME_LENGTH = 80;
export const MAX_USERNAME_LENGTH = 32;
export const MIN_USERNAME_LENGTH = 3;
export const MIN_READING_GOAL = 1;
export const MAX_READING_GOAL = 500;

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export const PREFERRED_LANGUAGE_CODES = ["en", "es", "fr", "de"] as const;
export type PreferredLanguageCode = (typeof PREFERRED_LANGUAGE_CODES)[number];

export const SHELF_VISIBILITY_VALUES = ["public", "followers", "private"] as const;
export type ShelfVisibilityValue = (typeof SHELF_VISIBILITY_VALUES)[number];

export const NOTIFICATION_PREF_KEYS = [
  "notify_messages",
  "notify_follows",
  "notify_feed",
  "notify_likes",
  "notify_comments",
  "notify_mentions",
  "notify_clubs",
  "notify_browser",
] as const;

export type NotificationPrefKey = (typeof NOTIFICATION_PREF_KEYS)[number];

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function parsePreferredLanguage(
  value: string | null | undefined
): PreferredLanguageCode {
  if (value && PREFERRED_LANGUAGE_CODES.includes(value as PreferredLanguageCode)) {
    return value as PreferredLanguageCode;
  }
  return "en";
}

export type FieldValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function validateUsername(username: string): FieldValidationResult<string> {
  const trimmed = username.trim();
  if (!trimmed) return { ok: false, error: "Username is required." };
  if (trimmed.length < MIN_USERNAME_LENGTH) {
    return {
      ok: false,
      error: `Username must be at least ${MIN_USERNAME_LENGTH} characters.`,
    };
  }
  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return {
      ok: false,
      error: `Username must be ${MAX_USERNAME_LENGTH} characters or fewer.`,
    };
  }
  if (!USERNAME_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error: "Username can only use letters, numbers, and underscores.",
    };
  }
  return { ok: true, value: trimmed };
}

export function validateDisplayName(displayName: string): FieldValidationResult<string | null> {
  const trimmed = displayName.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      error: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`,
    };
  }
  return { ok: true, value: trimmed };
}

export function validateBio(bio: string): FieldValidationResult<string | null> {
  const trimmed = bio.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > MAX_BIO_LENGTH) {
    return {
      ok: false,
      error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer.`,
    };
  }
  return { ok: true, value: trimmed };
}

export function parseFavoriteGenres(input: string): string[] {
  return input
    .split(",")
    .map((genre) => genre.trim())
    .filter(Boolean);
}

export function validateReadingGoal(raw: unknown): FieldValidationResult<number> {
  const goal = Number(raw);
  if (!Number.isFinite(goal) || goal < MIN_READING_GOAL || goal > MAX_READING_GOAL) {
    return {
      ok: false,
      error: `Enter a whole number between ${MIN_READING_GOAL} and ${MAX_READING_GOAL} books.`,
    };
  }
  const rounded = Math.round(goal);
  if (Math.abs(goal - rounded) > 1e-9) {
    return {
      ok: false,
      error: `Enter a whole number between ${MIN_READING_GOAL} and ${MAX_READING_GOAL} books.`,
    };
  }
  return { ok: true, value: rounded };
}

export function validateShelfVisibility(value: string): FieldValidationResult<ShelfVisibilityValue> {
  if (SHELF_VISIBILITY_VALUES.includes(value as ShelfVisibilityValue)) {
    return { ok: true, value: value as ShelfVisibilityValue };
  }
  return { ok: false, error: "Choose a valid shelf visibility." };
}

export function validateNotificationPreferences(
  prefs: Record<string, unknown>
): ValidationResult {
  for (const key of Object.keys(prefs)) {
    if (!NOTIFICATION_PREF_KEYS.includes(key as NotificationPrefKey)) {
      return { ok: false, error: "Invalid notification preference." };
    }
    if (typeof prefs[key] !== "boolean") {
      return { ok: false, error: "Invalid notification preference." };
    }
  }
  return { ok: true };
}
