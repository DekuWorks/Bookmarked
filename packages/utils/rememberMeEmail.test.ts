import { describe, expect, it } from "vitest";
import {
  REMEMBERED_EMAIL_KEY,
  normalizeRememberedEmail,
  rememberedEmailStorageValue,
  storageLooksLikePassword,
} from "./rememberMeEmail";

describe("remember-me email storage", () => {
  it("stores a normalized email when remember me is on", () => {
    expect(
      rememberedEmailStorageValue({ rememberMe: true, email: "Reader@Example.com" })
    ).toBe("reader@example.com");
    expect(REMEMBERED_EMAIL_KEY).not.toMatch(/password/i);
  });

  it("clears email when remember me is off", () => {
    expect(
      rememberedEmailStorageValue({ rememberMe: false, email: "reader@example.com" })
    ).toBeNull();
    expect(normalizeRememberedEmail("not-an-email")).toBeNull();
  });

  it("never treats a password as a remember-me value", () => {
    expect(storageLooksLikePassword("password", "secret")).toBe(true);
    expect(storageLooksLikePassword(REMEMBERED_EMAIL_KEY, "reader@example.com")).toBe(false);
  });
});
