import { describe, expect, it } from "vitest";
import {
  PLUS_ANNUAL_SAVINGS_COPY,
  PLUS_DISPLAY_PRICES,
  plusAnnualSavingsPercent,
  plusAnnualSavingsUsd,
} from "./plusPricing";

describe("Plus display prices", () => {
  it("uses $4.99/month and $49.99/year, not a 20% claim", () => {
    expect(PLUS_DISPLAY_PRICES.monthlyUsd).toBe(4.99);
    expect(PLUS_DISPLAY_PRICES.yearlyUsd).toBe(49.99);
    expect(PLUS_DISPLAY_PRICES.monthlyLabel).toBe("$4.99/month");
    expect(PLUS_DISPLAY_PRICES.yearlyLabel).toBe("$49.99/year");
    expect(PLUS_DISPLAY_PRICES.yearlyMonthlyEquivalentLabel).toBe("$4.17/month");
    expect(plusAnnualSavingsUsd()).toBe(9.89);
    expect(plusAnnualSavingsPercent()).toBe(16.5);
    expect(PLUS_ANNUAL_SAVINGS_COPY.label).toMatch(/\$9\.89/);
    expect(PLUS_ANNUAL_SAVINGS_COPY.label).not.toMatch(/20%/);
  });
});
