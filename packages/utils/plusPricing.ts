/**
 * Official Plus upgrade-page display prices.
 * Monthly is $4.99. Yearly is $4.99 × 10 = $49.99.
 * The monthly equivalent is $49.99 / 12. Do not label that as "Save 20%".
 * iOS subscribe buttons must prefer StoreKit `displayPrice` over these.
 * Web never starts checkout — these are copy only.
 */

export const PLUS_DISPLAY_PRICES = {
  monthlyUsd: 4.99,
  yearlyUsd: 49.99,
  monthlyLabel: "$4.99/month",
  yearlyLabel: "$49.99/year",
  yearlyMonthlyEquivalentLabel: "$4.17/month",
} as const;

/** 12 × monthly − yearly. Do not invent a different discount. */
export function plusAnnualSavingsUsd(
  monthly = PLUS_DISPLAY_PRICES.monthlyUsd,
  yearly = PLUS_DISPLAY_PRICES.yearlyUsd
): number {
  return Number((monthly * 12 - yearly).toFixed(2));
}

export function plusAnnualSavingsPercent(
  monthly = PLUS_DISPLAY_PRICES.monthlyUsd,
  yearly = PLUS_DISPLAY_PRICES.yearlyUsd
): number {
  const fullYear = monthly * 12;
  if (fullYear <= 0) return 0;
  return Number(((plusAnnualSavingsUsd(monthly, yearly) / fullYear) * 100).toFixed(1));
}

export const PLUS_ANNUAL_SAVINGS_COPY = {
  dollars: plusAnnualSavingsUsd(),
  percent: plusAnnualSavingsPercent(),
  label: `Save $${plusAnnualSavingsUsd().toFixed(2)} (~${plusAnnualSavingsPercent()}%) vs 12 months`,
} as const;
