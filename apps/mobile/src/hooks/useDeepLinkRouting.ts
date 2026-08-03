import { useEffect } from "react";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { mapInboundUrlToAppPath } from "../utils/deepLinks";
import { useAuthStore } from "../store/authStore";
import { usePendingDeepLinkStore } from "../store/pendingDeepLinkStore";

/**
 * Handles universal links / custom scheme URLs.
 * Authenticated users navigate immediately; others stash the path for post-login.
 */
export function useDeepLinkRouting() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);
  const setPending = usePendingDeepLinkStore((s) => s.setPending);

  useEffect(() => {
    if (!initialized) return;

    function handleUrl(url: string | null) {
      if (!url) return;
      const path = mapInboundUrlToAppPath(url);
      if (!path) return;

      if (session) {
        router.push(path as never);
      } else {
        setPending(path);
      }
    }

    void Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [initialized, session, router, setPending]);
}
