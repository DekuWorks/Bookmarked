"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { PlusBadge } from "@/components/premium/PlusBadge";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  description: string;
  ctaLabel?: string;
  href?: string;
  className?: string;
  compact?: boolean;
};

/** Soft paywall prompt — never hard-blocks reading existing user data. */
export function UpgradePrompt({
  title,
  description,
  ctaLabel = "Explore Bookmarked Plus",
  href = "/upgrade/",
  className,
  compact,
}: Props) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface dark:from-primary/15",
        compact ? "p-4" : "p-5 sm:p-6",
        className
      )}
      aria-labelledby="upgrade-prompt-title"
    >
      <div className="flex flex-wrap items-center gap-2">
        <PlusBadge compact />
        <h3
          id="upgrade-prompt-title"
          className={cn("font-semibold text-puce-red dark:text-primary", compact ? "text-base" : "text-lg")}
        >
          {title}
        </h3>
      </div>
      <p className={cn("mt-2 text-text-muted", compact ? "text-sm" : "text-sm leading-relaxed")}>
        {description}
      </p>
      <ButtonLink href={href} variant="primary" size="sm" className="mt-4">
        {ctaLabel}
      </ButtonLink>
    </aside>
  );
}
