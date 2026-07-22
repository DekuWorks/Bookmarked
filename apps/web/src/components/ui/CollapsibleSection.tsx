"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  id?: string;
  title: string;
  description?: string;
  /** Short line shown beside the chevron when collapsed (e.g. "5 sessions"). */
  badge?: string;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

export function CollapsibleSection({
  id,
  title,
  description,
  badge,
  defaultOpen = false,
  className,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className={cn("surface-card overflow-hidden", className)}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 p-5 text-left transition hover:bg-background/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-royal-orange"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0">
          <span className="block text-lg font-semibold text-puce-red">{title}</span>
          {description ? (
            <span className="mt-1 block text-sm leading-relaxed text-text-muted">{description}</span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2 pt-0.5">
          {badge ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {badge}
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-text-muted transition",
              open && "rotate-180"
            )}
            aria-hidden
          >
            ▾
          </span>
        </span>
      </button>
      {open ? <div className="border-t border-border/60 px-5 pb-5 pt-4">{children}</div> : null}
    </section>
  );
}
