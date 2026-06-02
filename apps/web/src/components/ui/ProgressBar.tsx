import { cn } from "@/lib/utils/cn";

type Props = {
  value: number;
  max?: number;
  label?: string;
  className?: string;
};

export function ProgressBar({ value, max = 100, label, className }: Props) {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : value));

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <p className="mb-1 text-xs text-text-muted">{label}</p>
      ) : null}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-royal-orange to-orange-yellow transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
