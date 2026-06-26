import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
  filled?: boolean;
};

export function BellIcon({ className, filled = false }: Props) {
  return (
    <svg
      aria-hidden
      className={cn("h-5 w-5 shrink-0", className)}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
