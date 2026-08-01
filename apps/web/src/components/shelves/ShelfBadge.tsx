import type { ShelfStatus } from "@/types";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
import { cn } from "@/lib/utils/cn";

const config: Record<
  ShelfStatus,
  { label: string; className: string }
> = {
  want_to_read: {
    label: "TBR",
    className: "bg-orange-yellow/30 text-puce-red",
  },
  currently_reading: {
    label: "Currently Reading",
    className: "bg-royal-orange/25 text-puce-red",
  },
  read: {
    label: "Finished",
    className: "bg-primary/30 text-puce-red",
  },
  dnf: {
    label: "DNF",
    className: "bg-rust/20 text-puce-red",
  },
};

type Props = {
  status: ShelfStatus;
  className?: string;
};

export function ShelfBadge({ status, className }: Props) {
  const { label, className: badgeClass } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-none",
        badgeClass,
        className
      )}
    >
      <ShelfIcon id={status} size="small" />
      <span className="leading-tight">{label}</span>
    </span>
  );
}
