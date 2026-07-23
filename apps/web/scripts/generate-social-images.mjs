/**
 * Generates branded social preview assets:
 * - public/og-share.png (1200×630 default Open Graph card)
 * - public/images/og-footer-text.png (footer text for share-preview edge function)
 * - public/apple-touch-icon.png (180×180 for link preview footers)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "../public");
const logoMarkPath = path.join(publicDir, "logo-mark.png");

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const FOOTER_HEIGHT = 120;
const FOOTER_BG = "#5C4D6F";
const TAGLINE = "Your reading life, beautifully organized";
const DOMAIN = "bookmarked.online";

async function generateOgShareImage() {
  const logoSize = 220;
  const logo = await sharp(logoMarkPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const topHeight = OG_HEIGHT - FOOTER_HEIGHT;
  const gradientSvg = `
    <svg width="${OG_WIDTH}" height="${topHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#D8C7EC"/>
          <stop offset="55%" stop-color="#F1D3C8"/>
          <stop offset="100%" stop-color="#F4EEFA"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
    </svg>`;

  const footerSvg = `
    <svg width="${OG_WIDTH}" height="${FOOTER_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${FOOTER_BG}"/>
      <text x="132" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="700" fill="#FFFFFF">${TAGLINE}</text>
      <text x="132" y="92" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#D8CFE8">${DOMAIN}</text>
    </svg>`;

  const footerLogoSize = 72;
  const footerLogo = await sharp(logoMarkPath)
    .resize(footerLogoSize, footerLogoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const footer = await sharp(Buffer.from(footerSvg))
    .composite([{ input: footerLogo, left: 40, top: Math.round((FOOTER_HEIGHT - footerLogoSize) / 2) }])
    .png()
    .toBuffer();

  const top = await sharp(Buffer.from(gradientSvg))
    .composite([
      {
        input: logo,
        left: Math.round((OG_WIDTH - logoSize) / 2),
        top: Math.round((topHeight - logoSize) / 2) - 20,
      },
    ])
    .png()
    .toBuffer();

  const output = await sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 4,
      background: { r: 92, g: 77, b: 111, alpha: 1 },
    },
  })
    .composite([
      { input: top, left: 0, top: 0 },
      { input: footer, left: 0, top: topHeight },
    ])
    .png()
    .toBuffer();

  await writeFile(path.join(publicDir, "og-share.png"), output);
}

async function generateOgFooterText() {
  const width = 900;
  const height = 80;
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="700" fill="#FFFFFF">${TAGLINE}</text>
      <text x="0" y="72" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#D8CFE8">${DOMAIN}</text>
    </svg>`;

  const output = await sharp(Buffer.from(svg)).png().toBuffer();
  const imagesDir = path.join(publicDir, "images");
  await mkdir(imagesDir, { recursive: true });
  await writeFile(path.join(imagesDir, "og-footer-text.png"), output);
}

async function generateAppleTouchIcon() {
  const size = 180;
  const logoSize = 132;
  const logo = await sharp(logoMarkPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const backgroundSvg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="36" fill="#FCFAFE"/>
      <rect x="3" y="3" width="${size - 6}" height="${size - 6}" rx="33" fill="none" stroke="#715B8B" stroke-width="3" opacity="0.25"/>
    </svg>`;

  const output = await sharp(Buffer.from(backgroundSvg))
    .composite([
      {
        input: logo,
        left: Math.round((size - logoSize) / 2),
        top: Math.round((size - logoSize) / 2),
      },
    ])
    .png()
    .toBuffer();

  await writeFile(path.join(publicDir, "apple-touch-icon.png"), output);
}

await mkdir(publicDir, { recursive: true });
await generateOgShareImage();
await generateOgFooterText();
await generateAppleTouchIcon();
console.log("Generated og-share.png, images/og-footer-text.png, and apple-touch-icon.png");
