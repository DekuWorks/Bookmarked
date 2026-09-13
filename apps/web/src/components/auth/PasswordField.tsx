"use client";

import { useRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { PasswordVisibilityIcon } from "@/components/auth/PasswordVisibilityIcon";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
};

export function PasswordField({
  label = "Password",
  error,
  className,
  id,
  name = "password",
  autoComplete = "current-password",
  required,
  defaultValue,
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  function toggleVisibility() {
    const el = inputRef.current;
    const start = el?.selectionStart ?? null;
    const end = el?.selectionEnd ?? null;
    setVisible((current) => !current);
    requestAnimationFrame(() => {
      if (!el || start == null || end == null) return;
      try {
        el.setSelectionRange(start, end);
      } catch {
        // Some browsers reject setSelectionRange on type=password briefly.
      }
    });
  }

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-text">
        {label}
      </label>
      <div className="relative">
        <input
          {...rest}
          ref={inputRef}
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          defaultValue={defaultValue}
          className={cn(
            "w-full rounded-xl border border-border bg-surface py-2.5 pl-4 pr-12 text-text shadow-sm placeholder:text-text-muted transition-[border-color,box-shadow] duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
            error && "border-rust",
            className
          )}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-r-xl text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <PasswordVisibilityIcon visible={visible} />
        </button>
      </div>
      {error ? <p className="mt-1.5 text-sm text-rust">{error}</p> : null}
    </div>
  );
}
