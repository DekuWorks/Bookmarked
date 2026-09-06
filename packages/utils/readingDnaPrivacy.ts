import {
  READING_DNA_DEFAULT_VISIBILITY,
  READING_DNA_MATCH_FOLLOWS_VISIBILITY_BY_DEFAULT,
  type ReadingDnaVisibility,
} from "./readingDnaConfig";

export type ReadingDnaPrivacyState = {
  visibility: ReadingDnaVisibility;
  /** FLAG #9 — when null, Match follows DNA visibility. */
  matchEnabled: boolean | null;
  publicTopTraitsApproved: boolean;
  sharePersonalityOnReaderMap: boolean;
};

export const DEFAULT_READING_DNA_PRIVACY: ReadingDnaPrivacyState = {
  visibility: READING_DNA_DEFAULT_VISIBILITY,
  matchEnabled: null,
  publicTopTraitsApproved: false,
  sharePersonalityOnReaderMap: false,
};

export function parseReadingDnaVisibility(value: unknown): ReadingDnaVisibility {
  if (value === "public" || value === "followers" || value === "private") return value;
  return READING_DNA_DEFAULT_VISIBILITY;
}

export function readingDnaMatchAllowed(state: ReadingDnaPrivacyState): boolean {
  if (state.visibility === "private") return false;
  if (state.matchEnabled === false) return false;
  if (state.matchEnabled === true) return true;
  return READING_DNA_MATCH_FOLLOWS_VISIBILITY_BY_DEFAULT;
}

export function readingDnaPublicTopThreeAllowed(state: ReadingDnaPrivacyState): boolean {
  return state.visibility === "public" && state.publicTopTraitsApproved;
}

export function readingDnaFollowersTopThreeAllowed(
  state: ReadingDnaPrivacyState,
  viewerFollows: boolean
): boolean {
  if (state.visibility === "private") return false;
  if (state.visibility === "public") return state.publicTopTraitsApproved;
  return viewerFollows;
}

/**
 * Reader Map DNA filter needs explicit DNA visibility consent.
 * Home subscription is not consent. share_personality alone is not enough
 * if DNA is private.
 */
export function readingDnaReaderMapFilterAllowed(state: ReadingDnaPrivacyState): boolean {
  return state.visibility !== "private" && state.sharePersonalityOnReaderMap;
}

export function readingDnaShareCardAllowed(state: ReadingDnaPrivacyState): boolean {
  return state.visibility !== "private";
}
