import {
  IAP_PREMIUM_MONTHLY_IOS_PRODUCTION,
  IAP_PREMIUM_MONTHLY_IOS_SANDBOX,
  resolveIosPremiumProductId,
} from "../../../../packages/utils/iap";

const productOverride = process.env.EXPO_PUBLIC_APPLE_PREMIUM_PRODUCT_ID?.trim() || null;
const sandboxOverride = process.env.EXPO_PUBLIC_APPLE_PREMIUM_SANDBOX_PRODUCT_ID?.trim() || null;

/** True for Expo Go and dev client builds — use sandbox SKU when overridden. */
const useSandboxSku = process.env.EXPO_PUBLIC_APPLE_IAP_USE_SANDBOX === "1";

/** App Store subscription product ID for the current build. */
export const APPLE_PREMIUM_PRODUCT_ID = resolveIosPremiumProductId({
  useSandbox: useSandboxSku,
  override: useSandboxSku ? sandboxOverride ?? productOverride : productOverride,
});

export const APPLE_PREMIUM_PRODUCT_IDS = [APPLE_PREMIUM_PRODUCT_ID] as const;

export {
  IAP_PREMIUM_MONTHLY_IOS_PRODUCTION,
  IAP_PREMIUM_MONTHLY_IOS_SANDBOX,
};
