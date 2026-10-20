import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  adoptRicherNavHistory,
  canPopWithinSession,
  emptyNavHistory,
  focusNavHistory,
  parseNavHistory,
  previousNavEntries,
  recordNavVisit,
  renameNavEntryIfCurrent,
  resolveNavScreen,
  serializeNavHistory,
  stacksToReset,
  syncNavVisit,
  truncateNavHistory,
  type NavHistoryEntry,
} from "./navigationHistory";
import { originBackLink, UNIVERSAL_BACK_LINK_LABEL, UNIVERSAL_BACK_VISIBLE_LABEL } from "./navigationOrigin";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function source(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function screen(
  platform: "web" | "mobile",
  pathname: string,
  search: Record<string, string | undefined> = {}
): NavHistoryEntry {
  const entry = resolveNavScreen(platform, pathname, search);
  if (!entry) throw new Error(`expected screen for ${pathname}`);
  return entry;
}

function visit(path: string[], platform: "web" | "mobile" = "web") {
  return path.reduce(
    (state, pathname) => recordNavVisit(state, screen(platform, pathname), "user-a"),
    emptyNavHistory("user-a")
  );
}

describe("navigation history", () => {
  it("A: Overview → Library → TBR → Book shows TBR, Library, Overview", () => {
    const book = recordNavVisit(
      visit(["/reading-room/", "/library/", "/library/want-to-read/"]),
      screen("web", "/book/", { id: "book-1" }),
      "user-a"
    );
    expect(book.entries.map((entry) => entry.title)).toEqual(["Overview", "Library", "TBR", "Book"]);
    expect(previousNavEntries(book).map((entry) => entry.title)).toEqual(["TBR", "Library", "Overview"]);
    expect(previousNavEntries(book).map((entry) => entry.key)).toEqual([
      "shelf:want-to-read",
      "library",
      "reading-room:overview",
    ]);
  });

  it("B: choosing Overview from Book Details returns directly to Overview", () => {
    const book = recordNavVisit(
      visit(["/reading-room/", "/library/", "/library/want-to-read/"]),
      screen("web", "/book/", { id: "book-1" }),
      "user-a"
    );
    const overview = previousNavEntries(book).find((entry) => entry.title === "Overview");
    const next = truncateNavHistory(book, overview?.index ?? -1);
    expect(next.entries.map((entry) => entry.title)).toEqual(["Overview"]);
    expect(previousNavEntries(next)).toEqual([]);
    expect(next.entries.some((entry) => entry.key.startsWith("book:"))).toBe(false);
  });

  it("C: choosing Library from Book Details returns directly to Library", () => {
    const book = recordNavVisit(
      visit(["/reading-room/", "/library/", "/library/want-to-read/"]),
      screen("web", "/book/", { id: "book-1" }),
      "user-a"
    );
    const library = previousNavEntries(book).find((entry) => entry.title === "Library");
    const next = truncateNavHistory(book, library?.index ?? -1);
    expect(next.entries.map((entry) => entry.title)).toEqual(["Overview", "Library"]);
    expect(previousNavEntries(next).map((entry) => entry.title)).toEqual(["Overview"]);
    expect(stacksToReset(book.entries.slice((library?.index ?? 0) + 1), next.entries[next.index]!)).toEqual([
      "library",
    ]);
  });

  it("D: a direct book link has no fabricated history", () => {
    const state = recordNavVisit(
      emptyNavHistory("user-a"),
      screen("web", "/book/", { id: "deep" }),
      "user-a"
    );
    expect(previousNavEntries(state)).toEqual([]);
    expect(resolveNavScreen("web", "/book/")).toBeNull();
  });

  it("E: Update Progress keeps the Overview origin on the book href", () => {
    const book = screen("web", "/book/", { id: "book-9", origin: "reading_room_overview" });
    expect(book.href).toContain("id=book-9");
    expect(book.href).toContain("origin=reading_room_overview");
    expect(book.key).toBe("book:book-9");
  });

  it("I: four or more previous screens still show only three", () => {
    const state = visit([
      "/reading-room/",
      "/library/",
      "/library/want-to-read/",
      "/library/read/",
      "/search/",
    ]);
    expect(previousNavEntries(state)).toHaveLength(3);
    expect(previousNavEntries(state).map((entry) => entry.title)).toEqual([
      "Finished",
      "TBR",
      "Library",
    ]);
  });

  it("K: another account cannot read the stored history", () => {
    const state = visit(["/reading-room/", "/library/"]);
    const raw = serializeNavHistory(state);
    expect(parseNavHistory(raw, "user-b").entries).toEqual([]);
    expect(parseNavHistory(raw, "user-a").entries.map((entry) => entry.key)).toEqual([
      "reading-room:overview",
      "library",
    ]);
    const switched = recordNavVisit(state, screen("web", "/profile/"), "user-b");
    expect(switched.userId).toBe("user-b");
    expect(switched.entries.map((entry) => entry.key)).toEqual(["profile"]);
  });

  it("L: browser back and forward move along existing entries", () => {
    const forward = visit(["/reading-room/", "/library/", "/library/dnf/"]);
    const back = syncNavVisit(forward, screen("web", "/library/"));
    expect(back.index).toBe(1);
    expect(back.entries).toHaveLength(3);
    const again = syncNavVisit(back, screen("web", "/library/dnf/"));
    expect(again.index).toBe(2);
    expect(previousNavEntries(again).map((entry) => entry.title)).toEqual(["Library", "Overview"]);
  });

  it("ignores rerenders, modals, and consecutive duplicates", () => {
    const once = recordNavVisit(emptyNavHistory("user-a"), screen("web", "/library/"), "user-a");
    const twice = recordNavVisit(once, screen("web", "/library/", { origin: "reading_room_overview" }), "user-a");
    expect(twice.entries).toHaveLength(1);
    expect(twice.entries[0]?.href).toContain("origin=reading_room_overview");
    expect(resolveNavScreen("web", "/compose")).toBeNull();
    expect(resolveNavScreen("mobile", "/profile-setup")).toBeNull();
    expect(recordNavVisit(twice, null, "user-a")).toBe(twice);
  });

  it("keeps a repeated visit instead of deleting the earlier one", () => {
    const state = visit(["/reading-room/", "/library/", "/reading-room/", "/library/"]);
    expect(state.entries.map((entry) => entry.key)).toEqual([
      "reading-room:overview",
      "library",
      "reading-room:overview",
      "library",
    ]);
    expect(previousNavEntries(state).map((entry) => entry.title)).toEqual([
      "Overview",
      "Library",
      "Overview",
    ]);
  });

  it("maps the sprint path on iPhone routes", () => {
    const state = [
      ["/", { tab: "overview" }],
      ["/library", { origin: "reading_room_overview" }],
      ["/library/want-to-read", { origin: "library_shelf" }],
      ["/book/book-1", { origin: "reading_room_overview" }],
    ].reduce(
      (current, [pathname, search]) =>
        recordNavVisit(
          current,
          screen("mobile", String(pathname), search as Record<string, string>),
          "user-a"
        ),
      emptyNavHistory("user-a")
    );
    expect(previousNavEntries(state).map((entry) => entry.title)).toEqual(["TBR", "Library", "Overview"]);
    expect(state.entries[3]?.href).toBe("/book/book-1?origin=reading_room_overview");
  });

  it("only uses history.go inside the current document session", () => {
    expect(canPopWithinSession(1, 3, 0)).toBe(true);
    expect(canPopWithinSession(0, 3, 2)).toBe(false);
    expect(canPopWithinSession(3, 3, 0)).toBe(false);
  });

  it("does not rename a screen that is not the current route", () => {
    const state = visit(["/library/"]);
    const same = renameNavEntryIfCurrent(state, "book:1", "Piranesi");
    expect(same).toBe(state);
    const book = recordNavVisit(state, screen("web", "/book/", { id: "1" }), "user-a");
    const named = renameNavEntryIfCurrent(book, "book:1", "Piranesi");
    expect(named.entries[1]?.title).toBe("Piranesi");
    expect(named.entries[0]?.title).toBe("Library");
  });

  it("focus keeps forward entries and truncate removes them", () => {
    const state = visit(["/feed/", "/search/", "/clubs/"]);
    expect(focusNavHistory(state, 0).entries).toHaveLength(3);
    expect(truncateNavHistory(state, 0).entries.map((entry) => entry.title)).toEqual(["Community"]);
  });

  it("fills an empty stack from storage and keeps a shorter real visit", () => {
    const stored = visit(["/reading-room/", "/library/", "/library/want-to-read/"]);
    const filled = adoptRicherNavHistory(emptyNavHistory("user-a"), stored);
    expect(filled.entries.map((entry) => entry.title)).toEqual(["Overview", "Library", "TBR"]);
    const memory = visit(["/library/"]);
    expect(adoptRicherNavHistory(memory, stored)).toBe(memory);
    expect(adoptRicherNavHistory(emptyNavHistory("user-a"), { ...stored, userId: "user-b" }).entries).toEqual([]);
  });

  it("does not reset a shelf stack when the destination is that shelf", () => {
    const book = recordNavVisit(
      visit(["/library/", "/library/want-to-read/"]),
      screen("web", "/book/", { id: "b" }),
      "user-a"
    );
    const tbr = previousNavEntries(book)[0];
    expect(tbr?.key).toBe("shelf:want-to-read");
    expect(stacksToReset(book.entries.slice((tbr?.index ?? 0) + 1), book.entries[tbr?.index ?? 0]!)).toEqual([]);
  });
});

function visitSearch(
  steps: Array<[string, Record<string, string | undefined>]>,
  platform: "web" | "mobile" = "web"
) {
  return steps.reduce(
    (state, [pathname, search]) => recordNavVisit(state, screen(platform, pathname, search), "user-a"),
    emptyNavHistory("user-a")
  );
}

describe("universal back label", () => {
  it("keeps the visible words exactly Back to", () => {
    expect(UNIVERSAL_BACK_VISIBLE_LABEL).toBe("Back to");
    expect(UNIVERSAL_BACK_LINK_LABEL).toBe("← Back to");
    expect(UNIVERSAL_BACK_VISIBLE_LABEL).not.toMatch(/Library|Overview|Reviews/);
  });

  it("A: Overview → Reviews → Book Details returns to Reviews", () => {
    const state = visitSearch([
      ["/reading-room/", {}],
      ["/reading-room/", { tab: "reviews" }],
      ["/book/", { id: "book-1" }],
    ]);
    const previous = previousNavEntries(state);
    expect(previous[0]?.title).toBe("Reviews");
    expect(previous[0]?.href).toContain("tab=reviews");
    expect(previous.map((entry) => entry.title)).toEqual(["Reviews", "Overview"]);
    expect(UNIVERSAL_BACK_VISIBLE_LABEL).toBe("Back to");

    const mobile = visitSearch(
      [
        ["/", { tab: "overview" }],
        ["/", { tab: "reviews" }],
        ["/book/book-1", {}],
      ],
      "mobile"
    );
    expect(previousNavEntries(mobile).map((entry) => entry.title)).toEqual(["Reviews", "Overview"]);
  });

  it("B: Overview → Library → TBR → Book Details returns to TBR", () => {
    const state = visitSearch([
      ["/reading-room/", {}],
      ["/library/", {}],
      ["/library/want-to-read/", {}],
      ["/book/", { id: "book-1" }],
    ]);
    const previous = previousNavEntries(state);
    expect(previous[0]?.title).toBe("TBR");
    expect(previous.map((entry) => entry.title)).toEqual(["TBR", "Library", "Overview"]);
    expect(previous.map((entry) => entry.key)).toEqual([
      "shelf:want-to-read",
      "library",
      "reading-room:overview",
    ]);
  });

  it("C: Overview → Challenges returns to Overview without a destination label", () => {
    const state = visitSearch([
      ["/reading-room/", {}],
      ["/challenges/", { origin: "reading_room_overview" }],
    ]);
    expect(previousNavEntries(state).map((entry) => entry.title)).toEqual(["Overview"]);
    const back = originBackLink("reading_room_overview", "web", {
      href: "/profile/",
      label: "← Back to Profile",
    });
    expect(back.label).toBe("← Back to");
    expect(back.href).toBe("/reading-room/");
  });

  it("D: Community, Discover, and Profile keep their own previous page", () => {
    const community = visitSearch([
      ["/reading-room/", {}],
      ["/feed/", {}],
    ]);
    expect(previousNavEntries(community)[0]?.title).toBe("Overview");
    expect(resolveNavScreen("web", "/feed/")?.title).toBe("Community");

    const discover = visitSearch([
      ["/feed/", {}],
      ["/discover/", {}],
    ]);
    expect(previousNavEntries(discover)[0]?.title).toBe("Community");
    expect(resolveNavScreen("web", "/discover/")?.title).toBe("Discover");

    const profile = visitSearch([
      ["/discover/", {}],
      ["/profile/", {}],
    ]);
    expect(previousNavEntries(profile)[0]?.title).toBe("Discover");
    expect(resolveNavScreen("web", "/profile/")?.title).toBe("Profile");

    for (const file of [
      "apps/web/src/app/(app)/feed/page.tsx",
      "apps/web/src/app/(app)/discover/page.tsx",
      "apps/web/src/app/(app)/profile/page.tsx",
      "apps/mobile/app/(app)/feed.tsx",
      "apps/mobile/app/(app)/discover.tsx",
      "apps/mobile/app/(app)/profile.tsx",
    ]) {
      expect(source(file)).not.toContain("Back to Library");
    }
  });

  it("E: a direct deep link keeps the safe fallback href and drops the destination name", () => {
    const state = recordNavVisit(
      emptyNavHistory("user-a"),
      screen("web", "/book/", { id: "deep" }),
      "user-a"
    );
    expect(previousNavEntries(state)).toEqual([]);
    const back = originBackLink(null, "web", {
      href: "/library/",
      label: "← Back to Library",
    });
    expect(back.href).toBe("/library/");
    expect(back.label).toBe("← Back to");
    expect(back.origin).toBeNull();
  });

  it("does not print a destination on the shared Back controls", () => {
    const backNav = source("apps/web/src/components/ui/BackNav.tsx");
    expect(backNav).toContain("UNIVERSAL_BACK_LINK_LABEL");
    expect(backNav).not.toContain("Back to {label}");
    expect(backNav).not.toMatch(/Back to (Library|Overview|Reviews)/);

    const header = source("apps/mobile/src/components/ScreenHeader.tsx");
    expect(header).toContain("UNIVERSAL_BACK_VISIBLE_LABEL");
    expect(header).not.toMatch(/Back to (Library|Overview|Reviews)/);

    const library = source("apps/mobile/app/(app)/library/index.tsx");
    expect(library).toContain("UNIVERSAL_BACK_VISIBLE_LABEL");
    expect(library).not.toContain("Back to Overview");
  });
});
