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
        <p className="text-sm leading-relaxed text-text">{reviewBody}</p>
      ) : null}
      {createdAt ? (
        <p className="mt-2 text-xs text-text-muted">
          {new Date(createdAt).toLocaleDateString()}
        </p>
      ) : null}
    </article>
  );
}
