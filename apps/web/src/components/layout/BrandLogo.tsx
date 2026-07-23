import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/** Trimmed wordmark aspect ratio (814×181). */
const WORDMARK_ASPECT = 814 / 181;
const WORDMARK_HEIGHT = 32;

type Props = {
  className?: string;
  /** Show only the B mark (compact nav). */
  compact?: boolean;
};

/**
 * Brand lockup: full BOOKMARKED wordmark image, or compact B mark alone.
 */
export function BrandLogo({ className, compact }: Props) {
  if (compact) {
    return (
      <Image
        src="/logo-mark.png"
        alt=""
        width={30}
        height={30}
        className={cn("shrink-0", className)}
        unoptimized
        aria-hidden
      />
    );
  }

  const height = WORDMARK_HEIGHT;
  const width = Math.round(height * WORDMARK_ASPECT);

  return (
    <Image
      src="/logo.png"
      alt="Bookmarked"
      width={width}
      height={height}
      className={cn("shrink-0", className)}
      unoptimized
      priority
    />
  );
}
