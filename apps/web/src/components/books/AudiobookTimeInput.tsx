"use client";

import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  hint?: string;
  error?: string;
  /** Spoken value for accessibility (e.g. "2 hours 30 minutes"). */
  spokenValue?: string;
};

const fieldClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text shadow-sm placeholder:text-text-muted transition-[border-color,box-shadow] duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

/**
 * Shared HH:MM listening-time field. Equal label height keeps paired columns
 * aligned when labels wrap (Current vs Total Listening Time).
 */
export function AudiobookTimeInput({
  label,
  hint,
  error,
  spokenValue,
  className,
  id,
  "aria-label": ariaLabel,
  ...rest
}: Props) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex min-w-0 flex-col">
      <label
        htmlFor={inputId}
        className="mb-2 flex min-h-[2.5rem] items-end text-sm font-medium leading-snug text-text"
      >
        <span>{label}</span>
      </label>
      <input
        id={inputId}
        inputMode="numeric"
        aria-label={spokenValue ? `${label}, ${spokenValue}` : ariaLabel ?? label}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        className={cn(fieldClass, error && "border-rust", className)}
        {...rest}
      />
      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-rust" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
