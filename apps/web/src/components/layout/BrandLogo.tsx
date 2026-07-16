import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/** Dusty purple matching the B glyph (`#715B8B` sampled from logo-mark). */
const BRAND_WORDMARK = "#715B8A";

type Props = {
  className?: string;
};

/**
 * Brand lockup: transparent ribbon-B mark as the letter "B", then "ookmarked"
 * in the same dusty purple — same pattern as the mobile BrandTopHeader.
 */
export function BrandLogo({ className }: Props) {
  return (
    <span
      className={cn("inline-flex items-center", className)}
      style={{ color: BRAND_WORDMARK }}
    >
      <Image
        src="/logo-mark.png"
        alt=""
        width={30}
        height={29}
        className="shrink-0"
        unoptimized
        aria-hidden
      />
      <span
        className="text-[1.35rem] font-extrabold tracking-wide"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", marginLeft: -1 }}
      >
        ookmarked
      </span>
    </span>
  );
}
