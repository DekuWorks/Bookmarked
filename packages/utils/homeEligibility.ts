/**
 * Flexible Home eligibility hooks.
 * Open product questions stay as config — do not invent answers here.
 */

export const HOME_PRODUCT_DECISIONS = {
  plusDisplayName: {
    id: 1,
    question: "$5.99 official name Premium vs Plus?",
    status: "open",
    codeStays: "plus",
    note: "DB/code stay `plus`. User-facing Plus is shipped. Premium is a legacy alias only.",
  },
  bookMapPrimaryNav: {
    id: 2,
    question: "Where Book Map lives in primary nav",
    status: "open",
    interim: "Secondary dest: Book Map. Do not rename Overview/Home.",
  },
  readerMapPlacement: {
    id: 3,
    question: "Reader Map: inside Book Map vs separate vs Home Hub",
    status: "open",
    interim: "Dedicated /reader-map route, linked from Book Map + Home Hub.",
  },
  readingCafeQualification: {
    id: 4,
    question: "What qualifies a Reading Café",
    status: "open",
    flagKey: "reading_cafe_qualification",
  },
  bookMapUserSubmissions: {
    id: 5,
    question: "Can users submit new Book Map places",
    status: "open",
    flagKey: "book_map_user_submissions_enabled",
    defaultEnabled: false,
  },
  readerMapCoarseness: {
    id: 6,
    question: "Reader Map coarseness (city / neighborhood / randomized)",
    status: "open",
    flagKey: "reader_map_coarseness_mode",
    defaultMode: "city",
  },
  extraTrustRequirements: {
    id: 7,
    question: "Extra trust requirements beyond adult opt-in",
    status: "open",
    flagKey: "reader_map_extra_trust_required",
    defaultRequired: false,
  },
  minimumAge: {
    id: 8,
    question: "Minimum age for Reader Map/Meetups",
    status: "open",
    flagKey: "reader_map_min_age",
    defaultMinAge: null,
    note: "Do not invent a number. Unknown age or under a configured minimum is blocked.",
  },
  publicMeetupCreators: {
    id: 9,
    question: "Who can create public Meetups",
    status: "open",
    flagKey: "public_meetup_who_can_create",
    defaultWho: "home_only",
  },
  publicMeetupPreapproval: {
    id: 10,
    question: "Public Meetups pre-approval",
    status: "open",
    flagKey: "public_meetup_preapproval",
    defaultRequired: true,
  },
  videoProviderDefault: {
    id: 11,
    question: "Production video provider default",
    status: "open",
    flagKey: "video_provider_default",
    defaultProvider: "external",
    note: "Do not pick Zoom as production default.",
  },
  qaIncludedVsTicketed: {
    id: 12,
    question: "Which Q&As are Home-included vs ticketed",
    status: "open",
    note: "event_access.price_cents is data per experience.",
  },
  lowerTierQaFees: {
    id: 13,
    question: "Lower-tier Q&A fees",
    status: "open",
    note: "event_access.lower_tier_fee_cents is data.",
  },
  partnerDiscountRedemption: {
    id: 14,
    question: "Partner discount redemption",
    status: "open",
    note: "No public codes. Entitlement-aware benefit keys only.",
  },
  officialPersonalityNames: {
    id: 15,
    question: "Official Reading Personality names",
    status: "open",
    note: "Use existing deterministic persona labels until product names a taxonomy.",
  },
  dnaRecalcCadence: {
    id: 16,
    question: "DNA recalc cadence",
    status: "open",
    flagKey: "reading_dna_recalc_hours",
    defaultHours: 24,
  },
  betaAutoVsPerFlag: {
    id: 17,
    question: "Every beta automatic vs per-flag",
    status: "open",
    flagKey: "home_beta_auto_enroll",
    defaultAuto: false,
  },
  prioritySupportSla: {
    id: 18,
    question: "Priority-support SLA",
    status: "open",
    note: "Do not promise a 1-hour (or any) SLA. Copy is elevated consideration only.",
  },
} as const;

export type HomeFeatureFlagKey =
  | "reading_cafe_qualification"
  | "book_map_user_submissions_enabled"
  | "reader_map_coarseness_mode"
  | "reader_map_extra_trust_required"
  | "reader_map_min_age"
  | "public_meetup_who_can_create"
  | "public_meetup_preapproval"
  | "video_provider_default"
  | "reading_dna_recalc_hours"
  | "home_beta_auto_enroll";

export type ReaderMapCoarsenessMode = "city" | "neighborhood" | "randomized";

export type PublicMeetupCreatorPolicy = "home_only" | "staff_only" | "plus_and_home";

export type AgeEligibilityStatus = "unknown" | "under_minimum" | "eligible";

export type HomeEligibilityFlags = {
  bookMapUserSubmissionsEnabled: boolean;
  readerMapCoarsenessMode: ReaderMapCoarsenessMode;
  readerMapExtraTrustRequired: boolean;
  readerMapMinAge: number | null;
  publicMeetupWhoCanCreate: PublicMeetupCreatorPolicy;
  publicMeetupPreapproval: boolean;
  videoProviderDefault: "external" | "unset";
  readingDnaRecalcHours: number;
  homeBetaAutoEnroll: boolean;
};

export const DEFAULT_HOME_ELIGIBILITY_FLAGS: HomeEligibilityFlags = {
  bookMapUserSubmissionsEnabled: false,
  readerMapCoarsenessMode: "city",
  readerMapExtraTrustRequired: false,
  readerMapMinAge: null,
  publicMeetupWhoCanCreate: "home_only",
  publicMeetupPreapproval: true,
  videoProviderDefault: "external",
  readingDnaRecalcHours: 24,
  homeBetaAutoEnroll: false,
};

export function parseHomeEligibilityFlags(
  rows: ReadonlyArray<{ key: string; value: unknown }> | null | undefined
): HomeEligibilityFlags {
  const map = new Map((rows ?? []).map((row) => [row.key, row.value]));
  const coarseness = map.get("reader_map_coarseness_mode");
  const who = map.get("public_meetup_who_can_create");
  const video = map.get("video_provider_default");
  const minAge = map.get("reader_map_min_age");
  const recalc = map.get("reading_dna_recalc_hours");

  return {
    bookMapUserSubmissionsEnabled: map.get("book_map_user_submissions_enabled") === true,
    readerMapCoarsenessMode:
      coarseness === "neighborhood" || coarseness === "randomized" || coarseness === "city"
        ? coarseness
        : DEFAULT_HOME_ELIGIBILITY_FLAGS.readerMapCoarsenessMode,
    readerMapExtraTrustRequired: map.get("reader_map_extra_trust_required") === true,
    readerMapMinAge:
      typeof minAge === "number" && Number.isFinite(minAge) && minAge > 0 ? minAge : null,
    publicMeetupWhoCanCreate:
      who === "staff_only" || who === "plus_and_home" || who === "home_only"
        ? who
        : DEFAULT_HOME_ELIGIBILITY_FLAGS.publicMeetupWhoCanCreate,
    publicMeetupPreapproval: map.get("public_meetup_preapproval") !== false,
    videoProviderDefault: video === "unset" ? "unset" : "external",
    readingDnaRecalcHours:
      typeof recalc === "number" && recalc > 0
        ? recalc
        : DEFAULT_HOME_ELIGIBILITY_FLAGS.readingDnaRecalcHours,
    homeBetaAutoEnroll: map.get("home_beta_auto_enroll") === true,
  };
}

export function resolveAgeEligibility(input: {
  birthYear: number | null | undefined;
  nowYear?: number;
  minAge: number | null;
}): AgeEligibilityStatus {
  if (input.minAge == null || !Number.isFinite(input.minAge)) {
    return input.birthYear == null ? "unknown" : "unknown";
  }
  if (input.birthYear == null || !Number.isFinite(input.birthYear)) return "unknown";
  const nowYear = input.nowYear ?? new Date().getUTCFullYear();
  const age = nowYear - input.birthYear;
  if (age < input.minAge) return "under_minimum";
  return "eligible";
}

/**
 * Nearby-reader / public meetup social is blocked when age is unknown
 * or under a configured minimum. Do not invent that minimum.
 */
export function canUseReaderMapSocial(input: {
  hasHome: boolean;
  optedIn: boolean;
  discoverable?: boolean;
  ageStatus: AgeEligibilityStatus;
  extraTrustOk?: boolean;
  extraTrustRequired?: boolean;
}): boolean {
  if (!input.hasHome || !input.optedIn) return false;
  if (input.discoverable === false) return false;
  if (input.ageStatus !== "eligible") return false;
  if (input.extraTrustRequired && !input.extraTrustOk) return false;
  return true;
}

export function canCreatePublicMeetup(input: {
  hasHome: boolean;
  hasPlus: boolean;
  isStaff?: boolean;
  ageStatus: AgeEligibilityStatus;
  policy: PublicMeetupCreatorPolicy;
}): boolean {
  if (input.ageStatus !== "eligible") return false;
  if (input.policy === "staff_only") return Boolean(input.isStaff);
  if (input.policy === "plus_and_home") return input.hasPlus || input.hasHome;
  return input.hasHome;
}

export function shouldAutoEnrollBeta(flagEnabled: boolean, autoEnroll: boolean): boolean {
  return flagEnabled && autoEnroll;
}

export function shouldRecalcReadingDna(
  computedAt: string | Date | null | undefined,
  recalcHours = DEFAULT_HOME_ELIGIBILITY_FLAGS.readingDnaRecalcHours,
  now = Date.now()
): boolean {
  if (!computedAt) return true;
  const at = typeof computedAt === "string" ? new Date(computedAt).getTime() : computedAt.getTime();
  if (!Number.isFinite(at)) return true;
  return now - at >= recalcHours * 60 * 60 * 1000;
}
