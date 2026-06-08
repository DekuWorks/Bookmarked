import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/services/profile";
import { getUserLibraryBooks } from "@/lib/services/library";
import { computeReadingAnalytics } from "@/lib/services/analytics";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { CurrentlyReadingRow } from "@/components/reading-room/CurrentlyReadingRow";
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
  const books = await getUserLibraryBooks(user.id);
  const currentlyReading = books.filter((b) => b.shelf_status === "currently_reading");

  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const analytics = computeReadingAnalytics(books, reviewCount ?? 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-puce-red">
            Hello{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="mt-1 text-text-muted">@{profile?.username}</p>
        </div>
        <ButtonLink href="/reading-room" variant="secondary">
          Open Reading Room
        </ButtonLink>
      </header>

      <DashboardCard title="Currently reading">
        <CurrentlyReadingRow items={currentlyReading} />
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Reading goal">
          <div className="rounded-lg bg-orange-yellow/15 px-4 py-5">
            <p className="font-medium text-puce-red">
              {analytics.booksRead} of — books this year
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Yearly goals are coming soon. Keep reading and your stats will be ready when
              they arrive.
            </p>
          </div>
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
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <ButtonLink href="/search" variant="secondary" size="sm">
              Search books
            </ButtonLink>
            <ButtonLink href="/library" variant="outline" size="sm">
              Open library
            </ButtonLink>
            <ButtonLink href="/reading-room" variant="primary" size="sm">
              Reading Room
            </ButtonLink>
            <ButtonLink href="/library/want-to-read" variant="ghost" size="sm">
              Want to read
            </ButtonLink>
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Your reading at a glance">
        <AnalyticsGrid analytics={analytics} compact />
      </DashboardCard>

      <ActivityFeed userId={user.id} />
    </div>
  );
}
