"use client";

import { useActionState, useEffect, useState } from "react";
import { updatePassword, type AuthActionState } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { layout } from "@/lib/constants/layout";
import Link from "next/link";

const initial: AuthActionState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initial);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (state.redirect) staticRedirect(state.redirect);
  }, [state.redirect]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let handled = false;

    function markReady(sessionPresent: boolean) {
      if (cancelled || handled) return;
      handled = true;
      setHasSession(sessionPresent);
      setReady(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        markReady(Boolean(session));
      }
    });

    // Hash tokens from the email link can take a moment; fall back to getSession.
    const fallback = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        markReady(Boolean(session));
      });
    }, 2000);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return <LoadingState message="Verifying reset link…" />;
  }

  if (!hasSession) {
    return (
      <div className={`${layout.formPanel} w-full text-center`}>
        <p className="text-sm text-rust" role="alert">
          This reset link is invalid or has expired.
        </p>
        <p className="mt-4 text-sm text-text-muted">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Request a new reset email
          </Link>
          {" · "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className={`${layout.formPanel} w-full`}>
      <Input
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        required
      />
      <Input
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={6}
        required
      />
      {state.error ? (
        <p className="mb-4 text-sm text-rust" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" className="w-full" loading={pending}>
        Update password
      </Button>
    </form>
  );
}
