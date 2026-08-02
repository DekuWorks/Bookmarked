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
  primary: "bg-primary text-on-primary hover:opacity-90",
  secondary: "bg-royal-orange text-white hover:opacity-90",
  outline:
    "border-2 border-primary text-puce-red bg-transparent hover:bg-primary/10",
  ghost: "text-puce-red hover:bg-primary/10",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-sm min-h-[44px] text-center",
  md: "px-4 py-2.5 text-base min-h-[44px] text-center",
  lg: "px-6 py-3 text-lg min-h-[52px] text-center",
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
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2",
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
