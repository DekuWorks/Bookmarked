import { describe, expect, it } from "vitest";
import {
  IAP_PREMIUM_MONTHLY_IOS,
  isAllowedPremiumSku,
} from "./iap";

describe("isAllowedPremiumSku", () => {
  it("accepts the iOS premium monthly SKU", () => {
    expect(isAllowedPremiumSku(IAP_PREMIUM_MONTHLY_IOS)).toBe(true);
  });

  it("rejects unknown SKUs", () => {
    expect(isAllowedPremiumSku("com.example.other")).toBe(false);
  });
});
