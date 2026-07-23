import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BRAND_ASSETS } from "@/lib/constants/brandAssets";
import {
  BROWSER_NOTIFICATION_PREF_EVENT,
  BROWSER_NOTIFICATION_PREF_KEY,
  getBrowserNotificationPreferenceEnabled,
  getNotificationIconUrl,
  setBrowserNotificationPreferenceEnabled,
} from "@/lib/utils/browserNotifications";

function installBrowserGlobals() {
  const storage = new Map<string, string>();
  const listeners = new Map<string, Set<EventListener>>();

  const localStorage = {
    getItem: (key: string) => (storage.has(key) ? storage.get(key)! : null),
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  };

  const windowLike = {
    localStorage,
    location: { origin: "https://bookmarked.online" },
    addEventListener: (type: string, listener: EventListener) => {
      const bucket = listeners.get(type) ?? new Set<EventListener>();
      bucket.add(listener);
      listeners.set(type, bucket);
    },
    removeEventListener: (type: string, listener: EventListener) => {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent: (event: Event) => {
      for (const listener of listeners.get(event.type) ?? []) {
        listener(event);
      }
      return true;
    },
  };

  vi.stubGlobal("window", windowLike);
  return { storage, listeners };
}

describe("browser notification preferences", () => {
  beforeEach(() => {
    installBrowserGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores and reads notify_browser preference", () => {
    expect(getBrowserNotificationPreferenceEnabled()).toBeNull();

    setBrowserNotificationPreferenceEnabled(true);
    expect(window.localStorage.getItem(BROWSER_NOTIFICATION_PREF_KEY)).toBe("1");
    expect(getBrowserNotificationPreferenceEnabled()).toBe(true);

    setBrowserNotificationPreferenceEnabled(false);
    expect(getBrowserNotificationPreferenceEnabled()).toBe(false);
  });

  it("broadcasts preference changes", () => {
    const handler = vi.fn();
    window.addEventListener(BROWSER_NOTIFICATION_PREF_EVENT, handler);

    setBrowserNotificationPreferenceEnabled(true);

    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0]?.[0] as CustomEvent<boolean>).detail).toBe(true);
  });
});

describe("getNotificationIconUrl", () => {
  beforeEach(() => {
    installBrowserGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the branded logo mark", () => {
    expect(getNotificationIconUrl()).toBe(
      `https://bookmarked.online${BRAND_ASSETS.logoMark.src}`
    );
  });
});
