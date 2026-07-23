/**
 * Process new brand assets from design source folder into web + mobile paths.
 *
 * Source folder (override with BRAND_SRC env):
 *   11.png       → bookmark ribbon overlay (saved-book badge)
 *   NEW LOGO.png → full BOOKMARKED wordmark
 */
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "../../..");
const srcDir =
  process.env.BRAND_SRC ?? "/Users/marcusbrown/Downloads/NEW LOGO & BOOKMARK";

const BOOKMARK_SRC = path.join(srcDir, "11.png");
const LOGO_SRC = path.join(srcDir, "NEW LOGO.png");

const webPublic = path.join(repoRoot, "apps/web/public");
const mobileBrand = path.join(repoRoot, "apps/mobile/assets/brand");

const paths = {
  webBookmark: path.join(webPublic, "images/bookmark-ribbon.png"),
  webBookmarkSource: path.join(webPublic, "images/source/bookmark-ribbon.png"),
  webLogo: path.join(webPublic, "logo.png"),
  webLogoMark: path.join(webPublic, "logo-mark.png"),
  webLogoCircle: path.join(webPublic, "logo-circle.png"),
  webIcon: path.join(webPublic, "icon.png"),
  webFavicon32: path.join(webPublic, "favicon-32x32.png"),
  webAppleTouch: path.join(webPublic, "apple-touch-icon.png"),
  webBrandSource: path.join(webPublic, "assets/brand/source"),
  mobileBookmark: path.join(mobileBrand, "bookmark-ribbon.png"),
  mobileBookmarkSource: path.join(mobileBrand, "source/bookmark-ribbon.png"),
  mobileLogo: path.join(mobileBrand, "logo.png"),
  mobileLogoMark: path.join(mobileBrand, "logo-mark.png"),
  mobileLogoCircle: path.join(mobileBrand, "logo-circle.png"),
  mobileIcon: path.join(mobileBrand, "icon.png"),
  mobileAppleTouch: path.join(mobileBrand, "apple-touch-icon.png"),
  mobileBrandSource: path.join(mobileBrand, "source"),
};

async function ensureDirs() {
  await mkdir(path.dirname(paths.webBookmark), { recursive: true });
  await mkdir(path.dirname(paths.webBookmarkSource), { recursive: true });
  await mkdir(paths.webBrandSource, { recursive: true });
  await mkdir(paths.mobileBrandSource, { recursive: true });
}

async function processBookmarkRibbon() {
  await copyFile(BOOKMARK_SRC, paths.webBookmarkSource);
  await copyFile(BOOKMARK_SRC, paths.mobileBookmarkSource);

  const trimmed = await sharp(BOOKMARK_SRC).trim().png().toBuffer();
  const { width, height } = await sharp(trimmed).metadata();

  const optimized = await sharp(trimmed)
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  await writeFile(paths.webBookmark, optimized);
  await writeFile(paths.mobileBookmark, optimized);

  return { width, height };
}

async function processWordmark() {
  await copyFile(LOGO_SRC, path.join(paths.webBrandSource, "logo.png"));
  await copyFile(LOGO_SRC, path.join(paths.mobileBrandSource, "logo.png"));

  const trimmed = await sharp(LOGO_SRC).trim().png().toBuffer();
  const { width, height } = await sharp(trimmed).metadata();

  const wordmark = await sharp(trimmed)
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  await writeFile(paths.webLogo, wordmark);
  await writeFile(paths.mobileLogo, wordmark);

  return { width, height };
}

async function processLogoMark() {
  const trimmed = await sharp(BOOKMARK_SRC).trim().png().toBuffer();
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

async function processIcons() {
  const sizes = [
    { out: paths.webIcon, size: 192 },
    { out: paths.webFavicon32, size: 32 },
    { out: paths.webAppleTouch, size: 180 },
    { out: paths.mobileIcon, size: 1024 },
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
      .composite([
        {
          input: mark,
          left: padding,
          top: padding,
        },
      ])
      .png({ compressionLevel: 9 })
      .toBuffer();

    await writeFile(out, icon);
  }

  // favicon.ico from 32px PNG (sharp can't write ico; copy png as fallback reference)
  await copyFile(paths.webFavicon32, path.join(webPublic, "favicon-temp-32.png"));
}

await ensureDirs();
const bookmark = await processBookmarkRibbon();
const wordmark = await processWordmark();
await processLogoMark();
await processLogoCircle();
await processIcons();

console.log(
  JSON.stringify(
    {
      bookmarkAspect: bookmark.width / bookmark.height,
      wordmarkAspect: wordmark.width / wordmark.height,
      bookmark: `${bookmark.width}x${bookmark.height}`,
      wordmark: `${wordmark.width}x${wordmark.height}`,
    },
    null,
    2
  )
);
console.log("Brand assets processed for web + mobile.");
