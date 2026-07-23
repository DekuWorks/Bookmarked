import type { ReactNode } from "react";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
import type { ShelfIconId } from "@/lib/constants/shelfIcons";
import { cn } from "@/lib/utils/cn";

type Props = {
  id: ShelfIconId;
  title: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  titleClassName?: string;
  action?: ReactNode;
};

/** Inline shelf icon + title for headers and section labels. */
export function ShelfTitleRow({
  id,
  title,
  size = "md",
  className,
  titleClassName = "text-base font-semibold text-puce-red",
  action,
}: Props) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ShelfIcon id={id} size={size} labeled />
      <span className={titleClassName}>{title}</span>
      {action}
    </div>
  );
}
