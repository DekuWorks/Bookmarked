import { useEffect, useRef, useState } from "react";
import {
  SUBSCRIPTION_ACTIVATION_POLL_INTERVAL_MS,
  SUBSCRIPTION_ACTIVATION_POLL_TIMEOUT_MS,
} from "../../../../packages/utils/subscriptionPolling";

type Options = {
  enabled: boolean;
  isPremium: boolean;
  refetch: () => Promise<unknown>;
  onActivated?: () => void;
  onTimeout?: () => void;
};

export function useSubscriptionActivationPoll({
  enabled,
  isPremium,
  refetch,
  onActivated,
  onTimeout,
}: Options) {
  const [timedOut, setTimedOut] = useState(false);
  const activatedRef = useRef(false);
  const onActivatedRef = useRef(onActivated);
  const onTimeoutRef = useRef(onTimeout);

  onActivatedRef.current = onActivated;
  onTimeoutRef.current = onTimeout;

  const shouldPoll = enabled && !isPremium;
  const activating = shouldPoll && !timedOut;

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    let cancelled = false;
    setTimedOut(false);
    activatedRef.current = false;

    void refetch();

    const interval = setInterval(() => {
      void refetch();
    }, SUBSCRIPTION_ACTIVATION_POLL_INTERVAL_MS);

    const timeout = setTimeout(() => {
      if (cancelled || activatedRef.current) return;
      setTimedOut(true);
      onTimeoutRef.current?.();
    }, SUBSCRIPTION_ACTIVATION_POLL_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [shouldPoll, refetch]);

  useEffect(() => {
    if (!enabled || !isPremium || activatedRef.current) return;

    activatedRef.current = true;
    onActivatedRef.current?.();
  }, [enabled, isPremium]);

  return { activating, timedOut };
}
