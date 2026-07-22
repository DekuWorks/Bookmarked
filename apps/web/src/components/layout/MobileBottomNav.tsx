"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppNavLink } from "@/components/layout/AppNavLink";
import { MessagesUnreadBadge } from "@/components/messages/MessagesUnreadBadge";
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
      className={cn("h-6 w-6", active ? "text-royal-orange" : "text-puce-red")}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
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
      className={cn("h-6 w-6", active ? "text-royal-orange" : "text-puce-red")}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
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
      className={cn("h-6 w-6", active ? "text-royal-orange" : "text-puce-red")}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
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
      className={cn("h-6 w-6", active ? "text-royal-orange" : "text-puce-red")}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
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
      className={cn("h-6 w-6", active ? "text-royal-orange" : "text-puce-red")}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
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
    return current === "/reading-room" || current === "/dashboard";
  }
  return current === normalized || current.startsWith(`${normalized}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-surface/95 shadow-[0_-4px_16px_color-mix(in_srgb,var(--color-puce-red)_6%,transparent)] backdrop-blur-md md:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <AppNavLink
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2",
                  active
                    ? "bg-primary/15 text-royal-orange shadow-sm"
                    : "text-puce-red hover:bg-primary/8"
                )}
              >
                {item.icon(active)}
                <span>{item.label}</span>
                {item.href.includes("/messages/") ? <MessagesUnreadBadge /> : null}
              </AppNavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
