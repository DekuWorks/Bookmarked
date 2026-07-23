import type { ReactNode } from "react";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
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
      <div className="mb-4 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:flex-wrap">
        <h2 className="flex items-center justify-center gap-2 text-lg font-semibold text-puce-red md:text-xl">
          {shelfIconId ? <ShelfIcon id={shelfIconId} size="md" /> : null}
          {emoji && !shelfIconId ? <span aria-hidden>{emoji}</span> : null}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
