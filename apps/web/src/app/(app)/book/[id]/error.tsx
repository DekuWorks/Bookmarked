"use client";

import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function BookDetailsError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface p-8 text-center">
      <h1 className="text-xl font-semibold text-puce-red">Could not load this book</h1>
      <p className="mt-2 text-sm text-text-muted">
        Something went wrong while fetching book details. Please try again.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="text-sm font-medium text-primary hover:underline"
        >
          Try again
        </button>
        <ButtonLink href="/library" variant="outline" size="sm">
          Back to library
        </ButtonLink>
      </div>
    </div>
  );
}
