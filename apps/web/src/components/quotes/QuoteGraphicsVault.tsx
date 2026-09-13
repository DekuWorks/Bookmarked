import Link from "next/link";
import { QuoteGraphicCard } from "@/components/quotes/QuoteGraphicCard";
import { quoteGraphicSnippet } from "@bookmarked/utils/quoteGraphics";
import type { QuoteGraphic } from "@/types";

type Props = {
  items: QuoteGraphic[];
  shareHref: (id: string) => string;
};

export function QuoteGraphicsVault({ items, shareHref }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-text-muted">No saved graphics yet.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text">Saved graphics</h3>
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((graphic) => (
          <li key={graphic.id} className="space-y-2">
            {graphic.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={graphic.image_url}
                alt={quoteGraphicSnippet(graphic.quote_text)}
                className="w-full rounded-2xl object-cover"
              />
            ) : (
              <QuoteGraphicCard quote={graphic.quote_text} attribution={graphic.attribution} />
            )}
            <p className="text-xs text-text-muted">
              {graphic.book?.title ?? "Quote graphic"} ·{" "}
              {new Date(graphic.created_at).toLocaleDateString()}
            </p>
            <Link
              href={shareHref(graphic.id)}
              className="inline-flex min-h-[44px] items-center text-sm font-semibold text-puce-red hover:underline"
            >
              Share to Feed
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
