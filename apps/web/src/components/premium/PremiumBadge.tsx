import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
  compact?: boolean;
};

export function PremiumBadge({ className, compact }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary/25 font-semibold uppercase tracking-wide text-puce-red",
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      Premium
    </span>
  );
}
