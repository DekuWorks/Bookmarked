/** Production App Store subscription product ID — must match App Store Connect. */
export const IAP_PREMIUM_MONTHLY_IOS_PRODUCTION = "com.dekuworks.bookmarked.premium.monthly";

/** Yearly Plus SKU. App Store Connect must use this exact product ID. */
export const IAP_PREMIUM_YEARLY_IOS_PRODUCTION = "com.dekuworks.bookmarked.premium.yearly";

/**
 * Home monthly SKU. App Store Connect must create this product — not live until then.
 * Follows the Plus `premium` prefix already shipped for $5.99.
 */
export const IAP_HOME_MONTHLY_IOS_PRODUCTION = "com.dekuworks.bookmarked.home.monthly";

/** Home yearly SKU. App Store Connect must create this product — not live until then. */
export const IAP_HOME_YEARLY_IOS_PRODUCTION = "com.dekuworks.bookmarked.home.yearly";

/**
 * Sandbox / TestFlight SKU override. App Store Connect normally uses the same
 * product ID in sandbox and production; set only if you created a separate SKU.
 */
export const IAP_PREMIUM_MONTHLY_IOS_SANDBOX = IAP_PREMIUM_MONTHLY_IOS_PRODUCTION;
export const IAP_HOME_MONTHLY_IOS_SANDBOX = IAP_HOME_MONTHLY_IOS_PRODUCTION;

/** Active iOS premium SKU (defaults to production). */
export const IAP_PREMIUM_MONTHLY_IOS = IAP_PREMIUM_MONTHLY_IOS_PRODUCTION;

/** Google Play subscription SKU (future — billing uses web link on Android for now). */
export const IAP_PREMIUM_MONTHLY_ANDROID = "bookmarked_premium_monthly";

export const IAP_PREMIUM_PRICE_LABEL = "$5.99 / month";
export const IAP_PREMIUM_YEARLY_PRICE_LABEL = "$59.99 / year";
export const IAP_HOME_PRICE_LABEL = "$9.99 / month";
export const IAP_HOME_YEARLY_PRICE_LABEL = "$99.99 / year";

export const IAP_ALLOWED_PREMIUM_SKUS = [
  IAP_PREMIUM_MONTHLY_IOS_PRODUCTION,
  IAP_PREMIUM_MONTHLY_IOS_SANDBOX,
  IAP_PREMIUM_YEARLY_IOS_PRODUCTION,
  IAP_PREMIUM_MONTHLY_ANDROID,
] as const;

export const IAP_ALLOWED_HOME_SKUS = [
  IAP_HOME_MONTHLY_IOS_PRODUCTION,
  IAP_HOME_MONTHLY_IOS_SANDBOX,
  IAP_HOME_YEARLY_IOS_PRODUCTION,
] as const;

export const IAP_ALLOWED_SKUS = [
  ...IAP_ALLOWED_PREMIUM_SKUS,
  ...IAP_ALLOWED_HOME_SKUS,
] as const;

export type IapPremiumSku = (typeof IAP_ALLOWED_PREMIUM_SKUS)[number];
export type IapHomeSku = (typeof IAP_ALLOWED_HOME_SKUS)[number];
export type IapSku = (typeof IAP_ALLOWED_SKUS)[number];

export function isAllowedPremiumSku(sku: string): sku is IapSku {
  return (IAP_ALLOWED_SKUS as readonly string[]).includes(sku);
}

export function isAllowedHomeSku(sku: string): sku is IapHomeSku {
  return (IAP_ALLOWED_HOME_SKUS as readonly string[]).includes(sku);
}

export function tierFromIapSku(sku: string): "plus" | "home" | null {
  if (isAllowedHomeSku(sku)) return "home";
  if ((IAP_ALLOWED_PREMIUM_SKUS as readonly string[]).includes(sku)) return "plus";
  return null;
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

export function resolveIosHomeProductId(options?: {
  useSandbox?: boolean;
  override?: string | null;
}): string {
  const override = options?.override?.trim();
  if (override) return override;

  return options?.useSandbox
    ? IAP_HOME_MONTHLY_IOS_SANDBOX
    : IAP_HOME_MONTHLY_IOS_PRODUCTION;
}
