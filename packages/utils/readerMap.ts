import {
  canUseReaderMapSocial,
  type AgeEligibilityStatus,
  type HomeEligibilityFlags,
} from "./homeEligibility";
import { READER_MAP_DEFAULT_OPT_IN, READER_MAP_OPT_IN_COPY } from "./locationPrivacy";

export { READER_MAP_DEFAULT_OPT_IN, READER_MAP_OPT_IN_COPY };

export const READER_MAP_NAV_LABEL = "Reader Map";

export type ReaderMapFilterKey =
  | "genre"
  | "favorite_book"
  | "trope"
  | "personality"
  | "club"
  | "college"
  | "city";

export type ReaderMapFilters = Partial<Record<ReaderMapFilterKey, string>>;

export type ReaderMapSettings = {
  opted_in: boolean;
  discoverable: boolean;
  share_personality: boolean;
  share_college: boolean;
  city_label: string | null;
  college_label: string | null;
  birth_year: number | null;
};

export const DEFAULT_READER_MAP_SETTINGS: ReaderMapSettings = {
  opted_in: READER_MAP_DEFAULT_OPT_IN,
  discoverable: false,
  share_personality: false,
  share_college: false,
  city_label: null,
  college_label: null,
  birth_year: null,
};

export type VisibleReaderCard = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city_label: string | null;
  college_label: string | null;
  personality_label: string | null;
  favorite_genres: string[] | null;
  public_club_names: string[];
  coarse_lat: number;
  coarse_lng: number;
};

export function visibleReaderCardFields(card: VisibleReaderCard): VisibleReaderCard {
  return {
    user_id: card.user_id,
    username: card.username,
    display_name: card.display_name,
    avatar_url: card.avatar_url,
    city_label: card.city_label,
    college_label: card.college_label,
    personality_label: card.personality_label,
    favorite_genres: card.favorite_genres,
    public_club_names: card.public_club_names,
    coarse_lat: card.coarse_lat,
    coarse_lng: card.coarse_lng,
  };
}

export function readerMapSocialAllowed(input: {
  hasHome: boolean;
  settings: ReaderMapSettings;
  ageStatus: AgeEligibilityStatus;
  flags: HomeEligibilityFlags;
  extraTrustOk?: boolean;
}): boolean {
  return canUseReaderMapSocial({
    hasHome: input.hasHome,
    optedIn: input.settings.opted_in,
    discoverable: input.settings.discoverable,
    ageStatus: input.ageStatus,
    extraTrustRequired: input.flags.readerMapExtraTrustRequired,
    extraTrustOk: input.extraTrustOk,
  });
}

export function applyReaderMapFilters(
  cards: readonly VisibleReaderCard[],
  filters: ReaderMapFilters
): VisibleReaderCard[] {
  return cards.filter((card) => {
    if (filters.city && !(card.city_label ?? "").toLocaleLowerCase().includes(filters.city.toLocaleLowerCase())) {
      return false;
    }
    if (
      filters.college &&
      !(card.college_label ?? "").toLocaleLowerCase().includes(filters.college.toLocaleLowerCase())
    ) {
      return false;
    }
    if (
      filters.personality &&
      !(card.personality_label ?? "").toLocaleLowerCase().includes(filters.personality.toLocaleLowerCase())
    ) {
      return false;
    }
    if (
      filters.genre &&
      !(card.favorite_genres ?? []).some((genre) =>
        genre.toLocaleLowerCase().includes(filters.genre!.toLocaleLowerCase())
      )
    ) {
      return false;
    }
    if (
      filters.club &&
      !card.public_club_names.some((name) =>
        name.toLocaleLowerCase().includes(filters.club!.toLocaleLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });
}

/** Clubs on Reader Map are public only — never private membership. */
export function publicClubNamesOnly(
  clubs: ReadonlyArray<{ name: string; visibility?: string | null }>
): string[] {
  return clubs.filter((club) => club.visibility === "public").map((club) => club.name);
}
