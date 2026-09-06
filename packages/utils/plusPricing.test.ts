import { describe, expect, it } from "vitest";
import { PLUS_ANNUAL_SAVINGS_COPY, plusAnnualSavingsPercent, plusAnnualSavingsUsd } from "./plusPricing";

describe("Plus display prices", () => {
  it("calculates savings from $5.99 and $59.99 only", () => {
    expect(plusAnnualSavingsUsd()).toBe(11.89);
    expect(plusAnnualSavingsPercent()).toBe(16.5);
    expect(PLUS_ANNUAL_SAVINGS_COPY.label).toMatch(/\$11\.89/);
  });
});
