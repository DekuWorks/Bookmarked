"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, type AuthActionState } from "@/lib/auth/actions";
import { RememberMeField } from "@/components/auth/RememberMeField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { layout } from "@/lib/constants/layout";
import Link from "next/link";

const initial: AuthActionState = {};

type Props = {
  redirect?: string;
};

export function LoginForm({ redirect }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(login, initial);

  useEffect(() => {
    if (state.redirect) router.replace(state.redirect);
  }, [state.redirect, router]);

  return (
    <form action={formAction} className={`${layout.formPanel} w-full`}>
      {redirect ? <input type="hidden" name="redirect" value={redirect} /> : null}
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <RememberMeField />
      {state.error ? (
        <p className="mb-4 text-sm text-rust" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" className="w-full" loading={pending}>
        Log in
      </Button>
      <p className="mt-6 text-center text-sm text-text-muted">
        No account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
