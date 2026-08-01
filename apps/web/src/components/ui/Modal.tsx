"use client";

import { cn } from "@/lib/utils/cn";
import { Z_CLASS } from "@/lib/constants/zIndex";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, children, className }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
    }
  }, [open]);

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
      if (!open) triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4",
        Z_CLASS.modalBackdrop
      )}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-puce-red/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={cn(
          "relative w-full max-w-md rounded-t-2xl bg-surface p-4 shadow-xl sm:rounded-xl sm:p-6",
          "mx-0 max-h-[90vh] overflow-y-auto sm:mx-4",
          Z_CLASS.modal,
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
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
