import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:opacity-90",
  secondary: "bg-royal-orange text-white hover:opacity-90",
  outline:
    "border-2 border-primary text-primary bg-transparent hover:bg-primary/10",
  ghost: "text-puce-red hover:bg-primary/10",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm min-h-[36px]",
  md: "px-4 py-2.5 text-base min-h-[44px]",
  lg: "px-6 py-3 text-lg min-h-[52px]",
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: Props) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-opacity",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
