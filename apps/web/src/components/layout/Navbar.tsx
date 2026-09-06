import Link from "next/link";
import { AppNavLink } from "@/components/layout/AppNavLink";
import { BookmarkedLogo } from "@/components/layout/BookmarkedLogo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { NavbarPublicAuth } from "@/components/layout/NavbarPublicAuth";
import { NavbarMenu, type NavLinkItem } from "@/components/layout/NavbarMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { layout } from "@/lib/constants/layout";
import { Z_CLASS } from "@/lib/constants/zIndex";
import { cn } from "@/lib/utils/cn";

type Props = {
  variant?: "public" | "app";
};

const APP_LINKS: NavLinkItem[] = [
  {
    href: "/reading-room/",
    label: "Home",
    className: "font-semibold text-royal-orange hover:text-rust",
  },
  { href: "/feed/", label: "Feed" },
  { href: "/library/", label: "Library" },
  { href: "/search/", label: "Search" },
  { href: "/clubs/", label: "Book Clubs" },
  { href: "/events/", label: "Events" },
  { href: "/book-map/", label: "Book Map" },
  { href: "/messages/", label: "Messages" },
  { href: "/profile/", label: "Profile" },
];

/**
 * Sections not already reachable from `MobileBottomNav`'s 5 tabs
 * (Home, Feed, Search, Messages, Profile). Surfaced via a "More" menu on
 * mobile web instead of overcrowding the bottom tab bar.
 */
const APP_MOBILE_MORE_LINKS: NavLinkItem[] = [
  { href: "/library/", label: "Library" },
  { href: "/clubs/", label: "Book Clubs" },
  { href: "/events/", label: "Events" },
  { href: "/book-map/", label: "Book Map" },
  { href: "/home-hub/", label: "Home Hub" },
];

const PUBLIC_LINKS: NavLinkItem[] = [
  { href: "/#about", label: "About" },
  { href: "/#features", label: "Features" },
  { href: "/#contact", label: "Contact" },
];

export function Navbar({ variant = "public" }: Props) {
  const isApp = variant === "app";

  return (
    <header
      id="app-header"
      className={cn(
        "sticky top-0 border-b backdrop-blur",
        Z_CLASS.navigation,
        isApp
          ? "border-border/70 bg-surface/95 shadow-sm backdrop-blur-md"
          : "border-transparent bg-transparent"
      )}
    >
      <nav
        className={cn(layout.container, "flex w-full items-center gap-4 py-3")}
        aria-label="Main navigation"
      >
        {isApp ? (
          <AppNavLink
            href="/reading-room/"
            aria-label="Bookmarked home"
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2 rounded-sm"
          >
            {/* Compact mark on narrow screens leaves room for the "More" nav button next to it. */}
            <BookmarkedLogo compact priority className="md:hidden" />
            <BookmarkedLogo priority className="hidden md:block" />
          </AppNavLink>
        ) : (
          <Link
            href="/"
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2 rounded-sm"
          >
            <BookmarkedLogo priority />
          </Link>
        )}

        <NavbarMenu
          links={isApp ? APP_LINKS : PUBLIC_LINKS}
          mobileLinks={isApp ? APP_MOBILE_MORE_LINKS : undefined}
          mobileMenuLabel={isApp ? "More" : "Menu"}
          actions={isApp ? <NotificationBell /> : null}
          centerNav={!isApp}
          footer={
            isApp ? (
              <LogoutButton />
            ) : (
              <NavbarPublicAuth />
            )
          }
          mobileFooter={isApp ? undefined : <NavbarPublicAuth layout="menu" />}
          useAppNavLinks={isApp}
        />
      </nav>
    </header>
  );
}
