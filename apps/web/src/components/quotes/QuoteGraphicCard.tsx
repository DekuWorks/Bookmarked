import { quoteGraphicCardCopy } from "@bookmarked/utils/quoteGraphicRender";
import { cn } from "@/lib/utils/cn";

type Props = {
  quote: string;
  attribution?: string | null;
  className?: string;
};

export function QuoteGraphicCard({ quote, attribution, className }: Props) {
  const copy = quoteGraphicCardCopy({ quote, attribution });
  return (
    <figure
      className={cn(
        "rounded-2xl border border-border bg-gradient-to-br from-puce-red via-[#7a3d4a] to-primary p-6 text-white",
        className
      )}
      aria-label="Quote graphic"
    >
      <blockquote className="font-display text-xl leading-relaxed">“{copy.quote}”</blockquote>
      {copy.attribution ? (
        <figcaption className="mt-4 text-sm text-white/85">— {copy.attribution}</figcaption>
      ) : null}
      <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-white/70">Bookmarked</p>
    </figure>
  );
}
