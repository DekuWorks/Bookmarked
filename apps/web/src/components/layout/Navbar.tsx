import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/LogoutButton";

type Props = {
  variant?: "public" | "app";
};

export async function Navbar({ variant = "public" }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isApp = variant === "app" && user;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          Bookmarked
        </Link>

        <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
          {isApp ? (
            <>
              <Link href="/dashboard" className="text-puce-red hover:text-rust">
                Dashboard
              </Link>
              <Link href="/library" className="text-puce-red hover:text-rust">
                Library
              </Link>
              <Link href="/search" className="text-puce-red hover:text-rust">
                Search
              </Link>
              <Link href="/profile" className="text-puce-red hover:text-rust">
                Profile
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/#features" className="hidden text-puce-red hover:text-rust sm:inline">
                Features
              </Link>
              <Link href="/#contact" className="hidden text-puce-red hover:text-rust sm:inline">
                Contact
              </Link>
              {user ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-primary px-4 py-2 text-white hover:opacity-90"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-puce-red hover:text-rust">
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-royal-orange px-4 py-2 text-white hover:opacity-90"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
