/**
 * Layered UGC moderation. Local rules run everywhere; a provider (OpenAI) is
 * required on the server before publish. Fail closed when the provider is down.
 */

export const MODERATION_CONTENT_TYPES = [
  "FEED_POST",
  "COMMENT",
  "PROFILE_BIO",
  "BOOK_CLUB_NAME",
  "BOOK_CLUB_DISCUSSION",
  "BOOK_CLUB_REPLY",
  "FUTURE",
] as const;

export type ModerationContentType = (typeof MODERATION_CONTENT_TYPES)[number];

export const MODERATION_STATUSES = ["allow", "warn", "block"] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const MODERATION_CATEGORIES = [
  "hate",
  "discrimination",
  "harassment",
  "threats",
  "sexual_exploitation",
  "severe_abuse",
  "mild_profanity",
  "guidelines",
] as const;

export type ModerationCategory = (typeof MODERATION_CATEGORIES)[number];

export const MODERATION_VERSION = "2026.09.1";

export const MODERATION_BLOCK_MESSAGE =
  "This content violates Bookmarked’s Community Guidelines and must be edited before it can be published.";

export const MODERATION_UNAVAILABLE_MESSAGE =
  "Content review is temporarily unavailable. Please try again.";

export type ModerationSpanTreatment = "blur_until_reveal";

export type ModerationSpan = {
  start: number;
  end: number;
  category: ModerationCategory;
  severity: "warn" | "block";
  treatment: ModerationSpanTreatment;
};

export type ModerationReasonCode =
  | "ALLOW"
  | "MILD_PROFANITY"
  | "HATE"
  | "DISCRIMINATION"
  | "HARASSMENT"
  | "THREATS"
  | "SEXUAL_EXPLOITATION"
  | "SEVERE_ABUSE"
  | "GUIDELINES"
  | "PROVIDER_UNAVAILABLE";

export type ModerationResult = {
  status: ModerationStatus;
  categories: ModerationCategory[];
  spans: ModerationSpan[];
  reasonCode: ModerationReasonCode;
  userMessage: string | null;
  moderationVersion: string;
  unavailable?: boolean;
};

export type ModerationMeta = {
  status: ModerationStatus;
  categories: ModerationCategory[];
  spans: ModerationSpan[];
  reasonCode: ModerationReasonCode;
  moderationVersion: string;
};

export type ProviderModerationResult = {
  flagged: boolean;
  categories: string[];
};

export type ModerationProvider = {
  moderate(text: string): Promise<ProviderModerationResult>;
};

export type ModerateContentInput = {
  text: string;
  contentType: ModerationContentType;
  userId?: string | null;
  context?: Record<string, unknown>;
  provider?: ModerationProvider | null;
};

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u2060\u180E\u00AD]/g;
const COMBINING = /[\u0300-\u036f]/g;

const MILD_PROFANITY = [
  "asshole",
  "assholes",
  "bastard",
  "bastards",
  "bitch",
  "bitches",
  "bitchy",
  "bollocks",
  "bullshit",
  "crap",
  "crappy",
  "damn",
  "dammit",
  "damned",
  "dick",
  "dickhead",
  "dicks",
  "dumbass",
  "fuck",
  "fucked",
  "fucker",
  "fuckers",
  "fuckin",
  "fucking",
  "fucks",
  "goddamn",
  "jackass",
  "motherfucker",
  "motherfuckers",
  "motherfucking",
  "piss",
  "pissed",
  "pissing",
  "prick",
  "pricks",
  "shit",
  "shits",
  "shitting",
  "shitty",
  "twat",
  "wanker",
] as const;

const HATE_SLURS = [
  "nigger",
  "niggers",
  "faggot",
  "faggots",
  "kike",
  "kikes",
  "spic",
  "spics",
  "wetback",
  "chink",
  "chinks",
  "gook",
  "tranny",
  "trannies",
  "retard",
  "retards",
  "retarded",
] as const;

const SEXUAL_EXPLOITATION = [
  "child porn",
  "childporn",
  "child rape",
  "childrape",
  "csam",
  "loli",
  "lolita",
  "underage sex",
  "underage porn",
] as const;

const THREAT_PHRASES = [
  "i will kill you",
  "i'll kill you",
  "im going to kill you",
  "i am going to kill you",
  "i will murder you",
  "i'll murder you",
  "kill yourself",
  "kys now",
  "i will rape you",
  "i'll rape you",
  "bomb your",
  "shoot up",
] as const;

const HARASSMENT_PHRASES = [
  "kill yourself",
  "kys",
  "go die",
  "nobody likes you",
  "you should die",
  "hope you die",
  "doxx you",
  "dox you",
] as const;

const LEET: Record<string, string> = {
  a: "[a4@]",
  e: "[e3]",
  i: "[i1!|]",
  o: "[o0]",
  s: "[s5$]",
  t: "[t7]",
};

const PROVIDER_BLOCK_CATEGORIES = new Set([
  "hate",
  "hate/threatening",
  "harassment",
  "harassment/threatening",
  "sexual",
  "sexual/minors",
  "violence",
  "violence/graphic",
  "illicit/violent",
]);

export function isModerationContentType(value: unknown): value is ModerationContentType {
  return (
    typeof value === "string" &&
    (MODERATION_CONTENT_TYPES as readonly string[]).includes(value)
  );
}

/** Defeat whitespace / zero-width / compatibility Unicode tricks. */
export function normalizeForModeration(text: string): string {
  return text
    .normalize("NFKC")
    .replace(ZERO_WIDTH, "")
    .replace(COMBINING, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeForMatching(text: string): string {
  return normalizeForModeration(text)
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/@/g, "a")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/7/g, "t")
    .replace(/\*/g, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordToFlexiblePattern(word: string): string {
  return word
    .split("")
    .map((char, index) => {
      const classPart = LEET[char] ?? escapeRegExp(char);
      return index === 0 ? classPart : `[^a-z0-9]*${classPart}`;
    })
    .join("");
}

function findWordSpans(
  text: string,
  words: readonly string[],
  category: ModerationCategory,
  severity: "warn" | "block"
): ModerationSpan[] {
  if (!text || words.length === 0) return [];
  const pattern = new RegExp(
    `(?<![a-z0-9])(?:${words.map(wordToFlexiblePattern).join("|")})(?![a-z0-9])`,
    "gi"
  );
  const spans: ModerationSpan[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    spans.push({
      start: match.index,
      end: match.index + match[0].length,
      category,
      severity,
      treatment: "blur_until_reveal",
    });
    if (match[0].length === 0) pattern.lastIndex += 1;
  }
  return mergeOverlappingSpans(spans);
}

function findPhraseSpans(
  text: string,
  phrases: readonly string[],
  category: ModerationCategory,
  severity: "warn" | "block"
): ModerationSpan[] {
  const haystack = normalizeForMatching(text);
  const original = text;
  const spans: ModerationSpan[] = [];

  for (const phrase of phrases) {
    const needle = normalizeForMatching(phrase);
    if (!needle) continue;
    let from = 0;
    while (from <= haystack.length) {
      const idx = haystack.indexOf(needle, from);
      if (idx === -1) break;
      const approxEnd = Math.min(original.length, idx + phrase.length + 8);
      spans.push({
        start: Math.min(idx, original.length),
        end: Math.max(Math.min(idx, original.length) + 1, Math.min(approxEnd, original.length)),
        category,
        severity,
        treatment: "blur_until_reveal",
      });
      from = idx + needle.length;
    }
  }

  return mergeOverlappingSpans(spans);
}

export function mergeOverlappingSpans(spans: ModerationSpan[]): ModerationSpan[] {
  if (spans.length <= 1) return [...spans].sort((a, b) => a.start - b.start);
  const sorted = [...spans].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: ModerationSpan[] = [];
  for (const span of sorted) {
    const last = merged[merged.length - 1];
    if (!last || span.start > last.end) {
      merged.push({ ...span });
      continue;
    }
    last.end = Math.max(last.end, span.end);
    if (span.severity === "block") last.severity = "block";
    if (span.category !== last.category && span.severity === "block") {
      last.category = span.category;
    }
  }
  return merged;
}

function containsNormalizedPhrase(text: string, phrases: readonly string[]): boolean {
  const haystack = normalizeForMatching(text);
  return phrases.some((phrase) => haystack.includes(normalizeForMatching(phrase)));
}

function uniqueCategories(categories: ModerationCategory[]): ModerationCategory[] {
  return [...new Set(categories)];
}

function allowResult(): ModerationResult {
  return {
    status: "allow",
    categories: [],
    spans: [],
    reasonCode: "ALLOW",
    userMessage: null,
    moderationVersion: MODERATION_VERSION,
  };
}

function blockResult(
  categories: ModerationCategory[],
  reasonCode: ModerationReasonCode,
  spans: ModerationSpan[] = []
): ModerationResult {
  return {
    status: "block",
    categories: uniqueCategories(categories),
    spans,
    reasonCode,
    userMessage: MODERATION_BLOCK_MESSAGE,
    moderationVersion: MODERATION_VERSION,
  };
}

function warnResult(spans: ModerationSpan[]): ModerationResult {
  return {
    status: "warn",
    categories: ["mild_profanity"],
    spans,
    reasonCode: "MILD_PROFANITY",
    userMessage: null,
    moderationVersion: MODERATION_VERSION,
  };
}

function unavailableResult(): ModerationResult {
  return {
    status: "block",
    categories: [],
    spans: [],
    reasonCode: "PROVIDER_UNAVAILABLE",
    userMessage: MODERATION_UNAVAILABLE_MESSAGE,
    moderationVersion: MODERATION_VERSION,
    unavailable: true,
  };
}

function isStrictContentType(contentType: ModerationContentType): boolean {
  return contentType === "BOOK_CLUB_NAME";
}

export function classifyLocalContent(
  text: string,
  contentType: ModerationContentType
): ModerationResult {
  const normalized = normalizeForModeration(text);
  if (!normalized) return allowResult();

  if (containsNormalizedPhrase(normalized, SEXUAL_EXPLOITATION)) {
    return blockResult(
      ["sexual_exploitation"],
      "SEXUAL_EXPLOITATION",
      findPhraseSpans(text, SEXUAL_EXPLOITATION, "sexual_exploitation", "block")
    );
  }

  const hateSpans = findWordSpans(text, HATE_SLURS, "hate", "block");
  if (hateSpans.length > 0 || containsNormalizedPhrase(normalized, HATE_SLURS)) {
    return blockResult(["hate", "discrimination"], "HATE", hateSpans);
  }

  if (containsNormalizedPhrase(normalized, THREAT_PHRASES)) {
    return blockResult(
      ["threats"],
      "THREATS",
      findPhraseSpans(text, THREAT_PHRASES, "threats", "block")
    );
  }

  if (containsNormalizedPhrase(normalized, HARASSMENT_PHRASES)) {
    return blockResult(
      ["harassment"],
      "HARASSMENT",
      findPhraseSpans(text, HARASSMENT_PHRASES, "harassment", "block")
    );
  }

  const mildSpans = findWordSpans(text, MILD_PROFANITY, "mild_profanity", "warn");
  if (mildSpans.length > 0) {
    if (isStrictContentType(contentType)) {
      return blockResult(["guidelines"], "GUIDELINES", mildSpans);
    }
    return warnResult(mildSpans);
  }

  return allowResult();
}

function mapProviderCategories(categories: string[]): ModerationCategory[] {
  const mapped: ModerationCategory[] = [];
  for (const raw of categories) {
    const key = raw.toLowerCase();
    if (key === "hate" || key === "hate/threatening") mapped.push("hate");
    if (key === "harassment" || key === "harassment/threatening") mapped.push("harassment");
    if (key === "sexual/minors") mapped.push("sexual_exploitation");
    if (key === "sexual") mapped.push("severe_abuse");
    if (key === "violence" || key === "violence/graphic" || key === "illicit/violent") {
      mapped.push("threats");
    }
  }
  return uniqueCategories(mapped);
}

function providerReason(categories: ModerationCategory[]): ModerationReasonCode {
  if (categories.includes("sexual_exploitation")) return "SEXUAL_EXPLOITATION";
  if (categories.includes("hate") || categories.includes("discrimination")) return "HATE";
  if (categories.includes("threats")) return "THREATS";
  if (categories.includes("harassment")) return "HARASSMENT";
  if (categories.includes("severe_abuse")) return "SEVERE_ABUSE";
  return "GUIDELINES";
}

export function combineModerationResults(results: ModerationResult[]): ModerationResult {
  if (results.length === 0) return allowResult();
  const unavailable = results.find((row) => row.unavailable);
  if (unavailable) return unavailable;
  const blocked = results.find((row) => row.status === "block");
  if (blocked) {
    return {
      ...blocked,
      categories: uniqueCategories(results.flatMap((row) => row.categories)),
      spans: mergeOverlappingSpans(results.flatMap((row) => row.spans)),
    };
  }
  const warned = results.filter((row) => row.status === "warn");
  if (warned.length > 0) {
    return warnResult(mergeOverlappingSpans(warned.flatMap((row) => row.spans)));
  }
  return allowResult();
}

export async function moderateContent(input: ModerateContentInput): Promise<ModerationResult> {
  const local = classifyLocalContent(input.text, input.contentType);

  if (!input.provider) {
    return local;
  }

  let providerResult: ProviderModerationResult;
  try {
    providerResult = await input.provider.moderate(input.text);
  } catch {
    return unavailableResult();
  }

  if (providerResult.flagged) {
    const flagged = providerResult.categories.filter((category) =>
      PROVIDER_BLOCK_CATEGORIES.has(category.toLowerCase())
    );
    if (flagged.length > 0) {
      const categories = mapProviderCategories(flagged);
      return blockResult(categories.length ? categories : ["guidelines"], providerReason(categories));
    }
  }

  if (local.status === "block") return local;
  if (local.status === "warn" && isStrictContentType(input.contentType)) {
    return blockResult(["guidelines"], "GUIDELINES", local.spans);
  }
  return local;
}

export function toModerationMeta(result: ModerationResult): ModerationMeta {
  return {
    status: result.status === "block" ? "warn" : result.status,
    categories: result.categories,
    spans: result.spans,
    reasonCode: result.reasonCode,
    moderationVersion: result.moderationVersion,
  };
}

export function parseModerationMeta(value: unknown): ModerationMeta | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<ModerationMeta>;
  if (row.status !== "allow" && row.status !== "warn" && row.status !== "block") return null;
  if (!Array.isArray(row.spans)) return null;
  const spans = row.spans.filter((span): span is ModerationSpan => {
    return (
      Boolean(span) &&
      typeof span.start === "number" &&
      typeof span.end === "number" &&
      span.end > span.start
    );
  });
  return {
    status: row.status,
    categories: Array.isArray(row.categories)
      ? row.categories.filter((item): item is ModerationCategory =>
          (MODERATION_CATEGORIES as readonly string[]).includes(item)
        )
      : [],
    spans,
    reasonCode: typeof row.reasonCode === "string" ? (row.reasonCode as ModerationReasonCode) : "ALLOW",
    moderationVersion:
      typeof row.moderationVersion === "string" ? row.moderationVersion : MODERATION_VERSION,
  };
}

/** Prefer stored spans; otherwise detect mild profanity locally for legacy rows. */
export function resolveWarnSpans(text: string, meta?: ModerationMeta | null): ModerationSpan[] {
  if (meta?.spans?.length) {
    return mergeOverlappingSpans(
      meta.spans.filter((span) => span.severity === "warn" || meta.status === "warn")
    );
  }
  return classifyLocalContent(text, "FEED_POST").status === "warn"
    ? classifyLocalContent(text, "FEED_POST").spans
    : [];
}

export function splitTextBySpans(
  text: string,
  spans: ModerationSpan[]
): Array<{ text: string; span: ModerationSpan | null }> {
  const merged = mergeOverlappingSpans(spans).filter(
    (span) => span.start >= 0 && span.end <= text.length && span.end > span.start
  );
  if (merged.length === 0) return [{ text, span: null }];

  const parts: Array<{ text: string; span: ModerationSpan | null }> = [];
  let cursor = 0;
  for (const span of merged) {
    if (span.start > cursor) {
      parts.push({ text: text.slice(cursor, span.start), span: null });
    }
    parts.push({ text: text.slice(span.start, span.end), span });
    cursor = span.end;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), span: null });
  }
  return parts;
}

export function categoryLabel(category: ModerationCategory): string {
  switch (category) {
    case "hate":
    case "discrimination":
      return "Hate or discrimination";
    case "harassment":
      return "Harassment or bullying";
    case "threats":
      return "Threats or violence";
    case "sexual_exploitation":
    case "severe_abuse":
      return "Sexual or inappropriate content";
    case "mild_profanity":
      return "Vulgar language";
    default:
      return "Community Guidelines";
  }
}

export function blockMessageWithOptionalCategory(result: ModerationResult): string {
  const label = result.categories[0] ? categoryLabel(result.categories[0]) : null;
  if (!label || result.unavailable) return result.userMessage ?? MODERATION_BLOCK_MESSAGE;
  return `${MODERATION_BLOCK_MESSAGE} (${label})`;
}
