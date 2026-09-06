"use client";

import { IOS_SUBSCRIBE_COPY } from "@bookmarked/utils/subscription";
import { PlusBadge } from "@/components/premium/PlusBadge";

type SubscribeCopy = {
  headline: string;
  body: string;
  cta: string;
  note: string;
};

export function IosSubscribePanel({
  title,
  copy = IOS_SUBSCRIBE_COPY,
}: {
  title: string;
  copy?: SubscribeCopy;
}) {
  return (
    <aside
      className="rounded-xl border border-primary/30 bg-primary/10 p-5 text-left"
      aria-labelledby="ios-subscribe-title"
    >
      <div className="flex flex-wrap items-center gap-2">
        <PlusBadge compact />
        <h2 id="ios-subscribe-title" className="font-semibold text-puce-red">
          {title}
        </h2>
      </div>
      <p className="mt-2 text-sm text-text-muted">{copy.headline}</p>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">{copy.body}</p>
      <p className="mt-3 text-sm font-medium text-puce-red">{copy.cta}</p>
      <p className="mt-1 text-xs text-text-muted">{copy.note}</p>
    </aside>
  );
}
