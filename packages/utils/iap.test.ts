import { describe, expect, it } from "vitest";
import {
  IAP_HOME_MONTHLY_IOS_PRODUCTION,
  IAP_HOME_YEARLY_IOS_PRODUCTION,
  IAP_PREMIUM_MONTHLY_IOS,
  IAP_PREMIUM_MONTHLY_IOS_PRODUCTION,
  IAP_PREMIUM_MONTHLY_IOS_SANDBOX,
  isAllowedHomeSku,
  isAllowedPremiumSku,
  resolveIosHomeProductId,
  resolveIosPremiumProductId,
  tierFromIapSku,
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

describe("Home IAP SKUs", () => {
  it("accepts Home monthly and yearly SKUs and maps them to the home tier", () => {
    expect(isAllowedPremiumSku(IAP_HOME_MONTHLY_IOS_PRODUCTION)).toBe(true);
    expect(isAllowedHomeSku(IAP_HOME_YEARLY_IOS_PRODUCTION)).toBe(true);
    expect(tierFromIapSku(IAP_HOME_MONTHLY_IOS_PRODUCTION)).toBe("home");
    expect(tierFromIapSku(IAP_PREMIUM_MONTHLY_IOS_PRODUCTION)).toBe("plus");
    expect(resolveIosHomeProductId()).toBe(IAP_HOME_MONTHLY_IOS_PRODUCTION);
  });
});
