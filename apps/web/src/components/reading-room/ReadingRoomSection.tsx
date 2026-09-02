import type { ReactNode } from "react";
import { ShelfTitleRow } from "@/components/shelves/ShelfTitleRow";
import type { ShelfIconId } from "@/lib/constants/shelfIcons";
import { READING_ROOM_SECTION_HEADING_CLASS } from "@/lib/reading-room/sectionHeading";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  emoji?: string;
  shelfIconId?: ShelfIconId;
  action?: ReactNode;
  /** `stacked` puts the action under the heading, centered (Recent Activity). */
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
            ? "mb-4 flex w-full flex-col items-center gap-1.5 text-center"
            : "mb-4 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:flex-wrap sm:items-center"
        )}
      >
        <h2 className={READING_ROOM_SECTION_HEADING_CLASS}>
          {shelfIconId ? (
            <ShelfTitleRow
              id={shelfIconId}
              title={title}
              titleClassName={READING_ROOM_SECTION_HEADING_CLASS}
            />
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
