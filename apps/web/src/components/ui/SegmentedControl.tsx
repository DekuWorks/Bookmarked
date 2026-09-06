import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export type SegmentedControlAlignment = "start" | "center";

export type SegmentedControlOption<T extends string> = {
  id: T;
  label: string;
  href: string;
};

type Props<T extends string> = {
  options: SegmentedControlOption<T>[];
  value: T;
  ariaLabel: string;
  alignment?: SegmentedControlAlignment;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  ariaLabel,
  alignment = "start",
  className,
}: Props<T>) {
  return (
    <div
      className={cn("pill-tabs overflow-x-auto", className)}
      data-align={alignment}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <Link
          key={option.id}
          href={option.href}
          role="tab"
          aria-selected={value === option.id}
          data-active={value === option.id ? "true" : "false"}
          className="pill-tab shrink-0"
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
