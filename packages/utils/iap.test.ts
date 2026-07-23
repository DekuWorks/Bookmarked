import { describe, expect, it } from "vitest";
import {
  IAP_PREMIUM_MONTHLY_IOS,
  IAP_PREMIUM_MONTHLY_IOS_PRODUCTION,
  IAP_PREMIUM_MONTHLY_IOS_SANDBOX,
  isAllowedPremiumSku,
  resolveIosPremiumProductId,
} from "./iap";

describe("isAllowedPremiumSku", () => {
  it("accepts the iOS premium monthly SKU", () => {
    expect(isAllowedPremiumSku(IAP_PREMIUM_MONTHLY_IOS)).toBe(true);
    expect(isAllowedPremiumSku(IAP_PREMIUM_MONTHLY_IOS_PRODUCTION)).toBe(true);
    expect(isAllowedPremiumSku(IAP_PREMIUM_MONTHLY_IOS_SANDBOX)).toBe(true);
  });

  it("rejects unknown SKUs", () => {
    expect(isAllowedPremiumSku("com.example.other")).toBe(false);
  });
});

describe("resolveIosPremiumProductId", () => {
  it("defaults to production SKU", () => {
    expect(resolveIosPremiumProductId()).toBe(IAP_PREMIUM_MONTHLY_IOS_PRODUCTION);
  });

  it("honors sandbox flag and override", () => {
    expect(resolveIosPremiumProductId({ useSandbox: true })).toBe(
      IAP_PREMIUM_MONTHLY_IOS_SANDBOX
    );
    expect(resolveIosPremiumProductId({ override: "com.custom.sku" })).toBe("com.custom.sku");
  });
});
