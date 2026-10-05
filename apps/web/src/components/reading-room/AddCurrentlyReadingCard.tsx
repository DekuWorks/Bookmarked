import { CURRENTLY_READING_ADD_COPY } from "@bookmarked/utils/overviewCopy";

type Props = {
  onClick: () => void;
};

export function AddCurrentlyReadingCard({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/50 bg-primary/10 px-6 text-center text-puce-red shadow-sm transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
    >
      <span aria-hidden className="font-display text-5xl leading-none text-primary">
        +
      </span>
      <span className="max-w-[16rem] text-sm font-semibold">
        {CURRENTLY_READING_ADD_COPY.cardLabel}
      </span>
    </button>
  );
}
