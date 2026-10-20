import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { consumeStackReset } from "./navStackReset";

/** Pop nested screens when a history jump returns to this stack's root. */
export function useNavStackReset(stack: string) {
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      if (!consumeStackReset(stack)) return;
      if (router.canDismiss()) router.dismissAll();
    }, [router, stack])
  );
}
