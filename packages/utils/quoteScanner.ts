/**
 * Quote Scanner — Plus. Camera/library → OCR → editable preview.
 * Never auto-save. Do not retain photos after the scan returns.
 */

export const QUOTE_SCANNER_COPY = {
  title: "Quote Scanner",
  hint: "Scan a page, then edit the text before you save. Photos are not kept after the scan.",
  neverAutoSave: "Nothing is saved until you confirm.",
} as const;

export type QuoteScanPreview = {
  text: string;
  confidence: number | null;
  source: "camera" | "library";
};

export function normalizeScannedQuote(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function quoteScanIsSavable(text: string): boolean {
  return normalizeScannedQuote(text).length >= 8;
}
