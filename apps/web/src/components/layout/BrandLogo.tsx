import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
};

export function BrandLogo({ className }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo-circle.png"
        alt=""
        width={28}
        height={28}
        className="shrink-0 rounded-full"
        unoptimized
      />
      <span>Bookmarked</span>
    </span>
  );
}
