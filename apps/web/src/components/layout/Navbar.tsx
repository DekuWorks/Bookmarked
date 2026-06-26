import Link from "next/link";
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
  { href: "/library/", label: "Library" },
  { href: "/search/", label: "Search" },
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
      className="sticky top-0 z-[100] border-b border-border bg-surface/95 backdrop-blur"
    >
      <nav
        className={cn(layout.container, "flex items-center justify-between gap-4 py-3")}
        aria-label="Main navigation"
      >
        <Link
          href={isApp ? "/dashboard/" : "/"}
          prefetch={false}
          className="shrink-0 text-xl font-bold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2 rounded-sm"
        >
          Bookmarked
        </Link>

        <NavbarMenu
          links={isApp ? APP_LINKS : PUBLIC_LINKS}
          actions={isApp ? <NotificationBell /> : null}
          footer={
            isApp ? (
              <LogoutButton />
            ) : (
              <NavbarPublicAuth layout="menu" />
            )
          }
        />
      </nav>
    </header>
  );
}
