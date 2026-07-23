"use client";

import { useActionState, useEffect, useState } from "react";
import { signup, type AuthActionState } from "@/lib/auth/actions";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
import { RememberMeField } from "@/components/auth/RememberMeField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { layout } from "@/lib/constants/layout";
import Link from "next/link";

const initial: AuthActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initial);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (state.redirect) staticRedirect(state.redirect);
  }, [state.redirect]);

  return (
    <form action={formAction} className={`${layout.formPanel} w-full`}>
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
      <label className="mb-4 flex items-start gap-2 text-left text-sm text-text-muted">
        <input
          type="checkbox"
          name="accept_terms"
          value="1"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          required
          className="mt-1"
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/terms#community" className="font-medium text-primary hover:underline">
            Community Guidelines
          </Link>
          , including zero tolerance for objectionable content and abusive users.
        </span>
      </label>
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
      <Button type="submit" variant="secondary" className="w-full" loading={pending} disabled={!acceptedTerms}>
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
