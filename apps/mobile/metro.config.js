const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Shell/dotenv secret files are not JS modules. Keep them out of Metro's
// module graph so a stray resolve (or watcher edge case) cannot TransformError.
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
      ? [existingBlockList]
      : []),
  /\.env\.asc\.local$/,
  // Custom local secret dotenv files (not standard Expo .env / .env.local).
  /[/\\]\.env\.(?!(?:development|production|test)\.local$)[^./\\]+\.local$/,
  /[/\\]\.eas[/\\]\.env/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
