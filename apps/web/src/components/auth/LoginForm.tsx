"use client";

import { useActionState, useEffect, useState } from "react";
import { login, type AuthActionState } from "@/lib/auth/actions";
import { getRememberedEmail, isRememberMeEnabled } from "@/lib/auth/rememberMe";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
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
  const [state, formAction, pending] = useActionState(login, initial);
  const [rememberedEmail, setRememberedEmail] = useState("");
  const [rememberDefault, setRememberDefault] = useState(true);

  useEffect(() => {
    setRememberDefault(isRememberMeEnabled());
    setRememberedEmail(getRememberedEmail());
  }, []);

  useEffect(() => {
    if (state.redirect) staticRedirect(state.redirect);
  }, [state.redirect]);

  return (
    <form action={formAction} className={`${layout.formPanel} w-full`}>
      {redirect ? <input type="hidden" name="redirect" value={redirect} /> : null}
      <Input
        key={rememberedEmail || "email"}
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={rememberedEmail}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <RememberMeField defaultChecked={rememberDefault} />
      {state.error ? (
        <p className="mb-4 text-sm text-rust" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" className="w-full" loading={pending}>
        Log in
      </Button>
      <p className="mt-4 text-center text-xs text-text-muted">
        By logging in, you agree to our{" "}
        <Link href="/terms" className="font-medium text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/terms#community" className="font-medium text-primary hover:underline">
          Community Guidelines
        </Link>
        .
      </p>
      <p className="mt-4 text-center text-sm text-text-muted">
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Forgot password?
        </Link>
      </p>
      <p className="mt-4 text-center text-sm text-text-muted">
        No account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
