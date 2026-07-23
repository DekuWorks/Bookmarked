/**
 * Process approved brand assets into normalized web + mobile paths.
 *
 * Source (design-assets/approved/):
 *   NEW LOGO.png → bookmarked-logo-horizontal.png
 *   11.png       → bookmarked-saved-badge.png
 *
 * Also derives logo-mark, logo-circle, and favicon sizes from the saved badge.
 * Square app icon (icon.png) is NOT regenerated — keep existing unless a new
 * square source is added to design-assets/approved/.
 */
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "../../..");
const approvedDir =
  process.env.BRAND_SRC ?? path.join(repoRoot, "design-assets/approved");

const LOGO_SRC = path.join(approvedDir, "NEW LOGO.png");
const BADGE_SRC = path.join(approvedDir, "11.png");

const webPublic = path.join(repoRoot, "apps/web/public");
const mobileRoot = path.join(repoRoot, "apps/mobile/assets");
const webBranding = path.join(webPublic, "assets/branding");
const mobileBranding = path.join(mobileRoot, "branding");
const mobileBrand = path.join(mobileRoot, "brand");

const paths = {
  webLogoHorizontal: path.join(webBranding, "bookmarked-logo-horizontal.png"),
  webSavedBadge: path.join(webBranding, "bookmarked-saved-badge.png"),
  mobileLogoHorizontal: path.join(mobileBranding, "bookmarked-logo-horizontal.png"),
  mobileSavedBadge: path.join(mobileBranding, "bookmarked-saved-badge.png"),
  webLogoMark: path.join(webPublic, "logo-mark.png"),
  webLogoCircle: path.join(webPublic, "logo-circle.png"),
  webFavicon32: path.join(webPublic, "favicon-32x32.png"),
  webAppleTouch: path.join(webPublic, "apple-touch-icon.png"),
  mobileLogoMark: path.join(mobileBrand, "logo-mark.png"),
  mobileLogoCircle: path.join(mobileBrand, "logo-circle.png"),
  mobileAppleTouch: path.join(mobileBrand, "apple-touch-icon.png"),
};

async function ensureDirs() {
  await mkdir(webBranding, { recursive: true });
  await mkdir(mobileBranding, { recursive: true });
  await mkdir(mobileBrand, { recursive: true });
}

async function optimizePng(input) {
  const trimmed = await sharp(input).trim().png().toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const optimized = await sharp(trimmed)
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
  return { buffer: optimized, width, height };
}

async function processWordmark() {
  const { buffer, width, height } = await optimizePng(LOGO_SRC);
  await writeFile(paths.webLogoHorizontal, buffer);
  await writeFile(paths.mobileLogoHorizontal, buffer);
  return { width, height };
}

async function processSavedBadge() {
  const { buffer, width, height } = await optimizePng(BADGE_SRC);
  await writeFile(paths.webSavedBadge, buffer);
  await writeFile(paths.mobileSavedBadge, buffer);
  return { width, height };
}

async function processLogoMark() {
  const trimmed = await sharp(BADGE_SRC).trim().png().toBuffer();
  const mark = await sharp(trimmed)
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  await writeFile(paths.webLogoMark, mark);
  await writeFile(paths.mobileLogoMark, mark);
}

async function processLogoCircle() {
  const size = 512;
  const markSize = 360;
  const mark = await sharp(paths.webLogoMark)
    .resize(markSize, markSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const backgroundSvg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" rx="96" fill="#FCFAFE"/>
    </svg>`;

  const circle = await sharp(Buffer.from(backgroundSvg))
    .composite([
      {
        input: mark,
        left: Math.round((size - markSize) / 2),
        top: Math.round((size - markSize) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(paths.webLogoCircle, circle);
  await writeFile(paths.mobileLogoCircle, circle);
}

async function processTouchIcons() {
  const sizes = [
    { out: paths.webFavicon32, size: 32 },
    { out: paths.webAppleTouch, size: 180 },
    { out: paths.mobileAppleTouch, size: 180 },
  ];

  for (const { out, size } of sizes) {
    const padding = Math.round(size * 0.12);
    const markSize = size - padding * 2;
    const mark = await sharp(paths.webLogoMark)
      .resize(markSize, markSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const backgroundSvg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" rx="${Math.round(size * 0.2)}" fill="#FCFAFE"/>
      </svg>`;

    const icon = await sharp(Buffer.from(backgroundSvg))
      .composite([{ input: mark, left: padding, top: padding }])
      .png({ compressionLevel: 9 })
      .toBuffer();

    await writeFile(out, icon);
  }

}

await ensureDirs();
const wordmark = await processWordmark();
const badge = await processSavedBadge();
await processLogoMark();
await processLogoCircle();
await processTouchIcons();

console.log(
  JSON.stringify(
    {
      wordmark: `${wordmark.width}x${wordmark.height}`,
      wordmarkAspect: wordmark.width / wordmark.height,
      savedBadge: `${badge.width}x${badge.height}`,
      savedBadgeAspect: badge.width / badge.height,
    },
    null,
    2
  )
);
console.log("Brand assets processed for web + mobile.");
