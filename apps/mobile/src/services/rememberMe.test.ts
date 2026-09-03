import { beforeEach, describe, expect, it, vi } from "vitest";

const asyncStore = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => asyncStore.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      asyncStore.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      asyncStore.delete(key);
    }),
  },
}));

vi.mock("expo-secure-store", () => {
  const secure = new Map<string, string>();
  return {
    getItemAsync: vi.fn(async (key: string) => secure.get(key) ?? null),
    setItemAsync: vi.fn(async (key: string, value: string) => {
      secure.set(key, value);
    }),
    deleteItemAsync: vi.fn(async (key: string) => {
      secure.delete(key);
    }),
  };
});

describe("rememberMe storage", () => {
  beforeEach(() => {
    asyncStore.clear();
    vi.resetModules();
  });

  it("persists session tokens when remember is on", async () => {
    const { createRememberMeStorage, setRememberMe } = await import("./rememberMe");
    await setRememberMe(true);
    const storage = createRememberMeStorage();
    await storage.setItem("sb-test-auth-token", JSON.stringify({ access_token: "tok" }));
    await expect(storage.getItem("sb-test-auth-token")).resolves.toContain("tok");
  });

  it("keeps the session in memory only when remember is off", async () => {
    const { createRememberMeStorage, setRememberMe } = await import("./rememberMe");
    await setRememberMe(false);
    const storage = createRememberMeStorage();
    await storage.setItem("sb-test-auth-token", "session");
    await expect(storage.getItem("sb-test-auth-token")).resolves.toBe("session");
    expect(asyncStore.has("sb-test-auth-token")).toBe(false);
  });

  it("logout clears persisted state", async () => {
    const { createRememberMeStorage, setRememberMe, clearPersistedAuthSession } =
      await import("./rememberMe");
    await setRememberMe(true);
    const storage = createRememberMeStorage();
    await storage.setItem("sb-test-auth-token", "session");
    await clearPersistedAuthSession(["sb-test-auth-token"]);
    await expect(storage.getItem("sb-test-auth-token")).resolves.toBeNull();
  });
});
