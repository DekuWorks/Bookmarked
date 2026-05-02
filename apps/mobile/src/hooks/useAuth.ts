import { useEffect } from "react";
import { queryClient } from "../lib/queryClient";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../store/authStore";

export function useAuthBootstrap() {
  const setSession = useAuthStore((s) => s.setSession);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setSession(session);
      setInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setSession, setInitialized]);
}

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  return {
    session,
    user,
    signOut: () => supabase.auth.signOut(),
  };
}
