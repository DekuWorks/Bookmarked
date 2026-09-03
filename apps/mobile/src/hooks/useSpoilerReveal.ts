import { useEffect, useRef, useState } from "react";
import {
  initialSpoilerRevealState,
  remainingSpoilerHideMs,
  toggleSpoilerReveal,
  type SpoilerRevealState,
} from "../../../../packages/utils";

/** Tap to reveal, tap to hide, auto re-hide. Resets the timer on each toggle. */
export function useSpoilerReveal() {
  const [state, setState] = useState<SpoilerRevealState>(initialSpoilerRevealState);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const remaining = remainingSpoilerHideMs(state);
    if (remaining <= 0) return;
    timerRef.current = setTimeout(() => {
      setState(initialSpoilerRevealState());
    }, remaining);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state]);

  function toggle() {
    setState((current) => toggleSpoilerReveal(current));
  }

  return { revealed: state.revealed, toggle };
}
