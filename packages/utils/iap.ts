/** Production App Store subscription product ID — must match App Store Connect. */
export const IAP_PREMIUM_MONTHLY_IOS_PRODUCTION = "com.dekuworks.bookmarked.premium.monthly";

/**
 * Sandbox / TestFlight SKU override. App Store Connect normally uses the same
 * product ID in sandbox and production; set only if you created a separate SKU.
 */
export const IAP_PREMIUM_MONTHLY_IOS_SANDBOX = IAP_PREMIUM_MONTHLY_IOS_PRODUCTION;

/** Active iOS premium SKU (defaults to production). */
export const IAP_PREMIUM_MONTHLY_IOS = IAP_PREMIUM_MONTHLY_IOS_PRODUCTION;

/** Google Play subscription SKU (future — billing uses web link on Android for now). */
export const IAP_PREMIUM_MONTHLY_ANDROID = "bookmarked_premium_monthly";

export const IAP_PREMIUM_PRICE_LABEL = "$4.99 / month";

export const IAP_ALLOWED_PREMIUM_SKUS = [
  IAP_PREMIUM_MONTHLY_IOS_PRODUCTION,
  IAP_PREMIUM_MONTHLY_IOS_SANDBOX,
  IAP_PREMIUM_MONTHLY_ANDROID,
] as const;

export type IapPremiumSku = (typeof IAP_ALLOWED_PREMIUM_SKUS)[number];

export function isAllowedPremiumSku(sku: string): sku is IapPremiumSku {
  return (IAP_ALLOWED_PREMIUM_SKUS as readonly string[]).includes(sku);
}

export function resolveIosPremiumProductId(options?: {
  useSandbox?: boolean;
  override?: string | null;
}): string {
  const override = options?.override?.trim();
  if (override) return override;

  return options?.useSandbox
    ? IAP_PREMIUM_MONTHLY_IOS_SANDBOX
    : IAP_PREMIUM_MONTHLY_IOS_PRODUCTION;
}
