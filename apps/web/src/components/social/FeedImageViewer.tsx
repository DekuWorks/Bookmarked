"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Z_CLASS } from "@/lib/constants/zIndex";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
};

export function FeedImageViewer({ open, src, alt, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-black/85 p-4",
        Z_CLASS.modalBackdrop
      )}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close image"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={alt}
        className={cn("relative flex max-h-full max-w-full flex-col items-center", Z_CLASS.modal)}
      >
        <button
          type="button"
          onClick={onClose}
          className="mb-3 inline-flex min-h-[44px] min-w-[44px] items-center justify-center self-end rounded-lg bg-white/10 px-3 text-sm font-medium text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
        >
          Close
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[min(90vh,100%)] max-w-full object-contain object-center"
        />
      </div>
    </div>,
    document.body
  );
}
