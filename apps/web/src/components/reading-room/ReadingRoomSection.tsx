import type { ReactNode } from "react";
import { ShelfTitleRow } from "@/components/shelves/ShelfTitleRow";
import type { ShelfIconId } from "@/lib/constants/shelfIcons";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  emoji?: string;
  shelfIconId?: ShelfIconId;
  action?: ReactNode;
  /** `stacked` puts the action under the heading, left-aligned (Recent Activity). */
  actionLayout?: "inline" | "stacked";
  children: ReactNode;
  className?: string;
};

export function ReadingRoomSection({
  title,
  emoji,
  shelfIconId,
  action,
  actionLayout = "inline",
  children,
  className,
}: Props) {
  const stacked = actionLayout === "stacked";
  const headingClass = stacked
    ? "text-lg font-semibold text-text md:text-xl"
    : "text-lg font-semibold text-puce-red md:text-xl";

  return (
    <section
      className={cn(
        "animate-fade-in rounded-2xl border border-border bg-surface/90 p-5 shadow-sm backdrop-blur-sm md:p-6",
        className
      )}
    >
      <div
        className={cn(
          stacked
            ? "mb-4 flex flex-col items-start gap-1.5 text-left"
            : "mb-4 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:flex-wrap sm:items-center"
        )}
      >
        <h2 className={headingClass}>
          {shelfIconId ? (
            <ShelfTitleRow id={shelfIconId} title={title} titleClassName={headingClass} />
          ) : (
            <span className="inline-flex items-center gap-2">
              {emoji ? <span aria-hidden>{emoji}</span> : null}
              {title}
            </span>
          )}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
