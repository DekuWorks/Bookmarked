/**
 * Official Home upgrade-page display prices.
 * iOS subscribe buttons must prefer StoreKit `displayPrice` over these.
 * Web never starts checkout — these are copy only.
 *
 * Annual ≈ $8.33/month. Savings: 12 × $9.99 − $99.99 = $19.89 (~16.6%).
 */

export const HOME_DISPLAY_PRICES = {
  monthlyUsd: 9.99,
  yearlyUsd: 99.99,
  monthlyLabel: "$9.99/month",
  yearlyLabel: "$99.99/year",
  yearlyMonthlyEquivalentLabel: "$8.33/month",
} as const;

/** 12 × monthly − yearly. Do not invent a different discount. */
export function homeAnnualSavingsUsd(
  monthly = HOME_DISPLAY_PRICES.monthlyUsd,
  yearly = HOME_DISPLAY_PRICES.yearlyUsd
): number {
  return Number((monthly * 12 - yearly).toFixed(2));
}

export function homeAnnualSavingsPercent(
  monthly = HOME_DISPLAY_PRICES.monthlyUsd,
  yearly = HOME_DISPLAY_PRICES.yearlyUsd
): number {
  const fullYear = monthly * 12;
  if (fullYear <= 0) return 0;
  return Number(((homeAnnualSavingsUsd(monthly, yearly) / fullYear) * 100).toFixed(1));
}

export const HOME_ANNUAL_SAVINGS_COPY = {
  dollars: homeAnnualSavingsUsd(),
  percent: homeAnnualSavingsPercent(),
  label: `Save $${homeAnnualSavingsUsd().toFixed(2)} (~${homeAnnualSavingsPercent()}%) vs 12 months`,
} as const;
