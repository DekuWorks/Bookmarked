const REMEMBER_ME_KEY = "bookmarked_remember_me";

export function isRememberMeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(REMEMBER_ME_KEY);
  return stored !== "0";
}

export function setRememberMe(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBER_ME_KEY, enabled ? "1" : "0");
}

export function parseRememberMeFromForm(formData: FormData): boolean {
  return formData.get("remember") === "on";
}

export function getAuthStorage(): Storage {
  if (typeof window === "undefined") {
    return localStorage;
  }
  return isRememberMeEnabled() ? window.localStorage : window.sessionStorage;
}

export function supabaseAuthStorageKey(supabaseUrl?: string): string | null {
  const url = (supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  if (!url) return null;

  try {
    const projectRef = new URL(url).hostname.split(".")[0];
    return projectRef ? `sb-${projectRef}-auth-token` : null;
  } catch {
    return null;
  }
}

function getSupabaseAuthStorageKey(): string | null {
  return supabaseAuthStorageKey();
}

export function clearSupabaseAuthStorage(): void {
  if (typeof window === "undefined") return;

  const authKey = getSupabaseAuthStorageKey();
  if (!authKey) return;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    storage.removeItem(authKey);
  }
}

export function applyRememberMePreference(remember: boolean): void {
  setRememberMe(remember);
  clearSupabaseAuthStorage();
}
