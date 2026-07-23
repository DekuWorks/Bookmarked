"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";

type ActionFeedback = {
  error?: string;
  success?: string;
};

/**
 * Show a toast once per unique action result. Avoids infinite re-toasts when
 * parent re-renders change unstable callback deps in a useEffect.
 */
export function useActionToast(
  state: ActionFeedback,
  onSuccess?: () => void
): void {
  const toast = useToast();
  const onSuccessRef = useRef(onSuccess);
  const lastConsumedRef = useRef<string | null>(null);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    const message = state.error ?? state.success;
    if (!message) {
      lastConsumedRef.current = null;
      return;
    }

    const token = `${state.error ? "e" : "s"}:${message}`;
    if (lastConsumedRef.current === token) return;
    lastConsumedRef.current = token;

    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      onSuccessRef.current?.();
    }
  }, [state.error, state.success, toast]);
}
