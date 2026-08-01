"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppNavLink } from "@/components/layout/AppNavLink";
import { MessagesUnreadBadge } from "@/components/messages/MessagesUnreadBadge";
import { Z_CLASS } from "@/lib/constants/zIndex";
import { cn } from "@/lib/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => ReactNode;
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden
      className={cn(
        "h-5 w-5 transition-colors duration-200",
        active ? "text-royal-orange" : "text-puce-red/80"
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function FeedIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden
      className={cn(
        "h-5 w-5 transition-colors duration-200",
        active ? "text-royal-orange" : "text-puce-red/80"
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V9m2 13h2a1 1 0 001-1v-5a1 1 0 00-1-1h-2"
      />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden
      className={cn(
        "h-5 w-5 transition-colors duration-200",
        active ? "text-royal-orange" : "text-puce-red/80"
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function MessagesIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden
      className={cn(
        "h-5 w-5 transition-colors duration-200",
        active ? "text-royal-orange" : "text-puce-red/80"
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg
      aria-hidden
      className={cn(
        "h-5 w-5 transition-colors duration-200",
        active ? "text-royal-orange" : "text-puce-red/80"
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { href: "/reading-room/", label: "Home", icon: (active) => <HomeIcon active={active} /> },
  { href: "/feed/", label: "Feed", icon: (active) => <FeedIcon active={active} /> },
  { href: "/search/", label: "Search", icon: (active) => <SearchIcon active={active} /> },
  { href: "/messages/", label: "Messages", icon: (active) => <MessagesIcon active={active} /> },
  { href: "/profile/", label: "Profile", icon: (active) => <ProfileIcon active={active} /> },
];

function isActivePath(pathname: string, href: string): boolean {
  const normalized = href.replace(/\/$/, "");
  const current = pathname.replace(/\/$/, "");
  if (normalized === "/reading-room") {
    return current === "/reading-room";
  }
  return current === normalized || current.startsWith(`${normalized}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";
  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((item) => isActivePath(pathname, item.href))
  );
  const tabCount = NAV_ITEMS.length;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden",
        Z_CLASS.navigation
      )}
      aria-hidden={false}
    >
      <nav
        className={cn(
          "pointer-events-auto mx-auto max-w-sm",
          "rounded-full border border-border/70",
          "bg-surface/90 backdrop-blur-xl",
          "shadow-[0_8px_32px_color-mix(in_srgb,var(--color-puce-red)_14%,transparent),0_2px_8px_color-mix(in_srgb,var(--color-puce-red)_8%,transparent)]"
        )}
        aria-label="Mobile navigation"
      >
        <ul className="relative grid grid-cols-5 p-1.5">
          <li
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 rounded-full",
              "bg-primary/22 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-primary)_35%,transparent)]",
              "transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            )}
            style={{
              width: `calc((100% - 0.75rem) / ${tabCount})`,
              transform: `translateX(calc(${activeIndex} * 100%))`,
            }}
          />

          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            const isMessages = item.href.includes("/messages/");

            return (
              <li key={item.href} className="relative z-[1]">
                <AppNavLink
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                  className={cn(
                    "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-full px-1",
                    "text-[10px] font-medium transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                    active ? "text-royal-orange" : "text-puce-red/75 hover:text-puce-red"
                  )}
                >
                  <span className="relative flex items-center justify-center">
                    {item.icon(active)}
                    {isMessages ? (
                      <MessagesUnreadBadge className="absolute -right-2.5 -top-1.5 ml-0 h-3.5 min-w-[14px] px-0.5 text-[8px]" />
                    ) : null}
                  </span>
                  <span className="leading-none">{item.label}</span>
                </AppNavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
