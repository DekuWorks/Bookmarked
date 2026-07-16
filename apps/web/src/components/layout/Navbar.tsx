import Link from "next/link";
import { AppNavLink } from "@/components/layout/AppNavLink";
import { BrandLogo } from "@/components/layout/BrandLogo";
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
  { href: "/dashboard/", label: "Dashboard" },
  { href: "/feed/", label: "Feed" },
  {
    href: "/reading-room/",
    label: "Reading Room",
    className: "font-semibold text-royal-orange hover:text-rust",
  },
  { href: "/notes/", label: "Notes" },
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
          ? "border-border/70 bg-background/90"
          : "border-transparent bg-transparent"
      )}
    >
      <nav
        className={cn(layout.container, "flex items-center gap-4 py-3")}
        aria-label="Main navigation"
      >
        {isApp ? (
          <AppNavLink
            href="/dashboard/"
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2 rounded-sm"
          >
            <BrandLogo />
          </AppNavLink>
        ) : (
          <Link
            href="/"
            className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2 rounded-sm"
          >
            <BrandLogo />
          </Link>
        )}

        <NavbarMenu
          links={isApp ? APP_LINKS : PUBLIC_LINKS}
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
