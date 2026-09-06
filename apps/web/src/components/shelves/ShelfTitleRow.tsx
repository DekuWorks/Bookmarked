import type { ReactNode } from "react";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
import type { ShelfIconId, ShelfIconSize } from "@/lib/constants/shelfIcons";
import { cn } from "@/lib/utils/cn";

type Props = {
  id?: ShelfIconId;
  iconKey?: string | null;
  title: string;
  size?: ShelfIconSize;
  className?: string;
  titleClassName?: string;
  action?: ReactNode;
};

/**
 * Borderless shelf icon + title. Icon sits beside the first title line;
 * the icon+title group is vertically centered as a unit in its parent.
 */
export function ShelfTitleRow({
  id,
  iconKey,
  title,
  size = "medium",
  className,
  titleClassName = "font-display text-xl font-bold tracking-tight text-puce-red sm:text-2xl",
  action,
}: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {id ? (
        <ShelfIcon id={id} size={size} labeled className="self-center" />
      ) : (
        <ShelfIcon iconKey={iconKey} size={size} labeled className="self-center" />
      )}
      <span className={cn("min-w-0 leading-tight", titleClassName)}>{title}</span>
      {action}
    </span>
  );
}
