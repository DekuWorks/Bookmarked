"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

const initial: AuthActionState = {};

export function ProfileSetupForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveProfile, initial);

  useEffect(() => {
    if (state.redirect) router.replace(state.redirect);
  }, [state.redirect, router]);

  return (
    <form action={formAction} className="w-full max-w-lg">
      <Input label="Username" name="username" autoComplete="username" required />
      <Input label="Display name" name="display_name" autoComplete="name" />
      <Textarea label="Bio" name="bio" placeholder="A few words about your reading taste…" />
      <Input
        label="Favorite genres"
        name="favorite_genres"
        placeholder="fiction, fantasy, memoir"
      />
      <p className="-mt-2 mb-4 text-xs text-text-muted">Separate genres with commas.</p>
      {state.error ? (
        <p className="mb-4 text-sm text-rust" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" className="w-full" loading={pending}>
        Save and continue
      </Button>
    </form>
  );
}
