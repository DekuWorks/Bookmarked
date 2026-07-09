import { cn } from "@/lib/utils/cn";

type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
  sm: "w-[27%] min-w-[1.4rem] max-w-[1.75rem]",
  md: "w-[32%] min-w-[1.6rem] max-w-[2.2rem]",
  lg: "w-[34%] min-w-[1.875rem] max-w-[2.8rem]",
};

type Props = {
  className?: string;
  size?: Size;
};

/**
 * Lavender bookmark ribbon with a white "B" for books on the user's shelf.
 * Anchored to the top-left of a cover so it stays visible inside clipped containers.
 */
export function BookmarkedShelfBadge({ className, size = "md" }: Props) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-0 top-0 z-10 drop-shadow-sm",
        sizeClass[size],
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 28 40"
        className="h-auto w-full"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="On your shelf"
      >
        <path
          d="M1 0 H27 V33.5 L14 40 L1 33.5 Z"
          className="fill-primary"
        />
        <text
          x="14"
          y="17"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="15"
          fontWeight="600"
        >
          B
        </text>
      </svg>
    </div>
  );
}
