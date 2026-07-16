"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { layout } from "@/lib/constants/layout";
import Link from "next/link";

const initial: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initial);

  return (
    <form action={formAction} className={`${layout.formPanel} w-full`}>
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      {state.error ? (
        <p className="mb-4 text-sm text-rust" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mb-4 text-sm text-puce-red" role="status">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" className="w-full" loading={pending}>
        Send reset link
      </Button>
      <p className="mt-6 text-center text-sm text-text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
