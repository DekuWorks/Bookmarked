/**
 * Home → Overview Quick Actions — shared copy, colors, routes, and analytics.
 *
 * Colors stay in this module (do not scatter hexes). Bookmarked purple is the
 * official light `--color-primary` token `#B89DBB` (not a new purple).
 *
 * Fourth card: after replacing Search Books / Trail and removing Continue Reading,
 * no remaining current Quick Action exists. Do not invent a fourth destination.
 */

import { OVERVIEW_QUICK_ACTIONS } from "./overviewCopy";

/** Official Bookmarked purple — `apps/web` `--color-primary` light and mobile `BRAND.primary`. */
export const BOOKMARKED_PURPLE = "#B89DBB";

/** Brand ink on lavender fills (`--color-on-primary`). */
const BRAND_INK = "#642F37";

/** Light-theme body text (`--color-text`) — fallback when ink contrast fails. */
const BODY_INK = "#1A1A1A";

/** Light-theme page background (`--color-background`) — fallback for dark fills. */
const PAGE_LIGHT = "#FAF8FC";

export const OVERVIEW_QUICK_ACTION_COLORS = {
  openLibrary: "#e7a4a6",
  bookClubs: "#eb9f8e",
  readingChallenges: BOOKMARKED_PURPLE,
  /** Reserved until product names a valid fourth current Quick Action. */
  reservedFourth: "#d18dbe",
} as const;

export const OVERVIEW_QUICK_ACTION_EVENTS = {
  openLibrary: "quick_action_open_library",
  bookClubs: "quick_action_book_clubs",
  readingChallenges: "quick_action_reading_challenges",
} as const;

export type OverviewQuickActionEvent =
  (typeof OVERVIEW_QUICK_ACTION_EVENTS)[keyof typeof OVERVIEW_QUICK_ACTION_EVENTS];

export type OverviewQuickActionId = "openLibrary" | "bookClubs" | "readingChallenges";

export type OverviewQuickActionIcon = "library" | "clubs" | "challenges";

export type OverviewQuickAction = {
  id: OverviewQuickActionId;
  label: string;
  icon: OverviewQuickActionIcon;
  color: string;
  textColor: string;
  analyticsEvent: OverviewQuickActionEvent;
  webHref: string;
  mobileHref: string;
};

function parseHex(hex: string): { r: number; g: number; b: number } {
  const raw = hex.trim().replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : raw.slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function srgbChannel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Pick readable text for a Quick Action fill. Does not invert the card color. */
export function quickActionContrastText(background: string): string {
  if (contrastRatio(BRAND_INK, background) >= 4.5) return BRAND_INK;
  if (contrastRatio(BODY_INK, background) >= 4.5) return BODY_INK;
  return PAGE_LIGHT;
}

export const OVERVIEW_QUICK_ACTIONS_LIST: readonly OverviewQuickAction[] = [
  {
    id: "openLibrary",
    label: OVERVIEW_QUICK_ACTIONS.openLibrary,
    icon: "library",
    color: OVERVIEW_QUICK_ACTION_COLORS.openLibrary,
    textColor: quickActionContrastText(OVERVIEW_QUICK_ACTION_COLORS.openLibrary),
    analyticsEvent: OVERVIEW_QUICK_ACTION_EVENTS.openLibrary,
    webHref: "/library/",
    mobileHref: "/library",
  },
  {
    id: "bookClubs",
    label: OVERVIEW_QUICK_ACTIONS.bookClubs,
    icon: "clubs",
    color: OVERVIEW_QUICK_ACTION_COLORS.bookClubs,
    textColor: quickActionContrastText(OVERVIEW_QUICK_ACTION_COLORS.bookClubs),
    analyticsEvent: OVERVIEW_QUICK_ACTION_EVENTS.bookClubs,
    webHref: "/clubs/",
    mobileHref: "/clubs",
  },
  {
    id: "readingChallenges",
    label: OVERVIEW_QUICK_ACTIONS.readingChallenges,
    icon: "challenges",
    color: OVERVIEW_QUICK_ACTION_COLORS.readingChallenges,
    textColor: quickActionContrastText(OVERVIEW_QUICK_ACTION_COLORS.readingChallenges),
    analyticsEvent: OVERVIEW_QUICK_ACTION_EVENTS.readingChallenges,
    webHref: "/challenges/",
    mobileHref: "/challenges",
  },
] as const;

/**
 * Product asked for four cards and to keep the remaining current Quick Action.
 * After the required replacements/removal, none remains. Slot stays empty on
 * purpose — do not add Notes, Journal, Goals, Search, or Trail here.
 */
export const OVERVIEW_QUICK_ACTION_FOURTH_SLOT: null = null;
