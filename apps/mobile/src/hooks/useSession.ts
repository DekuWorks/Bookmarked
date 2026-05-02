import { useAuthStore } from "../store/authStore";

export function useSession() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  return { session, user, initialized };
}
