import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../../..");

describe("Login PasswordField", () => {
  it("uses an eye toggle with show/hide labels inside the password field", () => {
    const source = readFileSync(
      resolve(root, "src/components/auth/PasswordField.tsx"),
      "utf8"
    );
    expect(source).toContain('aria-label={visible ? "Hide password" : "Show password"}');
    expect(source).toContain('type={visible ? "text" : "password"}');
    expect(source).toContain("PasswordVisibilityIcon");
    expect(source).not.toMatch(/👁|🙈|emoji/);
  });

  it("keeps login form order: email, password eye, remember me, log in", () => {
    const source = readFileSync(
      resolve(root, "src/components/auth/LoginForm.tsx"),
      "utf8"
    );
    const emailAt = source.indexOf('label="Email"');
    const passwordAt = source.indexOf("<PasswordField");
    const rememberAt = source.indexOf("<RememberMeField");
    const submitAt = source.indexOf("Log in");
    expect(emailAt).toBeGreaterThan(-1);
    expect(passwordAt).toBeGreaterThan(emailAt);
    expect(rememberAt).toBeGreaterThan(passwordAt);
    expect(submitAt).toBeGreaterThan(rememberAt);
  });
});
