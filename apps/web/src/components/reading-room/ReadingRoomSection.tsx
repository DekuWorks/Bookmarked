import type { ReactNode } from "react";
import { ShelfTitleRow } from "@/components/shelves/ShelfTitleRow";
import type { ShelfIconId } from "@/lib/constants/shelfIcons";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  emoji?: string;
  shelfIconId?: ShelfIconId;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function ReadingRoomSection({
  title,
  emoji,
  shelfIconId,
  action,
  children,
  className,
}: Props) {
  return (
    <section
      className={cn(
        "animate-fade-in rounded-2xl border border-border bg-surface/90 p-5 shadow-sm backdrop-blur-sm md:p-6",
        className
      )}
    >
      <div className="mb-4 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:flex-wrap sm:items-center">
        <h2 className="text-lg font-semibold text-puce-red md:text-xl">
          {shelfIconId ? (
            <ShelfTitleRow
              id={shelfIconId}
              title={title}
              titleClassName="text-lg font-semibold text-puce-red md:text-xl"
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
