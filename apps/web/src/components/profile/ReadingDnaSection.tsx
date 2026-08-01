import { computeReadingDna } from "@bookmarked/utils/readingDna";
import { ButtonLink } from "@/components/ui/ButtonLink";

type Props = {
  favoriteGenres: string[];
  canAccess: (feature: "reading_dna_dashboard" | "reading_dna_ai_insights" | "book_matches" | "reading_dna_match" | "reader_map") => boolean;
};

export function ReadingDnaSection({ favoriteGenres, canAccess }: Props) {
  const dna = computeReadingDna({
    shelves: favoriteGenres.map((genre) => ({ genre })),
  });
  const hasPlus = canAccess("reading_dna_dashboard");
  const hasHome = canAccess("reading_dna_match");

  return (
    <section className="surface-card mt-6 p-5 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-puce-red">Reading DNA</p>
          <p className="mt-1 text-sm text-text-muted">Your evolving reader profile, built from books, shelves, ratings, and reviews.</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {hasPlus ? "Full dashboard" : "Top traits"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {dna.topTraits.length ? dna.topTraits.map((trait) => (
          <span key={`${trait.category}-${trait.label}`} className="rounded-full bg-primary/15 px-3 py-1 text-sm font-medium capitalize text-puce-red">
            {trait.label}
          </span>
        )) : <p className="text-sm text-text-muted">{dna.summary}</p>}
      </div>

      {hasPlus ? (
        <div className="mt-4 rounded-xl bg-primary/5 p-3 text-sm text-text-muted">
          <p>{dna.summary}</p>
          <p className="mt-2 font-medium text-text">AI insights and book matches are ready for your growing reading history.</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-text-muted">Unlock Bookmarked Plus for the full DNA dashboard, AI insights, and book matches.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!hasPlus ? <ButtonLink href="/upgrade/" variant="secondary" size="sm">Explore Plus</ButtonLink> : null}
        {hasHome ? (
          <span className="rounded-lg border border-primary/20 px-3 py-2 text-sm text-primary">DNA Match % and Reader Map filters update monthly.</span>
        ) : (
          <span className="text-xs text-text-muted">Home adds monthly DNA updates, DNA Match %, and Reader Map filters.</span>
        )}
      </div>
    </section>
  );
}
