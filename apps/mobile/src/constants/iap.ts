import {
  IAP_HOME_YEARLY_IOS_PRODUCTION,
  IAP_PREMIUM_MONTHLY_IOS_PRODUCTION,
  IAP_PREMIUM_MONTHLY_IOS_SANDBOX,
  IAP_PREMIUM_YEARLY_IOS_PRODUCTION,
  resolveIosHomeProductId,
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

export const APPLE_PREMIUM_YEARLY_PRODUCT_ID = IAP_PREMIUM_YEARLY_IOS_PRODUCTION;

const homeOverride = process.env.EXPO_PUBLIC_APPLE_HOME_PRODUCT_ID?.trim() || null;

export const APPLE_HOME_PRODUCT_ID = resolveIosHomeProductId({
  useSandbox: useSandboxSku,
  override: homeOverride,
});

export const APPLE_HOME_YEARLY_PRODUCT_ID = IAP_HOME_YEARLY_IOS_PRODUCTION;

export const APPLE_PREMIUM_PRODUCT_IDS = [
  APPLE_PREMIUM_PRODUCT_ID,
  APPLE_PREMIUM_YEARLY_PRODUCT_ID,
  APPLE_HOME_PRODUCT_ID,
  APPLE_HOME_YEARLY_PRODUCT_ID,
] as const;

export {
  IAP_PREMIUM_MONTHLY_IOS_PRODUCTION,
  IAP_PREMIUM_MONTHLY_IOS_SANDBOX,
};
