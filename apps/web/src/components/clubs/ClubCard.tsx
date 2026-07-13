"use client";

import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { clubDetailPath } from "@/lib/routes/clubs";
import type { BookClubSummary } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  club: BookClubSummary;
};

export function ClubCard({ club }: Props) {
  const memberLabel = `${club.member_count} member${club.member_count === 1 ? "" : "s"}`;

  return (
    <Link
      href={clubDetailPath(club.id)}
      className={cn(
        "flex gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition",
        "hover:border-primary/40 hover:shadow-md"
      )}
    >
      <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg">
        {club.current_book ? (
          <BookCover
            title={club.current_book.title}
            author={club.current_book.author}
            coverUrl={club.current_book.cover_url}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-puce-red/10 to-royal-orange/25 text-2xl">
            📚
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-2 flex-1 font-semibold text-puce-red">{club.name}</h3>
          {club.visibility === "private" ? (
            <span className="shrink-0 rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Private
            </span>
          ) : null}
        </div>

        {club.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">{club.description}</p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
          <span>{memberLabel}</span>
          {club.current_book ? (
            <span className="truncate">
              Reading <span className="font-medium text-text">{club.current_book.title}</span>
            </span>
          ) : null}
          {club.viewer_is_member ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-medium text-puce-red">
              {club.viewer_role === "owner" ? "Owner" : "Joined"}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
