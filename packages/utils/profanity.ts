/**
 * Lightweight English profanity detection for client-side blur UX.
 * Word-boundary matching + basic leetspeak normalization. No external API.
 *
 * Keep in sync with: packages/utils/profanity.ts (canonical) and the sibling app copy.
 */

const CURSE_WORDS = [
  "asshole",
  "assholes",
  "bastard",
  "bastards",
  "bitch",
  "bitches",
  "bitchy",
  "bollocks",
  "bullshit",
  "cock",
  "cocks",
  "crap",
  "crappy",
  "cunt",
  "cunts",
  "damn",
  "dammit",
  "damned",
  "dick",
  "dickhead",
  "dicks",
  "dumbass",
  "faggot",
  "faggots",
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
  "nigger",
  "niggers",
  "piss",
  "pissed",
  "pissing",
  "prick",
  "pricks",
  "pussy",
  "pussies",
  "shit",
  "shits",
  "shitting",
  "shitty",
  "slut",
  "sluts",
  "twat",
  "wanker",
  "whore",
  "whores",
] as const;

const WORD_SET = new Set<string>(CURSE_WORDS);

const LEET: Record<string, string> = {
  a: "[a4@]",
  e: "[e3]",
  i: "[i1!|]",
  o: "[o0]",
  s: "[s5$]",
  t: "[t7]",
};

/** Escape a string for use inside a RegExp character class / alternation. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build a pattern that allows separators (f*ck) and basic leetspeak (sh1t). */
function wordToFlexiblePattern(word: string): string {
  return word
    .split("")
    .map((char, index) => {
      const classPart = LEET[char] ?? escapeRegExp(char);
      return index === 0 ? classPart : `[^a-z0-9]*${classPart}`;
    })
    .join("");
}

/**
 * Normalize leetspeak / obfuscation so tokens can be checked against the word set.
 */
export function normalizeProfanityText(text: string): string {
  return text
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/@/g, "a")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/7/g, "t")
    .replace(/\*/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

const BOUNDARY_PATTERN = new RegExp(
  `(?:^|[^a-z0-9])(?:${CURSE_WORDS.map(escapeRegExp).join("|")})(?:[^a-z0-9]|$)`,
  "i"
);

const FLEXIBLE_PATTERN = new RegExp(
  `(?:^|[^a-z0-9])(?:${CURSE_WORDS.map(wordToFlexiblePattern).join("|")})(?:[^a-z0-9]|$)`,
  "i"
);

/** True if `text` contains at least one curated curse word (or simple leetspeak variant). */
export function containsProfanity(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;

  if (BOUNDARY_PATTERN.test(text) || FLEXIBLE_PATTERN.test(text)) return true;

  const normalized = normalizeProfanityText(text);
  if (!normalized) return false;

  for (const token of normalized.split(/\s+/)) {
    if (WORD_SET.has(token)) return true;
  }

  return false;
}

export { CURSE_WORDS };
