"use client";

import { cn } from "@/lib/utils/cn";
import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-puce-red/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-2xl bg-surface p-6 shadow-xl sm:rounded-xl",
          "max-h-[85vh] overflow-y-auto",
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title ? (
            <h2 id="modal-title" className="text-lg font-semibold text-puce-red">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-text-muted hover:bg-background"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
