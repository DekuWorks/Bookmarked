import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useGlobalSearchParams, usePathname, useRouter } from "expo-router";
import {
  emptyNavHistory,
  previousNavEntries,
  recordNavVisit,
  renameNavEntryIfCurrent,
  resolveNavScreen,
  stacksToReset,
  truncateNavHistory,
  type NavHistoryEntry,
  type NavHistoryState,
  type NavQuery,
} from "../../../../packages/utils/navigationHistory";
import { useAuthStore } from "../store/authStore";
import { requestStackReset } from "./navStackReset";

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

function first(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

const QUERY_KEYS = ["id", "tab", "origin", "q", "scroll", "slug", "section", "trail", "cat", "shelf", "username"] as const;

export function NavHistoryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [state, setState] = useState<NavHistoryState>(() => emptyNavHistory(null));
  const stateRef = useRef(state);
  const jumpRef = useRef<number | null>(null);
  stateRef.current = state;

  const searchKey = QUERY_KEYS.map((key) => first(params[key]) ?? "").join("|");

  useEffect(() => {
    if (!userId) {
      jumpRef.current = null;
      setState(emptyNavHistory(null));
      return;
    }

    const search: NavQuery = {};
    for (const key of QUERY_KEYS) search[key] = first(params[key]);
    const entry = resolveNavScreen("mobile", pathname, search);
    const pending = jumpRef.current;

    if (pending != null) {
      const target = stateRef.current.entries[pending];
      if (entry && target && entry.key === target.key) {
        jumpRef.current = null;
        setState((current) => truncateNavHistory(current, pending));
        return;
      }
      if (entry && target && entry.key !== target.key) {
        const seen = stateRef.current.entries.findIndex((item) => item.key === entry.key);
        const movingToward = seen >= pending && seen < stateRef.current.index;
        if (!movingToward) {
          jumpRef.current = null;
          setState((current) => recordNavVisit(current, entry, userId));
        }
      }
      return;
    }

    setState((current) => recordNavVisit(current, entry, userId));
  }, [pathname, searchKey, userId]);

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
        const removed = current.entries.slice(index + 1);
        for (const stack of stacksToReset(removed, target)) requestStackReset(stack);
        jumpRef.current = index;
        router.dismissTo(target.href as never);
      },
    };
  }, [router, state]);

  return <NavHistoryContext.Provider value={api}>{children}</NavHistoryContext.Provider>;
}

export function useNavHistory(): NavHistoryApi {
  return useContext(NavHistoryContext) ?? EMPTY;
}
