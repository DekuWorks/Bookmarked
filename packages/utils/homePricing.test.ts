import { describe, expect, it } from "vitest";
import {
  HOME_ANNUAL_SAVINGS_COPY,
  HOME_DISPLAY_PRICES,
  homeAnnualSavingsPercent,
  homeAnnualSavingsUsd,
} from "./homePricing";

describe("homePricing", () => {
  it("uses official Home display prices", () => {
    expect(HOME_DISPLAY_PRICES.monthlyUsd).toBe(9.99);
    expect(HOME_DISPLAY_PRICES.yearlyUsd).toBe(99.99);
    expect(HOME_DISPLAY_PRICES.monthlyLabel).toBe("$9.99/month");
    expect(HOME_DISPLAY_PRICES.yearlyLabel).toBe("$99.99/year");
    expect(HOME_DISPLAY_PRICES.yearlyMonthlyEquivalentLabel).toBe("$8.33/month");
  });

  it("calculates annual savings from plan config", () => {
    expect(homeAnnualSavingsUsd()).toBe(19.89);
    expect(homeAnnualSavingsPercent()).toBe(16.6);
    expect(HOME_ANNUAL_SAVINGS_COPY.label).toMatch(/\$19\.89/);
    expect(HOME_ANNUAL_SAVINGS_COPY.label).toMatch(/16\.6%/);
  });
});
