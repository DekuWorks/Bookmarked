import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { NavbarPublicAuth } from "@/components/layout/NavbarPublicAuth";

type Props = {
  variant?: "public" | "app";
};

export async function Navbar({ variant = "public" }: Props) {
  const supabase = variant === "app" ? await createClient() : null;
  const user =
    supabase != null
      ? (await supabase.auth.getUser()).data.user
      : null;

  const isApp = variant === "app" && user;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          Bookmarked
        </Link>

        <div className="flex max-w-[min(100%,20rem)] items-center gap-3 overflow-x-auto text-sm font-medium scrollbar-thin sm:max-w-none sm:flex-wrap sm:gap-4 md:overflow-visible">
          {isApp ? (
            <>
              <Link href="/dashboard" className="shrink-0 text-puce-red hover:text-rust">
                Dashboard
              </Link>
              <Link
                href="/reading-room"
                className="shrink-0 font-semibold text-royal-orange hover:text-rust"
              >
                <span className="sm:hidden" aria-hidden>
                  Room
                </span>
                <span className="hidden sm:inline">Reading Room</span>
              </Link>
              <Link href="/library" className="shrink-0 text-puce-red hover:text-rust">
                Library
              </Link>
              <Link href="/search" className="shrink-0 text-puce-red hover:text-rust">
                Search
              </Link>
              <Link href="/profile" className="shrink-0 text-puce-red hover:text-rust">
                Profile
              </Link>
              <span className="shrink-0">
                <LogoutButton />
              </span>
            </>
          ) : (
            <>
              <Link href="/#features" className="hidden text-puce-red hover:text-rust sm:inline">
                Features
              </Link>
              <Link href="/#contact" className="hidden text-puce-red hover:text-rust sm:inline">
                Contact
              </Link>
              <NavbarPublicAuth />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
