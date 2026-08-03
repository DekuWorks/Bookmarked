import { create } from "zustand";

type PendingDeepLinkState = {
  path: string | null;
  setPending: (path: string | null) => void;
  consume: () => string | null;
};

/** Survives auth redirects so shared links open after sign-in. */
export const usePendingDeepLinkStore = create<PendingDeepLinkState>((set, get) => ({
  path: null,
  setPending: (path) => set({ path }),
  consume: () => {
    const path = get().path;
    set({ path: null });
    return path;
  },
}));
