export type QuoteGraphicRenderInput = {
  quote: string;
  attribution?: string | null;
};

export function quoteGraphicCardCopy(input: QuoteGraphicRenderInput): {
  quote: string;
  attribution: string | null;
} {
  return {
    quote: input.quote.trim(),
    attribution: input.attribution?.trim() || null,
  };
}

/** Browser-only PNG renderer. Native uses the in-app card + optional image_url. */
export async function renderQuoteGraphicPng(
  input: QuoteGraphicRenderInput
): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  const { quote, attribution } = quoteGraphicCardCopy(input);
  if (!quote) return null;

  const width = 1080;
  const height = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#6B2D38");
  gradient.addColorStop(0.55, "#7A3D4A");
  gradient.addColorStop(1, "#C9A227");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "italic 56px Georgia, 'Times New Roman', serif";
  const lines = wrapCanvasText(ctx, `“${quote}”`, width - 160);
  let y = 280;
  for (const line of lines.slice(0, 12)) {
    ctx.fillText(line, 80, y);
    y += 74;
  }

  if (attribution) {
    ctx.font = "28px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillText(`— ${attribution}`, 80, Math.min(y + 48, height - 160));
  }

  ctx.font = "22px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.letterSpacing = "6px";
  ctx.fillText("BOOKMARKED", 80, height - 80);

  return await new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}
