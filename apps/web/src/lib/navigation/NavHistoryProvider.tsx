"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  adoptRicherNavHistory,
  canPopWithinSession,
  emptyNavHistory,
  focusNavHistory,
  NAV_HISTORY_STORAGE_KEY,
  parseNavHistory,
  previousNavEntries,
  recordNavVisit,
  renameNavEntryIfCurrent,
  resolveNavScreen,
  serializeNavHistory,
  syncNavVisit,
  truncateNavHistory,
  type NavHistoryEntry,
  type NavHistoryState,
} from "@bookmarked/utils/navigationHistory";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

type NavHistoryApi = {
  previous: Array<NavHistoryEntry & { index: number }>;
  jump: (index: number) => void;
  renameCurrent: (key: string, title: string) => void;
};

const EMPTY: NavHistoryApi = {
  previous: [],
  jump: () => undefined,
  renameCurrent: () => undefined,
};

const NavHistoryContext = createContext<NavHistoryApi | null>(null);

let pendingPop = false;
let initialPop: boolean | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    pendingPop = true;
  });
}

/**
 * Client popstate can fire while the provider is unmounted. A document restore is `back_forward`.
 * The flag stays set through React strict-mode's double effect, then clears on a timer.
 */
function peekNavKind(): "push" | "pop" {
  if (pendingPop) return "pop";
  if (initialPop === null && typeof performance !== "undefined") {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    initialPop = nav?.type === "back_forward";
  }
  return initialPop ? "pop" : "push";
}

function scheduleNavKindClear() {
  window.setTimeout(() => {
    pendingPop = false;
    initialPop = false;
  }, 0);
}

function searchRecord(params: URLSearchParams): Record<string, string | undefined> {
  return {
    id: params.get("id") ?? undefined,
    tab: params.get("tab") ?? undefined,
    origin: params.get("origin") ?? undefined,
    q: params.get("q") ?? undefined,
    scroll: params.get("scroll") ?? undefined,
    slug: params.get("slug") ?? undefined,
    section: params.get("section") ?? undefined,
    cat: params.get("cat") ?? undefined,
    shelf: params.get("shelf") ?? undefined,
    username: params.get("username") ?? undefined,
  };
}

export function NavHistoryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthUser();
  const userId = user?.id ?? null;
  const authReady = user !== undefined;
  const [state, setState] = useState<NavHistoryState>(() => emptyNavHistory(null));
  const stateRef = useRef(state);
  const anchorRef = useRef<number | null>(null);
  const allowShrinkRef = useRef(false);
  const searchKey = searchParams.toString();

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!authReady) return;

    if (!userId) {
      // A session flicker must not erase the stored stack. Logout clears it.
      anchorRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hide history while signed out
      setState((current) => (current.entries.length === 0 ? current : emptyNavHistory(null)));
      return;
    }

    const entry = resolveNavScreen("web", pathname, searchRecord(searchParams));
    const kind = peekNavKind();
    scheduleNavKindClear();

    setState((current) => {
      const stored = parseNavHistory(sessionStorage.getItem(NAV_HISTORY_STORAGE_KEY), userId);
      const memory = current.userId === userId ? current : emptyNavHistory(userId);
      const base = allowShrinkRef.current ? memory : adoptRicherNavHistory(memory, stored);
      const next =
        kind === "pop"
          ? entry
            ? syncNavVisit(base, entry)
            : base
          : recordNavVisit(base, entry, userId);
      if (anchorRef.current === null) anchorRef.current = Math.max(0, next.index);
      return next;
    });
  }, [authReady, pathname, searchKey, searchParams, userId]);

  useEffect(() => {
    if (!state.userId) return;
    allowShrinkRef.current = false;
    sessionStorage.setItem(NAV_HISTORY_STORAGE_KEY, serializeNavHistory(state));
  }, [state]);

  const api = useMemo<NavHistoryApi>(() => {
    return {
      previous: previousNavEntries(state),
      renameCurrent(key: string, title: string) {
        setState((current) => renameNavEntryIfCurrent(current, key, title));
      },
      jump(index: number) {
        const current = stateRef.current;
        const target = current.entries[index];
        if (!target || index >= current.index) return;
        if (canPopWithinSession(index, current.index, anchorRef.current ?? 0)) {
          pendingPop = true;
          setState((existing) => focusNavHistory(existing, index));
          window.history.go(index - current.index);
          return;
        }
        anchorRef.current = index;
        allowShrinkRef.current = true;
        setState((existing) => truncateNavHistory(existing, index));
        router.push(target.href);
      },
    };
  }, [router, state]);

  return <NavHistoryContext.Provider value={api}>{children}</NavHistoryContext.Provider>;
}

export function useNavHistory(): NavHistoryApi {
  return useContext(NavHistoryContext) ?? EMPTY;
}

/** Replace the current history label once that route is the recorded screen. */
export function useNavHistoryTitle(key: string, title: string | null | undefined) {
  const { renameCurrent } = useNavHistory();
  useEffect(() => {
    if (key && title?.trim()) renameCurrent(key, title);
  }, [key, renameCurrent, title]);
}
