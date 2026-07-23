import Link from "next/link";
import { AppNavLink } from "@/components/layout/AppNavLink";
import { BookmarkedLogo } from "@/components/layout/BookmarkedLogo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { NavbarPublicAuth } from "@/components/layout/NavbarPublicAuth";
import { NavbarMenu, type NavLinkItem } from "@/components/layout/NavbarMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { layout } from "@/lib/constants/layout";
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
  { href: "/messages/", label: "Messages" },
  { href: "/profile/", label: "Profile" },
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
        "sticky top-0 z-[100] border-b backdrop-blur",
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
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2 rounded-sm"
          >
            <BookmarkedLogo priority />
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
          actions={isApp ? <NotificationBell /> : null}
          centerNav={!isApp}
          hideMobileDrawer={isApp}
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
