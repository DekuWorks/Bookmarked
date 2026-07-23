/**
 * Branded Open Graph share card: book cover (optional) + footer with B logo and tagline.
 * Public GET — used as og:image for link previews (iMessage, Slack, etc.).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const SITE_ORIGIN = "https://bookmarked.online";
const WIDTH = 1200;
const HEIGHT = 630;
const FOOTER_H = 120;
const FOOTER_COLOR = 0x5c4d6fff;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

async function loadImage(url: string): Promise<Image | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    return await Image.decode(bytes);
  } catch {
    return null;
  }
}

function fill(image: Image, color: number): void {
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      image.setPixelAt(x + 1, y + 1, color);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
  }

  const coverParam = new URL(req.url).searchParams.get("cover");
  const contentH = HEIGHT - FOOTER_H;

  const canvas = new Image(WIDTH, HEIGHT);
  fill(canvas, FOOTER_COLOR);

  const top = new Image(WIDTH, contentH);

  if (coverParam) {
    const cover = await loadImage(coverParam);
    if (cover) {
      const scale = Math.max(WIDTH / cover.width, contentH / cover.height);
      const w = Math.round(cover.width * scale);
      const h = Math.round(cover.height * scale);
      cover.resize(w, h);
      const x = Math.round((WIDTH - w) / 2);
      const y = Math.round((contentH - h) / 2);
      top.composite(cover, x, y);
    } else {
      fill(top, 0xd8c7ecff);
    }
  } else {
    fill(top, 0xd8c7ecff);
    const heroLogo = await loadImage(`${SITE_ORIGIN}/logo-mark.png`);
    if (heroLogo) {
      heroLogo.resize(220, 220);
      top.composite(heroLogo, Math.round((WIDTH - 220) / 2), Math.round((contentH - 220) / 2) - 20);
    }
  }

  canvas.composite(top, 0, 0);

  const footer = new Image(WIDTH, FOOTER_H);
  fill(footer, FOOTER_COLOR);

  const logo = await loadImage(`${SITE_ORIGIN}/logo-mark.png`);
  if (logo) {
    logo.resize(72, 72);
    footer.composite(logo, 40, Math.round((FOOTER_H - 72) / 2));
  }

  const footerText = await loadImage(`${SITE_ORIGIN}/images/og-footer-text.png`);
  if (footerText) {
    footer.composite(footerText, 132, 18);
  }

  canvas.composite(footer, 0, contentH);

  const png = await canvas.encode();

  return new Response(png, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
});
