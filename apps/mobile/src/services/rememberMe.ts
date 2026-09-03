import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupportedStorage } from "@supabase/supabase-js";

export const REMEMBER_ME_PREF_KEY = "bookmarked_remember_me";

type SecureStoreLike = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

const memory = new Map<string, string>();

let rememberMeEnabled = true;
let rememberMeHydrated = false;
let secureStore: SecureStoreLike | null | undefined;

async function loadSecureStore(): Promise<SecureStoreLike | null> {
  if (secureStore !== undefined) return secureStore;
  try {
    const mod = (await import("expo-secure-store")) as SecureStoreLike;
    secureStore = mod;
    return mod;
  } catch {
    secureStore = null;
    return null;
  }
}

export async function hydrateRememberMePreference(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(REMEMBER_ME_PREF_KEY);
  rememberMeEnabled = stored !== "0";
  rememberMeHydrated = true;
  return rememberMeEnabled;
}

export function isRememberMeEnabled(): boolean {
  return rememberMeEnabled;
}

export async function setRememberMe(enabled: boolean): Promise<void> {
  rememberMeEnabled = enabled;
  rememberMeHydrated = true;
  await AsyncStorage.setItem(REMEMBER_ME_PREF_KEY, enabled ? "1" : "0");
}

export function supabaseAuthStorageKey(supabaseUrl: string): string | null {
  try {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    return projectRef ? `sb-${projectRef}-auth-token` : null;
  } catch {
    return null;
  }
}

export async function clearPersistedAuthSession(keys: string[]): Promise<void> {
  memory.clear();
  const store = await loadSecureStore();
  await Promise.all(
    keys.map(async (key) => {
      await AsyncStorage.removeItem(key);
      if (store) {
        await store.deleteItemAsync(key).catch(() => undefined);
      }
    })
  );
}

/**
 * Keychain-compatible session storage when Remember Me is on.
 * Off = in-memory only (cleared when the app process ends).
 */
export function createRememberMeStorage(options?: {
  fallbackKeys?: string[];
}): SupportedStorage {
  const extraKeys = options?.fallbackKeys ?? [];

  return {
    async getItem(key: string) {
      if (!rememberMeHydrated) {
        await hydrateRememberMePreference();
      }
      if (!rememberMeEnabled) {
        return memory.get(key) ?? null;
      }
      const store = await loadSecureStore();
      if (store) {
        return store.getItemAsync(key);
      }
      return AsyncStorage.getItem(key);
    },
    async setItem(key: string, value: string) {
      if (!rememberMeHydrated) {
        await hydrateRememberMePreference();
      }
      if (!rememberMeEnabled) {
        memory.set(key, value);
        return;
      }
      const store = await loadSecureStore();
      if (store) {
        await store.setItemAsync(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    },
    async removeItem(key: string) {
      memory.delete(key);
      await AsyncStorage.removeItem(key);
      const store = await loadSecureStore();
      if (store) {
        await store.deleteItemAsync(key).catch(() => undefined);
      }
      for (const extra of extraKeys) {
        if (extra === key) continue;
        memory.delete(extra);
        await AsyncStorage.removeItem(extra);
        if (store) {
          await store.deleteItemAsync(extra).catch(() => undefined);
        }
      }
    },
  };
}
