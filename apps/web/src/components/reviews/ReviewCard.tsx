"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  displayName: string;
  rating?: number | null;
  reviewBody?: string | null;
  hasSpoilers?: boolean;
  createdAt?: string;
};

export function ReviewCard({
  displayName,
  rating,
  reviewBody,
  hasSpoilers,
  createdAt,
}: Props) {
  const [revealed, setRevealed] = useState(!hasSpoilers);

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-semibold text-puce-red">{displayName}</span>
        {rating != null ? (
          <span className="text-sm text-royal-orange">
            {"★".repeat(Math.round(rating))}
            {"☆".repeat(5 - Math.round(rating))}
          </span>
        ) : null}
        {hasSpoilers ? (
          <span className="rounded-full bg-rust/15 px-2 py-0.5 text-xs text-rust">
            Spoilers
          </span>
        ) : null}
      </div>

      {reviewBody ? (
        hasSpoilers && !revealed ? (
          <div className="space-y-2">
            <p className="text-sm text-text-muted italic">
              This review contains spoilers.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRevealed(true)}
            >
              Reveal spoiler review
            </Button>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-text">{reviewBody}</p>
        )
      ) : (
        <p className="text-sm text-text-muted italic">Rating only — no written review.</p>
      )}

      {createdAt ? (
        <p className="mt-2 text-xs text-text-muted">
          <time suppressHydrationWarning dateTime={createdAt}>
            {new Date(createdAt).toLocaleDateString()}
          </time>
        </p>
      ) : null}
    </article>
  );
}
