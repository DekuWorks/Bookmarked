import Link from "next/link";
import { challengesPath } from "@/lib/routes/challenges";
import { OVERVIEW_CHALLENGES_COPY } from "@bookmarked/utils/overviewCopy";

function TrophyMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0 text-primary" aria-hidden>
      <path
        fill="currentColor"
        d="M14 8h20v8a10 10 0 0 1-20 0V8Zm-6 2h6v6a12 12 0 0 0 2.2 7.1A8 8 0 0 1 8 16V10Zm32 0v6a8 8 0 0 1-8.2 7.1A12 12 0 0 0 34 18v-6h6ZM20 28h8v4h6v4H14v-4h6v-4Z"
      />
    </svg>
  );
}

function BookMarks() {
  return (
    <svg viewBox="0 0 72 72" className="hidden h-16 w-20 shrink-0 sm:block" aria-hidden>
      <rect x="4" y="18" width="16" height="46" rx="1" fill="#8b6f52" />
      <rect x="24" y="10" width="18" height="54" rx="1" fill="#642F37" />
      <rect x="46" y="20" width="16" height="44" rx="1" fill="#B89DBB" />
    </svg>
  );
}

export function ChallengesCTA() {
  return (
    <Link
      href={challengesPath("reading_room_overview")}
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface/90 p-4 shadow-sm transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange md:p-5"
    >
      <TrophyMark />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl text-puce-red md:text-2xl">
          {OVERVIEW_CHALLENGES_COPY.title}
        </span>
        <span className="mt-1 block text-sm text-text-muted">
          {OVERVIEW_CHALLENGES_COPY.subtitle}
        </span>
      </span>
      <BookMarks />
    </Link>
  );
}
