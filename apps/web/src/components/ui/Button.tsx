import { cn } from "@/lib/utils/cn";
import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary: "bg-primary text-puce-red hover:opacity-90",
  secondary: "bg-royal-orange text-white hover:opacity-90",
  outline:
    "border-2 border-primary text-puce-red bg-transparent hover:bg-primary/10",
  ghost: "text-puce-red hover:bg-primary/10",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-sm min-h-[44px]",
  md: "px-4 py-2.5 text-base min-h-[44px]",
  lg: "px-6 py-3 text-lg min-h-[52px]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled ?? loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-opacity disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading ? "Loading…" : children}
    </button>
  );
}
