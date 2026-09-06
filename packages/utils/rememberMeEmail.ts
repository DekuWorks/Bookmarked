export const REMEMBERED_EMAIL_KEY = "bookmarked_remembered_email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeRememberedEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase() ?? "";
  if (!email || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

export function rememberedEmailStorageValue(input: {
  rememberMe: boolean;
  email?: string | null;
}): string | null {
  if (!input.rememberMe) return null;
  return normalizeRememberedEmail(input.email);
}

export function storageLooksLikePassword(key: string, value: string): boolean {
  const lowered = key.toLowerCase();
  if (lowered.includes("password") || lowered.includes("passwd")) return true;
  return value.startsWith("password:") || value.startsWith("pwd:");
}
