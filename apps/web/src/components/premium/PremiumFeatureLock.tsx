"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  description: string;
  featureLabel?: string;
  className?: string;
  compact?: boolean;
};

export function PremiumFeatureLock({
  title,
  description,
  featureLabel = "Premium",
  className,
  compact,
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/10 via-surface to-surface",
        compact ? "p-4" : "p-6",
        className
      )}
    >
      <div className="flex flex-col items-center text-center">
        <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-puce-red">
          {featureLabel}
        </span>
        <h3 className={cn("font-semibold text-puce-red", compact ? "mt-3 text-base" : "mt-4 text-lg")}>
          {title}
        </h3>
        <p className={cn("text-text-muted", compact ? "mt-2 text-sm" : "mt-3 text-sm leading-relaxed")}>
          {description}
        </p>
        <ButtonLink href="/upgrade/" variant="primary" size="sm" className="mt-4 w-full max-w-xs sm:w-auto">
          Upgrade to Premium
        </ButtonLink>
      </div>
    </div>
  );
}
