/**
 * Shared multi-step back history.
 * Stores route keys and navigation params only — never page contents.
 * Display is the three previous screens, most recent first.
 */

import { parseReadingRoomTab, readingRoomTabLabel, type ReadingRoomTab } from "./readingRoomTabs";

export const NAV_HISTORY_DISPLAY_LIMIT = 3;
export const NAV_HISTORY_MAX_ENTRIES = 24;
export const NAV_HISTORY_STORAGE_KEY = "bookmarked.navHistory.v1";

export type NavHistoryIcon =
  | "overview"
  | "library"
  | "shelf"
  | "book"
  | "feed"
  | "search"
  | "discover"
  | "clubs"
  | "challenges"
  | "events"
  | "map"
  | "messages"
  | "profile"
  | "settings"
  | "notes"
  | "reviews"
  | "stats"
  | "generic";

export type NavHistoryEntry = {
  /** Stable route id. Not a visible title. */
  key: string;
  title: string;
  href: string;
  icon: NavHistoryIcon;
  /** Native stack group, used when jumping back. */
  stack: string;
};

export type NavHistoryState = {
  userId: string | null;
  /** Oldest first. `index` is the current screen. */
  entries: NavHistoryEntry[];
  index: number;
};

export type NavPlatform = "web" | "mobile";

export type NavQuery = Record<string, string | undefined>;

const SHELF_TITLES: Record<string, string> = {
  "want-to-read": "TBR",
  reading: "Currently Reading",
  read: "Finished",
  dnf: "DNF",
  favorites: "Favorites",
  "my-books": "All Books",
  custom: "Shelf",
};

const EXCLUDED_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/profile/setup",
  "/profile-setup",
  "/dashboard",
  "/compose",
];

export function emptyNavHistory(userId: string | null = null): NavHistoryState {
  return { userId, entries: [], index: -1 };
}

export function normalizeNavPath(pathname: string): string {
  let path = pathname.split("?")[0]?.split("#")[0] ?? "";
  path = path.replace(/\/\([^/]+\)/g, "");
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  if (path === "/index") path = "/";
  return path;
}

export function isSafeNavHref(href: string): boolean {
  if (!href.startsWith("/")) return false;
  if (href.startsWith("//")) return false;
  const lower = href.toLowerCase();
  if (lower.includes("javascript:") || lower.includes("data:")) return false;
  if (href.includes("://")) return false;
  return true;
}

function cleanTitle(title: string): string {
  const trimmed = title.replace(/\s+/g, " ").trim();
  if (!trimmed) return "Back";
  return trimmed.length > 80 ? `${trimmed.slice(0, 79)}…` : trimmed;
}

function isEntry(value: unknown): value is NavHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as NavHistoryEntry;
  return (
    typeof entry.key === "string" &&
    entry.key.length > 0 &&
    entry.key.length < 180 &&
    typeof entry.title === "string" &&
    typeof entry.href === "string" &&
    isSafeNavHref(entry.href) &&
    typeof entry.icon === "string" &&
    typeof entry.stack === "string"
  );
}

/**
 * A remount starts from an empty stack. Fill it from storage for the same user.
 * A shorter in-memory stack is a real visit (forward entries were dropped) and must be kept.
 */
export function adoptRicherNavHistory(memory: NavHistoryState, stored: NavHistoryState): NavHistoryState {
  if (memory.entries.length > 0) return memory;
  if (!stored.userId || stored.userId !== memory.userId || stored.entries.length === 0) return memory;
  return stored;
}

export function serializeNavHistory(state: NavHistoryState): string {
  return JSON.stringify({
    userId: state.userId,
    index: state.index,
    entries: state.entries.map((entry) => ({
      key: entry.key,
      title: entry.title,
      href: entry.href,
      icon: entry.icon,
      stack: entry.stack,
    })),
  });
}

export function parseNavHistory(raw: string | null | undefined, userId: string | null): NavHistoryState {
  if (!raw || !userId) return emptyNavHistory(userId);
  try {
    const parsed = JSON.parse(raw) as { userId?: unknown; index?: unknown; entries?: unknown };
    if (parsed.userId !== userId) return emptyNavHistory(userId);
    if (!Array.isArray(parsed.entries)) return emptyNavHistory(userId);
    const entries = parsed.entries.filter(isEntry).slice(-NAV_HISTORY_MAX_ENTRIES);
    let index = Number(parsed.index);
    if (!Number.isInteger(index) || index < -1 || index >= entries.length) {
      index = entries.length - 1;
    }
    return { userId, entries, index };
  } catch {
    return emptyNavHistory(userId);
  }
}

function sameScreen(current: NavHistoryEntry, next: NavHistoryEntry): boolean {
  return current.key === next.key;
}

/** Append a real visit. Same-screen rerenders update the current entry only. */
export function recordNavVisit(
  state: NavHistoryState,
  entry: NavHistoryEntry | null,
  userId: string | null
): NavHistoryState {
  if (state.userId !== userId) {
    state = emptyNavHistory(userId);
  }
  if (!entry || !isSafeNavHref(entry.href)) return state;
  const current = state.index >= 0 ? state.entries[state.index] : undefined;
  if (current && sameScreen(current, entry)) {
    if (current.href === entry.href && current.title === entry.title && current.icon === entry.icon) {
      return state;
    }
    const entries = state.entries.slice();
    entries[state.index] = entry;
    return { ...state, entries };
  }
  const base = state.entries.slice(0, Math.max(0, state.index + 1));
  const entries = [...base, entry].slice(-NAV_HISTORY_MAX_ENTRIES);
  return { userId, entries, index: entries.length - 1 };
}

/**
 * Browser back/forward. Move to an existing entry when the route matches.
 * Otherwise record a real visit. Does not invent screens.
 */
export function syncNavVisit(state: NavHistoryState, entry: NavHistoryEntry | null): NavHistoryState {
  if (!entry || !isSafeNavHref(entry.href)) return state;
  const current = state.index >= 0 ? state.entries[state.index] : undefined;
  if (current && sameScreen(current, entry)) {
    return recordNavVisit(state, entry, state.userId);
  }
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < state.entries.length; i += 1) {
    if (state.entries[i]?.key !== entry.key) continue;
    const distance = Math.abs(i - state.index);
    if (distance > 0 && distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  if (best >= 0) {
    const entries = state.entries.slice();
    entries[best] = { ...entries[best], href: entry.href, title: entries[best]?.title || entry.title };
    return { ...state, entries, index: best };
  }
  return recordNavVisit(state, entry, state.userId);
}

export function previousNavEntries(
  state: NavHistoryState,
  limit = NAV_HISTORY_DISPLAY_LIMIT
): Array<NavHistoryEntry & { index: number }> {
  const items: Array<NavHistoryEntry & { index: number }> = [];
  for (let i = state.index - 1; i >= 0 && items.length < limit; i -= 1) {
    const entry = state.entries[i];
    if (!entry || !isSafeNavHref(entry.href)) continue;
    items.push({ ...entry, index: i });
  }
  return items;
}

/** Drop screens above the chosen destination so they are not offered again. */
export function truncateNavHistory(state: NavHistoryState, index: number): NavHistoryState {
  if (index < 0 || index >= state.entries.length || index > state.index) return state;
  return {
    ...state,
    index,
    entries: state.entries.slice(0, index + 1),
  };
}

/** Move the cursor without deleting forward entries (browser history.go). */
export function focusNavHistory(state: NavHistoryState, index: number): NavHistoryState {
  if (index < 0 || index >= state.entries.length) return state;
  return { ...state, index };
}

export function renameNavEntryIfCurrent(
  state: NavHistoryState,
  key: string,
  title: string
): NavHistoryState {
  const current = state.entries[state.index];
  if (!current || current.key !== key) return state;
  return renameCurrentNavEntry(state, title);
}

export function renameCurrentNavEntry(state: NavHistoryState, title: string): NavHistoryState {
  const current = state.entries[state.index];
  if (!current) return state;
  const nextTitle = cleanTitle(title);
  if (!nextTitle || nextTitle === current.title || nextTitle === "Back") return state;
  const entries = state.entries.slice();
  entries[state.index] = { ...current, title: nextTitle };
  return { ...state, entries };
}

export function canPopWithinSession(targetIndex: number, currentIndex: number, sessionAnchor: number): boolean {
  return targetIndex >= sessionAnchor && targetIndex < currentIndex;
}

/** Stacks that should pop nested screens after a history jump. */
export function stacksToReset(removed: readonly NavHistoryEntry[], target: NavHistoryEntry): string[] {
  const stacks = new Set<string>();
  const rootKeys = new Set(["library", "challenges", "clubs"]);
  if (rootKeys.has(target.key) && removed.some((entry) => entry.stack === target.stack && entry.key !== target.key)) {
    stacks.add(target.stack);
  }
  return [...stacks];
}

function queryValue(search: NavQuery, key: string): string | undefined {
  const value = search[key]?.trim();
  if (!value || value.length > 200) return undefined;
  return value;
}

function hrefFor(
  platform: NavPlatform,
  path: string,
  search: NavQuery,
  keys: readonly string[]
): string {
  const params = new URLSearchParams();
  for (const key of keys) {
    const value = queryValue(search, key);
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  if (platform === "web") {
    const base = path === "/" ? "/" : path.endsWith("/") ? path : `${path}/`;
    return qs ? `${base}?${qs}` : base;
  }
  const mobilePath = path === "/" ? "/" : path.replace(/\/$/, "");
  return qs ? `${mobilePath}?${qs}` : mobilePath;
}

function entry(
  key: string,
  title: string,
  href: string,
  icon: NavHistoryIcon,
  stack: string
): NavHistoryEntry | null {
  if (!isSafeNavHref(href) || !key) return null;
  return { key, title: cleanTitle(title), href, icon, stack };
}

function readingRoomIcon(tab: ReadingRoomTab): NavHistoryIcon {
  if (tab === "overview") return "overview";
  if (tab === "notes") return "notes";
  if (tab === "reviews") return "reviews";
  if (tab === "stats") return "stats";
  return "generic";
}

function readingRoomEntry(platform: NavPlatform, search: NavQuery): NavHistoryEntry | null {
  const tab = parseReadingRoomTab(queryValue(search, "tab"));
  const params: NavQuery = {};
  if (tab !== "overview") params.tab = tab;
  const origin = queryValue(search, "origin");
  if (origin) params.origin = origin;
  const href =
    platform === "web"
      ? hrefFor("web", "/reading-room", params, ["tab", "origin"])
      : hrefFor("mobile", "/", params, ["tab", "origin"]);
  return entry(`reading-room:${tab}`, readingRoomTabLabel(tab), href, readingRoomIcon(tab), "home");
}

function looksLikeId(segment: string): boolean {
  return /^[0-9a-f-]{8,}$/i.test(segment) || segment.length > 24;
}

export function resolveNavScreen(
  platform: NavPlatform,
  pathname: string,
  search: NavQuery = {}
): NavHistoryEntry | null {
  const path = normalizeNavPath(pathname);
  if (platform === "web" && path === "/") return null;
  if (EXCLUDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return null;

  if (platform === "mobile" && (path === "/" || path === "/reading-room")) {
    return readingRoomEntry(platform, search);
  }
  if (path === "/reading-room") return readingRoomEntry(platform, search);

  if (path === "/library") {
    return entry("library", "Library", hrefFor(platform, "/library", search, ["origin"]), "library", "library");
  }

  const shelfMatch = path.match(/^\/library\/([^/]+)$/);
  if (shelfMatch) {
    const slug = decodeURIComponent(shelfMatch[1] ?? "");
    if (slug === "custom") {
      const customSlug = queryValue(search, "slug") ?? "custom";
      return entry(
        `shelf:custom:${customSlug}`,
        "Shelf",
        hrefFor(platform, "/library/custom", { ...search, slug: customSlug }, ["slug", "origin"]),
        "shelf",
        "library"
      );
    }
    const title = SHELF_TITLES[slug] ?? "Shelf";
    return entry(
      `shelf:${slug}`,
      title,
      hrefFor(platform, `/library/${slug}`, search, ["origin"]),
      "shelf",
      "library"
    );
  }

  if (path === "/book") {
    const id = queryValue(search, "id");
    if (!id) return null;
    return entry(
      `book:${id}`,
      "Book",
      hrefFor(platform, "/book", search, ["id", "origin", "section"]),
      "book",
      "book"
    );
  }

  const bookMatch = path.match(/^\/book\/([^/]+)$/);
  if (bookMatch) {
    const id = decodeURIComponent(bookMatch[1] ?? "");
    if (!id || id === "[id]") return null;
    return entry(
      `book:${id}`,
      "Book",
      hrefFor(platform, `/book/${id}`, search, ["origin", "section"]),
      "book",
      "book"
    );
  }

  if (path === "/challenges") {
    return entry(
      "challenges",
      "Challenges",
      hrefFor(platform, "/challenges", search, ["origin"]),
      "challenges",
      "challenges"
    );
  }
  if (path === "/challenges/create") {
    return entry(
      "challenges:create",
      "Create Challenge",
      hrefFor(platform, "/challenges/create", search, ["origin"]),
      "challenges",
      "challenges"
    );
  }
  if (path === "/challenges/challenge") {
    const id = queryValue(search, "id");
    if (!id) return null;
    return entry(
      `challenge:${id}`,
      "Challenge",
      hrefFor(platform, "/challenges/challenge", search, ["id", "origin"]),
      "challenges",
      "challenges"
    );
  }
  const challengeMatch = path.match(/^\/challenges\/([^/]+)$/);
  if (challengeMatch) {
    const id = decodeURIComponent(challengeMatch[1] ?? "");
    if (!id || id === "[id]") return null;
    return entry(
      `challenge:${id}`,
      "Challenge",
      hrefFor(platform, `/challenges/${id}`, search, ["origin"]),
      "challenges",
      "challenges"
    );
  }

  if (path === "/clubs" || path === "/clubs/index") {
    return entry("clubs", "Book Clubs", hrefFor(platform, "/clubs", search, ["origin"]), "clubs", "clubs");
  }
  if (path === "/clubs/new") {
    return entry("clubs:new", "Start a club", hrefFor(platform, "/clubs/new", search, ["origin"]), "clubs", "clubs");
  }
  if (path === "/clubs/club") {
    const id = queryValue(search, "id");
    if (!id) return null;
    return entry(
      `club:${id}`,
      "Book Club",
      hrefFor(platform, "/clubs/club", search, ["id", "origin"]),
      "clubs",
      "clubs"
    );
  }
  const clubMatch = path.match(/^\/clubs\/([^/]+)$/);
  if (clubMatch) {
    const id = decodeURIComponent(clubMatch[1] ?? "");
    return entry(
      `club:${id}`,
      "Book Club",
      hrefFor(platform, `/clubs/${id}`, search, ["origin"]),
      "clubs",
      "clubs"
    );
  }

  if (path === "/search") {
    const cat = queryValue(search, "cat");
    const title = cat === "people" ? "Search People" : cat === "clubs" ? "Search Clubs" : "Search";
    return entry(
      cat ? `search:${cat}` : "search",
      title,
      hrefFor(platform, "/search", search, ["cat", "q", "origin", "scroll", "shelf"]),
      "search",
      "search"
    );
  }

  if (path === "/messages" || path === "/messages/index") {
    return entry("messages", "Messages", hrefFor(platform, "/messages", search, ["origin"]), "messages", "messages");
  }
  if (path === "/messages/thread") {
    const id = queryValue(search, "id");
    if (!id) return null;
    return entry(
      `messages:${id}`,
      "Conversation",
      hrefFor(platform, "/messages/thread", search, ["id"]),
      "messages",
      "messages"
    );
  }
  const messageMatch = path.match(/^\/messages\/([^/]+)$/);
  if (messageMatch) {
    const id = decodeURIComponent(messageMatch[1] ?? "");
    return entry(
      `messages:${id}`,
      "Conversation",
      hrefFor(platform, `/messages/${id}`, {}, []),
      "messages",
      "messages"
    );
  }

  if (path === "/profile") {
    return entry("profile", "Profile", hrefFor(platform, "/profile", {}, []), "profile", "profile");
  }
  if (path === "/profile/settings" || path === "/settings") {
    const settingsPath = path === "/settings" ? "/settings" : "/profile/settings";
    return entry("settings", "Settings", hrefFor(platform, settingsPath, {}, []), "settings", "profile");
  }
  if (path === "/profile-edit") {
    return entry("profile:edit", "Edit Profile", hrefFor(platform, "/profile-edit", {}, []), "profile", "profile");
  }

  if (path === "/feed") {
    return entry("feed", "Community", hrefFor(platform, "/feed", search, ["origin"]), "feed", "feed");
  }
  if (path === "/discover") {
    return entry("discover", "Discover", hrefFor(platform, "/discover", {}, []), "discover", "discover");
  }
  if (path === "/events") {
    return entry("events", "Events", hrefFor(platform, "/events", {}, []), "events", "events");
  }
  if (path === "/book-map") {
    return entry("book-map", "Book Map", hrefFor(platform, "/book-map", {}, []), "map", "map");
  }
  if (path === "/reader-map") {
    return entry("reader-map", "Reader Map", hrefFor(platform, "/reader-map", {}, []), "map", "map");
  }
  if (path === "/notes") {
    return entry("notes", "Notes", hrefFor(platform, "/notes", search, ["origin"]), "notes", "notes");
  }

  const segments = path.split("/").filter(Boolean);
  const head = segments[0];
  if (!head) return null;
  const known: Record<string, { title: string; icon: NavHistoryIcon }> = {
    notifications: { title: "Notifications", icon: "generic" },
    "notification-preferences": { title: "Notifications", icon: "settings" },
    "reading-dna": { title: "Reading DNA", icon: "generic" },
    upgrade: { title: "Membership", icon: "generic" },
    "quote-graphics": { title: "Quote Graphics", icon: "generic" },
    "quote-scanner": { title: "Quote Scanner", icon: "generic" },
    wrapped: { title: "Wrapped", icon: "generic" },
    "wrapped-month": { title: "Wrapped", icon: "generic" },
    "home-hub": { title: "Home", icon: "overview" },
    concierge: { title: "Concierge", icon: "generic" },
    author: { title: "Author", icon: "generic" },
    series: { title: "Series", icon: "generic" },
    reader: { title: "Reader", icon: "profile" },
    "reader-library": { title: "Library", icon: "library" },
    "shelf-privacy": { title: "Shelf Privacy", icon: "settings" },
  };
  const meta = known[head];
  if (!meta) return null;
  const tail = segments[1];
  const key = tail && !looksLikeId(tail) ? `${head}:${tail}` : tail ? `${head}:${tail}` : head;
  return entry(key, meta.title, hrefFor(platform, path, search, ["origin", "id", "username"]), meta.icon, head);
}
