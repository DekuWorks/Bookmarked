"use client";

import Link from "next/link";
import { AppNavLink } from "@/components/layout/AppNavLink";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { layout } from "@/lib/constants/layout";
import { Z_CLASS } from "@/lib/constants/zIndex";
import { cn } from "@/lib/utils/cn";
import { MessagesUnreadBadge } from "@/components/messages/MessagesUnreadBadge";

export type NavLinkItem = {
  href: string;
  label: string;
  className?: string;
};

type Props = {
  links: NavLinkItem[];
  actions?: ReactNode;
  footer?: ReactNode;
  /** Stacked auth/actions in the mobile drawer; defaults to `footer`. */
  mobileFooter?: ReactNode;
  useAppNavLinks?: boolean;
  /** Center nav links between logo and actions (public landing). */
  centerNav?: boolean;
  /** Hide hamburger drawer on mobile (e.g. when bottom nav is used). */
  hideMobileDrawer?: boolean;
  /**
   * Links shown in the mobile drawer instead of `links` (e.g. only the
   * sections not already covered by a bottom tab bar). Defaults to `links`.
   */
  mobileLinks?: NavLinkItem[];
  /** Label + accessible name for the mobile trigger; defaults to "Menu". */
  mobileMenuLabel?: string;
};

const linkBase =
  "flex min-h-[44px] items-center rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2";

const APP_HEADER_ID = "app-header";

function isActivePath(pathname: string, href: string): boolean {
  const normalized = href.replace(/\/$/, "");
  const current = pathname.replace(/\/$/, "");
  if (normalized === "/reading-room") {
    return current === "/reading-room";
  }
  return current === normalized || current.startsWith(`${normalized}/`);
}

function NavItem({
  href,
  className,
  onClick,
  children,
  useAppNavLinks,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
  useAppNavLinks: boolean;
}) {
  if (useAppNavLinks) {
    return (
      <AppNavLink href={href} className={className} onClick={onClick}>
        {children}
      </AppNavLink>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export function NavbarMenu({
  links,
  actions,
  footer,
  mobileFooter,
  useAppNavLinks = false,
  centerNav = false,
  hideMobileDrawer = false,
  mobileLinks,
  mobileMenuLabel = "Menu",
}: Props) {
  const drawerFooter = mobileFooter ?? footer;
  const drawerLinks = mobileLinks ?? links;
  const [open, setOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(56);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  useFocusTrap(panelRef, open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    function measureHeader() {
      const header = document.getElementById(APP_HEADER_ID);
      if (!header) return;
      setHeaderHeight(Math.ceil(header.getBoundingClientRect().height));
    }

    measureHeader();
    window.addEventListener("resize", measureHeader);
    return () => window.removeEventListener("resize", measureHeader);
  }, []);

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

  const mobileDrawer =
    open && mounted
      ? createPortal(
          <div
            className={cn("fixed inset-x-0 bottom-0 md:hidden", Z_CLASS.sheet)}
            style={{ top: headerHeight }}
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-puce-red/30"
              aria-label={`Close ${mobileMenuLabel.toLowerCase()}`}
              onClick={close}
            />
            <div
              id={menuId}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={mobileMenuLabel}
              tabIndex={-1}
              className="relative max-h-full overflow-y-auto border-b border-border bg-surface shadow-lg outline-none"
            >
              <nav className={cn(layout.container, "flex flex-col gap-1 py-4")}>
                {drawerLinks.map((link) => {
                  const active = useAppNavLinks && isActivePath(pathname ?? "", link.href);
                  return (
                  <NavItem
                    key={link.href}
                    href={link.href}
                    useAppNavLinks={useAppNavLinks}
                    onClick={close}
                    className={cn(
                      linkBase,
                      "text-base text-puce-red hover:bg-primary/10",
                      active && "nav-link-active",
                      link.className
                    )}
                  >
                    {link.label}
                    {link.href.includes("/messages/") ? <MessagesUnreadBadge /> : null}
                  </NavItem>
                  );
                })}
                {drawerFooter ? (
                  <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
                    {drawerFooter}
                  </div>
                ) : null}
              </nav>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {/* Desktop navigation */}
      <div
        className={cn(
          "hidden min-w-0 flex-1 items-center gap-2 md:flex",
          centerNav ? "justify-between" : "justify-end gap-1 lg:gap-2"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-1 lg:gap-2",
            centerNav && "flex-1 justify-center"
          )}
        >
          {links.map((link) => {
            const active = useAppNavLinks && isActivePath(pathname ?? "", link.href);
            return (
            <NavItem
              key={link.href}
              href={link.href}
              useAppNavLinks={useAppNavLinks}
              className={cn(
                linkBase,
                "text-puce-red hover:bg-primary/10 hover:text-rust",
                active && "nav-link-active",
                link.className
              )}
            >
              {link.label}
              {link.href.includes("/messages/") ? <MessagesUnreadBadge /> : null}
            </NavItem>
            );
          })}
        </div>
        {footer || actions ? (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {footer}
          </div>
        ) : null}
      </div>

      {/* Mobile menu toggle + actions (aligned to the right of the header).
          Already inside the header's own stacking context (Z_CLASS.navigation),
          so this only needs `relative` to layer above its sibling nav content. */}
      <div className="relative ml-auto flex items-center gap-1 md:hidden">
        {actions ? <div className="flex items-center">{actions}</div> : null}
        {!hideMobileDrawer ? (
        <button
          type="button"
          className={cn(
            "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-puce-red md:hidden",
            mobileLinks ? "min-w-[44px] px-3" : "min-w-[44px]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2"
          )}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? `Close ${mobileMenuLabel.toLowerCase()}` : `Open ${mobileMenuLabel.toLowerCase()}`}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((value) => !value);
          }}
        >
          <svg
            aria-hidden
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : mobileLinks ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6h.01M12 12h.01M12 18h.01"
              />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
          {mobileLinks ? (
            <span aria-hidden className="text-sm font-medium">
              {mobileMenuLabel}
            </span>
          ) : (
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          )}
        </button>
        ) : null}
      </div>

      {!hideMobileDrawer ? mobileDrawer : null}
    </>
  );
}
