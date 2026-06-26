import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
  filled?: boolean;
};

export function PinIcon({ className, filled = false }: Props) {
  return (
    <svg
      aria-hidden
      className={cn("h-4 w-4 shrink-0", className)}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 17v5" />
      <path
        d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v3.76z"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}
