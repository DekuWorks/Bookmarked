import Image from "next/image";
import { getShelfIconConfig, type ShelfIconId } from "@/lib/constants/shelfIcons";
import { cn } from "@/lib/utils/cn";

type Size = "xs" | "sm" | "md" | "lg";

const sizePx: Record<Size, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
};

type Props = {
  id: ShelfIconId;
  size?: Size;
  className?: string;
  /** When true, exposes the shelf name to assistive tech (default: decorative). */
  labeled?: boolean;
};

export function ShelfIcon({ id, size = "md", className, labeled = false }: Props) {
  const config = getShelfIconConfig(id);
  const px = sizePx[size];

  return (
    <Image
      src={config.src}
      alt={labeled ? config.label : ""}
      width={px}
      height={px}
      className={cn("shrink-0 object-contain", className)}
      aria-hidden={!labeled}
      unoptimized
    />
  );
}
