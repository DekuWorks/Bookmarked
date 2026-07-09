import { cn } from "@/lib/utils/cn";

type Size = "sm" | "md" | "lg";

/** ~1/5 cover width; 5:8 ribbon aspect matches mockup proportions. */
const sizeClass: Record<Size, string> = {
  sm: "w-[20%] min-w-[0.875rem] max-w-[1.125rem]",
  md: "w-[22%] min-w-[1.125rem] max-w-[1.75rem]",
  lg: "w-[26%] min-w-[1.375rem] max-w-[2.25rem]",
};

type Props = {
  className?: string;
  size?: Size;
};

/**
 * Lavender bookmark ribbon with a white serif "B" for books on the user's shelf.
 * Classic swallowtail silhouette — rectangular tab with a deep V-notch at the bottom.
 */
export function BookmarkedShelfBadge({ className, size = "md" }: Props) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute right-0 top-0 z-20 aspect-[5/8]",
        sizeClass[size],
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 20 32"
        className="h-full w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="On your shelf"
      >
        <path d="M0 0 H20 V24 L10 32 L0 24 Z" className="fill-primary" />
        <text
          x="10"
          y="12.5"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontFamily="Georgia, 'Times New Roman', 'Palatino Linotype', serif"
          fontSize="13"
          fontWeight="700"
        >
          B
        </text>
      </svg>
    </div>
  );
}
