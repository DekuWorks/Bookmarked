"use client";

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
        hasSpoilers ? (
          <div className="group relative">
            <p
              className="cursor-default select-none text-sm leading-relaxed text-text blur-md transition-[filter] duration-200 group-hover:blur-none group-focus-within:blur-none"
              tabIndex={0}
            >
              {reviewBody}
            </p>
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium text-text-muted opacity-100 transition-opacity group-hover:opacity-0 group-focus-within:opacity-0">
              Hover to reveal spoilers
            </p>
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
