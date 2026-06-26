"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signup, type AuthActionState } from "@/lib/auth/actions";
import { RememberMeField } from "@/components/auth/RememberMeField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

const initial: AuthActionState = {};

export function SignupForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signup, initial);

  useEffect(() => {
    if (state.redirect) router.replace(state.redirect);
  }, [state.redirect, router]);

  return (
    <form action={formAction} className="w-full max-w-md">
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        required
      />
      <RememberMeField />
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
        Create account
      </Button>
      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
