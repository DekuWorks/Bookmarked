import { cn } from "@/lib/utils/cn";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

type InputVariant = "default" | "search";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  variant?: InputVariant;
  hideLabel?: boolean;
};

const fieldBase =
  "w-full border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-muted transition-[border-color,box-shadow] duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

const variantClass: Record<InputVariant, string> = {
  default: "rounded-xl shadow-sm",
  search: "search-input px-5 py-3",
};

export function Input({
  label,
  error,
  variant = "default",
  hideLabel = false,
  className,
  id,
  ...rest
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={variant === "search" ? "mb-0" : "mb-4"}>
      {label && !hideLabel ? (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-text"
        >
          {label}
        </label>
      ) : label ? (
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(fieldBase, variantClass[variant], error && "border-rust", className)}
        {...rest}
      />
      {error ? <p className="mt-1.5 text-sm text-rust">{error}</p> : null}
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, ...rest },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="mb-4">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-text"
        >
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          fieldBase,
          "min-h-[120px] rounded-xl shadow-sm",
          error && "border-rust",
          className
        )}
        {...rest}
      />
      {error ? <p className="mt-1 text-sm text-rust">{error}</p> : null}
    </div>
  );
});
