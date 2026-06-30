import { cn } from "@/lib/utils/cn";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...rest }: InputProps) {
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
      <input
        id={inputId}
        className={cn(
          "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text",
          "placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
          error && "border-rust",
          className
        )}
        {...rest}
      />
      {error ? <p className="mt-1 text-sm text-rust">{error}</p> : null}
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
          "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text min-h-[120px]",
          "placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
          error && "border-rust",
          className
        )}
        {...rest}
      />
      {error ? <p className="mt-1 text-sm text-rust">{error}</p> : null}
    </div>
  );
});
