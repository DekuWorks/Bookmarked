"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { layout } from "@/lib/constants/layout";
import { cn } from "@/lib/utils/cn";

export type NavLinkItem = {
  href: string;
  label: string;
  className?: string;
};

type Props = {
  links: NavLinkItem[];
  footer?: ReactNode;
};

const linkBase =
  "flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2";

export function NavbarMenu({ links, footer }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <>
      {/* Desktop navigation */}
      <div className="hidden items-center gap-1 md:flex lg:gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              linkBase,
              "text-puce-red hover:bg-primary/10 hover:text-rust",
              link.className
            )}
          >
            {link.label}
          </Link>
        ))}
        {footer ? <div className="ml-2 flex items-center gap-2">{footer}</div> : null}
      </div>

      {/* Mobile menu button */}
      <button
        type="button"
        className={cn(
          "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-border bg-surface text-puce-red md:hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2"
        )}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg
          aria-hidden
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-puce-red/30"
            aria-label="Close navigation menu"
            onClick={close}
          />
          <div
            id={menuId}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-x-0 top-[53px] max-h-[calc(100vh-53px)] overflow-y-auto border-b border-border bg-surface shadow-lg"
          >
            <nav className={cn(layout.container, "flex flex-col gap-1 py-4")}>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={cn(
                    linkBase,
                    "text-base text-puce-red hover:bg-primary/10",
                    link.className
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {footer ? (
                <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
                  {footer}
                </div>
              ) : null}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
