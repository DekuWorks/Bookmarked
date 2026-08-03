"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { usePreferredLocale } from "@/lib/hooks/usePreferredLocale";
import { resolveSharePreview } from "@/lib/services/sharePreviewResolve";
import { sharePreviewHref } from "@/lib/utils/shareNavigation";
import { formatFeedTimestamp } from "@/lib/utils/locale";
import { cn } from "@/lib/utils/cn";
import {
  cardModelFromSnapshot,
  shareContentTypeLabel,
  type MessageSharePayload,
  type SharePreviewCardModel,
} from "@bookmarked/utils/sharePreview";

type Props = {
  payload: MessageSharePayload;
  viewerId?: string | null;
  isOwn?: boolean;
  className?: string;
};

export function SharePreviewCard({
  payload,
  viewerId,
  isOwn = false,
  className,
}: Props) {
  const locale = usePreferredLocale();
  const [model, setModel] = useState<SharePreviewCardModel>(() =>
    cardModelFromSnapshot(payload)
  );
  const [loading, setLoading] = useState(Boolean(viewerId));

  useEffect(() => {
    setModel(cardModelFromSnapshot(payload));
    if (!viewerId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void resolveSharePreview(payload, viewerId).then((resolved) => {
      if (cancelled) return;
      setModel(resolved);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [payload, viewerId]);

  if (loading && model.unavailable) {
    return (
      <div
        className={cn(
          "w-full max-w-[280px] animate-pulse rounded-xl border border-border bg-background p-3 text-left",
          className
        )}
        aria-busy="true"
        aria-label="Loading shared content"
      >
        <div className="flex gap-3">
          <div className="h-16 w-12 shrink-0 rounded-md bg-border/70" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-20 rounded bg-border/70" />
            <div className="h-4 w-full rounded bg-border/70" />
            <div className="h-3 w-3/4 rounded bg-border/70" />
          </div>
        </div>
      </div>
    );
  }

  if (model.unavailable) {
    return (
      <div
        className={cn(
          "w-full max-w-[280px] rounded-xl border border-dashed border-border bg-background px-3 py-3 text-left text-sm text-text-muted",
          className
        )}
        role="status"
      >
        This content is no longer available.
      </div>
    );
  }

  const href = sharePreviewHref(payload);
  const label = `${shareContentTypeLabel(model.contentType)}: ${model.title}`;

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "group/share block w-full max-w-[280px] rounded-xl border border-border bg-background p-3 text-left shadow-sm transition",
        "hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
        isOwn && "border-white/25 bg-white/10",
        className
      )}
    >
      <p
        className={cn(
          "mb-2 text-[10px] font-semibold uppercase tracking-wide",
          isOwn ? "text-white/70" : "text-text-muted"
        )}
      >
        {shareContentTypeLabel(model.contentType)}
      </p>

      <div className="flex gap-3">
        {model.thumbnailUrl ? (
          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-surface shadow-sm">
            <Image
              src={model.thumbnailUrl}
              alt=""
              fill
              className="object-cover transition group-hover/share:scale-[1.02]"
              unoptimized
              sizes="48px"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          {(model.posterName || model.posterAvatarUrl) && (
            <div className="mb-1 flex items-center gap-2">
              <ProfileAvatar
                profile={{
                  username: null,
                  display_name: model.posterName,
                  avatar_url: model.posterAvatarUrl,
                }}
                size="sm"
                className="!h-5 !w-5 !text-[9px]"
              />
              <span
                className={cn(
                  "truncate text-xs font-medium",
                  isOwn ? "text-white/85" : "text-text-muted"
                )}
              >
                {model.posterName}
              </span>
            </div>
          )}

          <p
            className={cn(
              "line-clamp-2 text-sm font-semibold",
              isOwn ? "text-white" : "text-puce-red"
            )}
          >
            {model.title}
          </p>
          {model.subtitle && model.subtitle !== model.posterName ? (
            <p
              className={cn(
                "mt-0.5 truncate text-xs",
                isOwn ? "text-white/75" : "text-text-muted"
              )}
            >
              {model.subtitle}
            </p>
          ) : null}
          {model.description ? (
            <p
              className={cn(
                "mt-1 line-clamp-3 text-xs leading-relaxed",
                isOwn ? "text-white/90" : "text-text"
              )}
            >
              {model.description}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {model.rating != null ? (
              <StarDisplay rating={model.rating} showNumeric={false} />
            ) : null}
            {model.spoiler ? (
              <span className="rounded-full bg-rust/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-rust">
                Spoilers
              </span>
            ) : null}
            {model.edited ? (
              <span
                className={cn(
                  "text-[10px]",
                  isOwn ? "text-white/65" : "text-text-muted"
                )}
              >
                Edited
              </span>
            ) : null}
            {model.timestamp ? (
              <time
                className={cn(
                  "text-[10px]",
                  isOwn ? "text-white/65" : "text-text-muted"
                )}
                dateTime={model.timestamp}
                suppressHydrationWarning
              >
                {formatFeedTimestamp(model.timestamp, locale)}
              </time>
            ) : null}
          </div>

          {model.tags.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {model.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    isOwn
                      ? "bg-white/15 text-white/90"
                      : "bg-primary/15 text-puce-red"
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
