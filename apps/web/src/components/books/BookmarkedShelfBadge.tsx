import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type Size = "sm" | "md" | "lg";

/** ~1/5 cover width; square emblem matches the brand logo on shelved covers. */
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
 * Brand logo emblem for books on the user's shelf — lavender circle with the
 * purple bookmark "B", positioned at the top-right of covers.
 */
export function BookmarkedShelfBadge({ className, size = "md" }: Props) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute right-0 top-0 z-20 aspect-square",
        sizeClass[size],
        className
      )}
      aria-hidden
    >
      <Image
        src="/logo-circle.png"
        alt=""
        fill
        className="object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.28)]"
        sizes="2rem"
        unoptimized
      />
    </div>
  );
}
