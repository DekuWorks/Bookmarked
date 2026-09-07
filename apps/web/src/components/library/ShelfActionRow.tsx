import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Horizontal wrap row for shelf actions (Edit / Privacy / Share). */
export function ShelfActionRow({ children, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-3",
        className
      )}
    >
      {children}
    </div>
  );
}
