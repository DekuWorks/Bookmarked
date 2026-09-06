/**
 * Affiliate / retailer links — disclosure + URL validation only.
 * No hardcoded partner IDs. Do not invent external checkout integrations.
 */

export const AFFILIATE_DISCLOSURE =
  "Some retailer links may be affiliate links. We may earn a small commission if you buy through them, at no extra cost to you.";

const BLOCKED_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

export type AffiliateUrlCheck =
  | { ok: true; url: string; host: string }
  | { ok: false; error: string };

export function validateAffiliateUrl(value: string | null | undefined): AffiliateUrlCheck {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { ok: false, error: "Enter a retailer URL." };
  if (BLOCKED_PROTOCOLS.test(trimmed)) {
    return { ok: false, error: "That link type is not allowed." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Enter a valid https URL." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Retailer links must use https." };
  }
  if (!parsed.hostname || parsed.hostname === "localhost") {
    return { ok: false, error: "Enter a public https URL." };
  }

  return { ok: true, url: parsed.toString(), host: parsed.hostname };
}

export function isbnSearchUrl(isbn: string | null | undefined): string | null {
  const digits = (isbn ?? "").replace(/[^0-9Xx]/g, "");
  if (digits.length < 10) return null;
  return `https://bookshop.org/beta-search?keywords=${encodeURIComponent(digits)}`;
}
