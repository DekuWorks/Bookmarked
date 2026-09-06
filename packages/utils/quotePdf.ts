/**
 * PDF export for the signed-in user's own favorite quotes.
 * Branding, wrap, multipage, unicode (UTF-16BE). No private fields.
 */

export type QuotePdfItem = {
  quote: string;
  note?: string | null;
  bookTitle?: string | null;
  bookAuthor?: string | null;
  pageNumber?: number | null;
  chapter?: string | null;
};

export type QuotePdfOptions = {
  ownerName?: string | null;
  generatedAt?: Date;
};

export const QUOTE_PDF_BRAND = "Bookmarked";
export const QUOTE_PDF_WRAP_WIDTH = 72;

export function wrapQuotePdfText(text: string, width = QUOTE_PDF_WRAP_WIDTH): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines: string[] = [];
  for (const paragraph of normalized.split("\n")) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    const words = paragraph.split(/\s+/);
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length <= width) {
        current = next;
        continue;
      }
      if (current) lines.push(current);
      if (word.length <= width) {
        current = word;
      } else {
        for (let i = 0; i < word.length; i += width) {
          const chunk = word.slice(i, i + width);
          if (chunk.length === width) lines.push(chunk);
          else current = chunk;
        }
      }
    }
    if (current) lines.push(current);
  }
  return lines.length > 0 ? lines : [""];
}

export function isOwnQuoteExport(ownerUserId: string, viewerUserId: string): boolean {
  return Boolean(ownerUserId) && ownerUserId === viewerUserId;
}

function pdfEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toUtf16BeHex(text: string): string {
  let hex = "FEFF";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code > 0xffff) {
      const extra = code - 0x10000;
      const high = 0xd800 + (extra >> 10);
      const low = 0xdc00 + (extra & 0x3ff);
      hex += high.toString(16).toUpperCase().padStart(4, "0");
      hex += low.toString(16).toUpperCase().padStart(4, "0");
    } else {
      hex += code.toString(16).toUpperCase().padStart(4, "0");
    }
  }
  return hex;
}

function pdfString(text: string): string {
  if (/^[\x20-\x7E]*$/.test(text)) return `(${pdfEscape(text)})`;
  return `<${toUtf16BeHex(text)}>`;
}

const LINES_PER_PAGE = 42;

export function buildQuotePdfDocument(quotes: QuotePdfItem[], options: QuotePdfOptions = {}): Uint8Array {
  const generatedAt = options.generatedAt ?? new Date();
  const dateLabel = generatedAt.toISOString().slice(0, 10);
  const owner = options.ownerName?.trim() || "Reader";

  const blocks: string[][] = [];
  blocks.push([
    QUOTE_PDF_BRAND,
    "Favorite quotes",
    `${owner} · ${dateLabel}`,
    "Your quotes only. Private fields are not included.",
    "",
  ]);

  quotes.forEach((item, index) => {
    const location = [
      item.bookTitle,
      item.bookAuthor,
      item.pageNumber != null ? `p. ${item.pageNumber}` : null,
      item.chapter,
    ]
      .filter(Boolean)
      .join(" · ");
    const body = wrapQuotePdfText(item.quote.trim() || " ");
    const note = item.note?.trim() ? wrapQuotePdfText(`Note: ${item.note.trim()}`) : [];
    blocks.push([`#${index + 1}`, ...body, location ? location : "", ...note, ""]);
  });

  if (quotes.length === 0) {
    blocks.push(["No favorite quotes to export.", ""]);
  }

  const allLines = blocks.flat();
  const pages: string[][] = [];
  for (let i = 0; i < allLines.length; i += LINES_PER_PAGE) {
    pages.push(allLines.slice(i, i + LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push([QUOTE_PDF_BRAND]);

  const objects: string[] = [];
  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");

  const pageIds = pages.map((_, index) => 3 + index * 2);
  const contentIds = pages.map((_, index) => 4 + index * 2);
  objects.push(
    `2 0 obj << /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >> endobj`
  );

  pages.forEach((lines, index) => {
    const pageId = pageIds[index]!;
    const contentId = contentIds[index]!;
    objects.push(
      `${pageId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${pageIds.length * 2 + 3} 0 R >> >> >> endobj`
    );
    const streamLines = ["BT", "/F1 12 Tf", "50 750 Td", "16 TL"];
    lines.forEach((line, lineIndex) => {
      if (lineIndex === 0 && index === 0) {
        streamLines.push("/F1 18 Tf", `${pdfString(line)} Tj`, "16 TL", "T*", "/F1 12 Tf");
      } else {
        streamLines.push(`${pdfString(line)} Tj`, "T*");
      }
    });
    streamLines.push(`(${QUOTE_PDF_BRAND} · ${index + 1}/${pages.length}) Tj`, "ET");
    const stream = streamLines.join("\n");
    objects.push(`${contentId} 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`);
  });

  const fontId = pageIds.length * 2 + 3;
  objects.push(`${fontId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`);

  let offset = 0;
  const header = "%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n";
  const offsets = [0];
  let body = header;
  offset = header.length;
  for (const object of objects) {
    offsets.push(offset);
    const chunk = `${object}\n`;
    body += chunk;
    offset += chunk.length;
  }
  const xrefStart = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  const pdf = body + xref + trailer;
  return new TextEncoder().encode(pdf);
}

export function quotePdfFilename(year = new Date().getFullYear()): string {
  return `bookmarked-quotes-${year}.pdf`;
}

export function quotesToShareText(quotes: QuotePdfItem[], ownerName?: string | null): string {
  const header = `${QUOTE_PDF_BRAND} · Favorite quotes${ownerName ? ` · ${ownerName}` : ""}`;
  const body = quotes
    .map((item, index) => {
      const location = [item.bookTitle, item.bookAuthor].filter(Boolean).join(" — ");
      return `${index + 1}. “${item.quote.trim()}”${location ? `\n${location}` : ""}`;
    })
    .join("\n\n");
  return `${header}\n\n${body || "No favorite quotes to export."}`;
}
