import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");

describe("PasswordField", () => {
  it("toggles secure entry with Bookmarked icon a11y labels", () => {
    const source = readFileSync(resolve(root, "src/components/PasswordField.tsx"), "utf8");
    expect(source).toContain('accessibilityLabel={visible ? "Hide password" : "Show password"}');
    expect(source).toContain("secureTextEntry={!visible}");
    expect(source).toContain("eye-outline");
    expect(source).toContain("eye-off-outline");
    expect(source).not.toMatch(/👁|🙈/);
  });

  it("keeps login order email → password → remember me → log in", () => {
    const source = readFileSync(resolve(root, "src/screens/LoginScreen.tsx"), "utf8");
    const emailAt = source.indexOf('label="Email"');
    const passwordAt = source.indexOf("<PasswordField");
    const rememberAt = source.indexOf('accessibilityLabel="Remember me"');
    const submitAt = source.indexOf('title="Log in"');
    expect(emailAt).toBeGreaterThan(-1);
    expect(passwordAt).toBeGreaterThan(emailAt);
    expect(rememberAt).toBeGreaterThan(passwordAt);
    expect(submitAt).toBeGreaterThan(rememberAt);
  });
});
