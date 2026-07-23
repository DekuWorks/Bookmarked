/**
 * Branded Open Graph share card: book cover (optional) + dark footer with B logo.
 * Public GET — used as og:image for link previews (iMessage, Slack, etc.).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const WIDTH = 1200;
const HEIGHT = 630;
const FOOTER_H = 130;
const LOGO_URL = "https://bookmarked.online/logo-mark.png";

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
  canvas.fill(0x261c34ff);

  if (coverParam) {
    const cover = await loadImage(coverParam);
    if (cover) {
      const scale = Math.max(WIDTH / cover.width, contentH / cover.height);
      const w = Math.round(cover.width * scale);
      const h = Math.round(cover.height * scale);
      cover.resize(w, h);
      const x = Math.round((WIDTH - w) / 2);
      const y = Math.round((contentH - h) / 2);
      canvas.composite(cover, x, y);
    }
  }

  const footer = new Image(WIDTH, FOOTER_H);
  footer.fill(0x2a2a2aff);
  canvas.composite(footer, 0, contentH);

  const logo = await loadImage(LOGO_URL);
  if (logo) {
    logo.resize(56, 56);
    canvas.composite(logo, 40, contentH + Math.round((FOOTER_H - 56) / 2));
  }

  const png = await canvas.encode();

  return new Response(png, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
});
