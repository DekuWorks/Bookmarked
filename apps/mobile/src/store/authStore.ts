import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

type AuthState = {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  setInitialized: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,
  setSession: (session) =>
    set({ session, user: session?.user ?? null }),
  setInitialized: (initialized) => set({ initialized }),
}));
