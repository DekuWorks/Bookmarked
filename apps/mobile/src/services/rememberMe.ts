import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SupportedStorage } from "@supabase/supabase-js";
import {
  REMEMBERED_EMAIL_KEY,
  normalizeRememberedEmail,
  rememberedEmailStorageValue,
} from "../../../../packages/utils/rememberMeEmail";

export const REMEMBER_ME_PREF_KEY = "bookmarked_remember_me";
export { REMEMBERED_EMAIL_KEY };

type SecureStoreLike = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

const memory = new Map<string, string>();

let rememberMeEnabled = true;
let rememberMeHydrated = false;
let secureStore: SecureStoreLike | null | undefined;

function readSecureStoreModule(mod: unknown): SecureStoreLike | null {
  const record = mod as { default?: unknown } | null;
  const candidates = [mod, record?.default];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const api = candidate as SecureStoreLike;
    if (
      typeof api.getItemAsync === "function" &&
      typeof api.setItemAsync === "function" &&
      typeof api.deleteItemAsync === "function"
    ) {
      return api;
    }
  }
  return null;
}

function hasNativeSecureStore(): boolean {
  try {
    const core = require("expo-modules-core") as {
      requireOptionalNativeModule?: (name: string) => unknown;
    };
    return Boolean(core.requireOptionalNativeModule?.("ExpoSecureStore"));
  } catch {
    return false;
  }
}

async function loadSecureStore(): Promise<SecureStoreLike | null> {
  if (secureStore !== undefined) return secureStore;
  // The installed binary may not include ExpoSecureStore. Importing the JS
  // package anyway throws "Cannot find native module" during evaluation.
  if (!hasNativeSecureStore()) {
    secureStore = null;
    return null;
  }
  try {
    const api = readSecureStoreModule(await import("expo-secure-store"));
    secureStore = api;
    return api;
  } catch {
    secureStore = null;
    return null;
  }
}

async function secureGet(store: SecureStoreLike, key: string): Promise<string | null> {
  try {
    return await store.getItemAsync(key);
  } catch {
    secureStore = null;
    return AsyncStorage.getItem(key);
  }
}

async function secureSet(store: SecureStoreLike, key: string, value: string): Promise<void> {
  try {
    await store.setItemAsync(key, value);
  } catch {
    secureStore = null;
    await AsyncStorage.setItem(key, value);
  }
}

async function secureDelete(store: SecureStoreLike | null, key: string): Promise<void> {
  if (!store) return;
  try {
    await store.deleteItemAsync(key);
  } catch {
    secureStore = null;
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
  if (!enabled) {
    await persistRememberedEmail(false);
  }
}

export async function getRememberedEmail(): Promise<string> {
  const stored = await AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
  return normalizeRememberedEmail(stored) ?? "";
}

export async function persistRememberedEmail(
  remember: boolean,
  email?: string | null
): Promise<void> {
  const stored = rememberedEmailStorageValue({ rememberMe: remember, email });
  if (stored) {
    await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, stored);
    return;
  }
  await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
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
      await secureDelete(store, key);
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
        return secureGet(store, key);
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
        await secureSet(store, key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    },
    async removeItem(key: string) {
      memory.delete(key);
      await AsyncStorage.removeItem(key);
      const store = await loadSecureStore();
      await secureDelete(store, key);
      for (const extra of extraKeys) {
        if (extra === key) continue;
        memory.delete(extra);
        await AsyncStorage.removeItem(extra);
        await secureDelete(store, extra);
      }
    },
  };
}
