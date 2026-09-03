"use client";

import Link from "next/link";
import Image from "next/image";
import { BookCover } from "@/components/books/BookCover";
import { BrandChromeIcon } from "@/components/icons/BrandChromeIcon";
import { clubDetailPath } from "@/lib/routes/clubs";
import { roleLabel, visibilityLabel } from "@bookmarked/utils/clubPermissions";
import type { BookClubSummary } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  club: BookClubSummary;
  /** When true, emphasize the Open Club CTA (My Clubs). */
  showOpenCta?: boolean;
  href?: string;
};

export function ClubCard({ club, showOpenCta = false, href }: Props) {
  const memberLabel = `${club.member_count} member${club.member_count === 1 ? "" : "s"}`;

  return (
    <Link
      href={href ?? clubDetailPath(club.id)}
      className={cn(
        "flex gap-4 rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition",
        "hover:border-primary/40 hover:shadow-md"
      )}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
        {club.image_url ? (
          <Image
            src={club.image_url}
            alt=""
            width={64}
            height={64}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : club.current_book ? (
          <BookCover
            title={club.current_book.title}
            author={club.current_book.author}
            coverUrl={club.current_book.cover_url}
            className="h-full w-full rounded-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary/30 via-puce-red/10 to-royal-orange/25">
            <BrandChromeIcon name="clubs" className="h-7 w-7" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-2 flex-1 font-semibold text-puce-red">{club.name}</h3>
          <span className="shrink-0 rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            {visibilityLabel(club.visibility)}
          </span>
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
          {club.viewer_role ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-medium text-puce-red">
              {roleLabel(club.viewer_role)}
            </span>
          ) : club.viewer_is_member ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 font-medium text-puce-red">
              Joined
            </span>
          ) : null}
        </div>

        {showOpenCta ? (
          <p className="mt-3 text-sm font-medium text-primary">Open Club →</p>
        ) : null}
      </div>
    </Link>
  );
}
