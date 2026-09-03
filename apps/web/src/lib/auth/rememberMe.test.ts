import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyRememberMePreference,
  clearSupabaseAuthStorage,
  getAuthStorage,
  isRememberMeEnabled,
  parseRememberMeFromForm,
  supabaseAuthStorageKey,
} from "./rememberMe";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function form(remember: boolean): FormData {
  const data = new FormData();
  if (remember) data.set("remember", "on");
  return data;
}

beforeEach(() => {
  const local = memoryStorage();
  const session = memoryStorage();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: local, sessionStorage: session },
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: local });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });
});

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("rememberMe", () => {
  it("defaults to remember-on when unset", () => {
    expect(isRememberMeEnabled()).toBe(true);
    expect(getAuthStorage()).toBe(window.localStorage);
  });

  it("uses sessionStorage when remember is off", () => {
    applyRememberMePreference(false);
    expect(isRememberMeEnabled()).toBe(false);
    expect(getAuthStorage()).toBe(window.sessionStorage);
  });

  it("uses localStorage when remember is on", () => {
    applyRememberMePreference(true);
    expect(isRememberMeEnabled()).toBe(true);
    expect(getAuthStorage()).toBe(window.localStorage);
  });

  it("parses the checkbox and never stores a password", () => {
    expect(parseRememberMeFromForm(form(true))).toBe(true);
    expect(parseRememberMeFromForm(form(false))).toBe(false);
    const data = new FormData();
    data.set("email", "reader@example.com");
    data.set("password", "secret");
    expect(parseRememberMeFromForm(data)).toBe(false);
  });

  it("logout clears persisted tokens from both storages", () => {
    const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    const key = supabaseAuthStorageKey();
    expect(key).toBe("sb-abc-auth-token");
    window.localStorage.setItem(key!, JSON.stringify({ access_token: "expired" }));
    window.sessionStorage.setItem(key!, JSON.stringify({ access_token: "invalid" }));
    clearSupabaseAuthStorage();
    expect(window.localStorage.getItem(key!)).toBeNull();
    expect(window.sessionStorage.getItem(key!)).toBeNull();
    process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  });

  it("switching remember-me clears the previous session slot", () => {
    const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    const key = supabaseAuthStorageKey();
    window.localStorage.setItem(key!, "token");
    applyRememberMePreference(false);
    expect(window.localStorage.getItem(key!)).toBeNull();
    process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  });
});
