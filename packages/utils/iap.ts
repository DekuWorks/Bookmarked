/** App Store / Play product identifiers — must match store consoles. */
export const IAP_PREMIUM_MONTHLY_IOS = "com.dekuworks.bookmarked.premium.monthly";

/** Google Play subscription SKU (future — billing uses web link on Android for now). */
export const IAP_PREMIUM_MONTHLY_ANDROID = "bookmarked_premium_monthly";

export const IAP_PREMIUM_PRICE_LABEL = "$4.99 / month";

export const IAP_ALLOWED_PREMIUM_SKUS = [
  IAP_PREMIUM_MONTHLY_IOS,
  IAP_PREMIUM_MONTHLY_ANDROID,
] as const;

export type IapPremiumSku = (typeof IAP_ALLOWED_PREMIUM_SKUS)[number];

export function isAllowedPremiumSku(sku: string): sku is IapPremiumSku {
  return (IAP_ALLOWED_PREMIUM_SKUS as readonly string[]).includes(sku);
}
