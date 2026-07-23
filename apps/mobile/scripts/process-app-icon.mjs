/**
 * Re-process app icon to eliminate white seams on iOS home screen.
 *
 * Source: design-assets/approved/app-icon.png
 * Strategy: flood near-white padding with sampled lavender, scale ~108%,
 *           flatten to 1024×1024 so edges are solid lavender (no white corners).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "../../..");
const require = createRequire(import.meta.url);
const sharp = require(path.join(repoRoot, "apps/web/node_modules/sharp"));

const SRC = path.join(repoRoot, "design-assets/approved/app-icon.png");
const CANVAS = 1024;
const SCALE_PERCENT = 108;
const LAVENDER = { r: 234, g: 220, b: 244 }; // sampled from icon edge
const LAVENDER_HEX = "#EADCF4";

const outputs = {
  approved: path.join(repoRoot, "design-assets/approved/app-icon.png"),
  mobileBrandIcon: path.join(repoRoot, "apps/mobile/assets/brand/icon.png"),
  mobileIcon: path.join(repoRoot, "apps/mobile/assets/icon.png"),
  mobileAdaptive: path.join(repoRoot, "apps/mobile/assets/adaptive-icon.png"),
  mobileLogoCircle: path.join(repoRoot, "apps/mobile/assets/brand/logo-circle.png"),
  mobileAppleTouch: path.join(repoRoot, "apps/mobile/assets/brand/apple-touch-icon.png"),
  mobileFavicon: path.join(repoRoot, "apps/mobile/assets/favicon.png"),
  mobileSplashIcon: path.join(repoRoot, "apps/mobile/assets/splash-icon.png"),
  webIcon: path.join(repoRoot, "apps/web/public/icon.png"),
  webIcon192: path.join(repoRoot, "apps/web/public/icon-192.png"),
  webLogoCircle: path.join(repoRoot, "apps/web/public/logo-circle.png"),
  webAppleTouch: path.join(repoRoot, "apps/web/public/apple-touch-icon.png"),
  webFavicon32: path.join(repoRoot, "apps/web/public/favicon-32x32.png"),
};

async function buildFullBleedIcon() {
  const meta = await sharp(SRC).metadata();
  const tmpOut = path.join(repoRoot, ".tmp-app-icon-fullbleed.png");

  await execFileAsync("magick", [
    SRC,
    "-fuzz",
    "8%",
    "-fill",
    LAVENDER_HEX,
    "-opaque",
    "white",
    "-resize",
    `${SCALE_PERCENT}%`,
    "-background",
    LAVENDER_HEX,
    "-gravity",
    "center",
    "-extent",
    `${CANVAS}x${CANVAS}`,
    tmpOut,
  ]);

  const buffer = await sharp(tmpOut)
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  return { buffer, before: `${meta.width}x${meta.height}`, after: `${CANVAS}x${CANVAS}` };
}

async function resizeIcon(input, size) {
  return sharp(input)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
}

async function main() {
  const { buffer, before, after } = await buildFullBleedIcon();

  const fullBleedPaths = [
    outputs.approved,
    outputs.mobileBrandIcon,
    outputs.mobileIcon,
    outputs.mobileAdaptive,
    outputs.webIcon,
  ];

  for (const out of fullBleedPaths) {
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, buffer);
  }

  const logoCircle = await resizeIcon(buffer, 512);
  await writeFile(outputs.mobileLogoCircle, logoCircle);
  await writeFile(outputs.webLogoCircle, logoCircle);

  const appleTouch = await resizeIcon(buffer, 180);
  await writeFile(outputs.mobileAppleTouch, appleTouch);
  await writeFile(outputs.webAppleTouch, appleTouch);

  const favicon = await resizeIcon(buffer, 32);
  await writeFile(outputs.mobileFavicon, favicon);
  await writeFile(outputs.webFavicon32, favicon);

  const icon192 = await resizeIcon(buffer, 192);
  await writeFile(outputs.webIcon192, icon192);

  const splashIcon = await resizeIcon(buffer, 512);
  await writeFile(outputs.mobileSplashIcon, splashIcon);

  const corners = await sharp(buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data, info } = corners;
  const sample = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
  };

  console.log(
    JSON.stringify(
      {
        approach: `flatten white → scale ${SCALE_PERCENT}% → cover ${CANVAS}×${CANVAS}`,
        lavender: LAVENDER_HEX,
        beforeDimensions: before,
        afterDimensions: after,
        cornerPixels: {
          tl: sample(0, 0),
          tr: sample(info.width - 1, 0),
          bl: sample(0, info.height - 1),
          br: sample(info.width - 1, info.height - 1),
        },
        outputs: Object.keys(outputs).length,
      },
      null,
      2
    )
  );
}

await main();
