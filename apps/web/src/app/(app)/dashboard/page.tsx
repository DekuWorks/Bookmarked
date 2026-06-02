import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/services/profile";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Button } from "@/components/ui/Button";
import { ShelfBadge } from "@/components/shelves/ShelfBadge";
import { shelfStatusToSlug } from "@/lib/constants/shelves";
import type { ShelfStatus } from "@/types";

export const metadata = { title: "Dashboard" };

const QUICK_SHELVES: ShelfStatus[] = ["want_to_read", "currently_reading", "read"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getProfile(user.id);

  const { data: reading } = await supabase
    .from("user_books")
    .select("id, progress_percent, books(id, title, author, cover_url)")
    .eq("user_id", user.id)
    .eq("shelf_status", "currently_reading")
    .limit(4);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-puce-red">
          Hello{profile?.display_name ? `, ${profile.display_name}` : ""}
        </h1>
        <p className="mt-1 text-text-muted">@{profile?.username}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard
          title="Currently reading"
          action={
            <Link
              href="/library/reading"
              className="text-sm font-medium text-primary hover:underline"
            >
              View shelf
            </Link>
          }
        >
          {reading && reading.length > 0 ? (
            <ul className="space-y-3">
              {reading.map((row) => {
                const book = row.books as {
                  title?: string;
                  author?: string | null;
                } | null;
                return (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-text">{book?.title ?? "Untitled"}</p>
                      {book?.author ? (
                        <p className="text-sm text-text-muted">{book.author}</p>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium text-royal-orange">
                      {Math.round(Number(row.progress_percent) || 0)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-text-muted">
              Nothing on your reading shelf yet.{" "}
              <Link href="/search" className="font-medium text-primary hover:underline">
                Search for a book
              </Link>
              .
            </p>
          )}
        </DashboardCard>

        <DashboardCard title="Quick actions">
          <div className="flex flex-wrap gap-2">
            {QUICK_SHELVES.map((status) => (
              <Link
                key={status}
                href={`/library/${shelfStatusToSlug(status)}`}
                className="transition hover:opacity-80"
              >
                <ShelfBadge status={status} />
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/search" className="inline-flex">
              <Button variant="secondary" type="button">
                Search books
              </Button>
            </Link>
            <Link href="/library" className="inline-flex">
              <Button variant="outline" type="button">
                Open library
              </Button>
            </Link>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
