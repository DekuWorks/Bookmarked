import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/services/profile";
import { getUserLibraryBooks } from "@/lib/services/library";
import { computeReadingAnalytics } from "@/lib/services/analytics";
import { fetchReadingStreakTimestamps } from "@/lib/services/readingInsights";
import { computeReadingGoal } from "@/lib/services/readingGoal";
import { ReadingGoalPanel } from "@/components/reading-goal/ReadingGoalPanel";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { BookMiniGrid } from "@/components/reading-room/BookMiniGrid";
import { ButtonLink } from "@/components/ui/ButtonLink";
import Link from "next/link";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getProfile(user.id);
  const [books, streakTimestamps] = await Promise.all([
    getUserLibraryBooks(user.id),
    fetchReadingStreakTimestamps(user.id),
  ]);

  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const analytics = computeReadingAnalytics({
    books,
    reviewsWritten: reviewCount ?? 0,
    streakTimestamps,
    profileGenres: profile?.favorite_genres,
  });
  const readingGoal = computeReadingGoal(
    books,
    profile?.yearly_reading_goal ?? null
  );

  const recentlyFinished = books
    .filter((b) => b.shelf_status === "read")
    .sort((a, b) => {
      const aDate = a.finished_at ? new Date(a.finished_at).getTime() : 0;
      const bDate = b.finished_at ? new Date(b.finished_at).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 4);

  const favorites = books.filter((b) => b.is_favorite).slice(0, 4);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-puce-red">Profile</h1>
        <p className="mt-1 text-text-muted">{user.email}</p>
      </header>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-2xl font-semibold text-text">
          {profile?.display_name || profile?.username || "Reader"}
        </p>
        {profile?.username ? (
          <p className="text-text-muted">@{profile.username}</p>
        ) : null}
        {profile?.bio ? (
          <p className="mt-4 leading-relaxed text-text">{profile.bio}</p>
        ) : null}
        {profile?.favorite_genres?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.favorite_genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-puce-red"
              >
                {genre}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/profile/setup" variant="outline" size="sm">
            Edit profile
          </ButtonLink>
          <LogoutButton />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-puce-red">Reading goal</h2>
        <ReadingGoalPanel status={readingGoal} className="mt-4" />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-puce-red">Reading statistics</h2>
        <AnalyticsGrid
          analytics={analytics}
          readingGoal={readingGoal}
          className="mt-4"
          compact
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-puce-red">Favorite books</h2>
          <Link href="/reading-room" className="text-sm font-medium text-primary hover:underline">
            Reading Room
          </Link>
        </div>
        <BookMiniGrid
          items={favorites}
          emptyMessage="Mark books as favorites from their detail page."
          emptyAction={{ label: "Browse search", href: "/search" }}
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-puce-red">Recently finished</h2>
        <BookMiniGrid
          items={recentlyFinished}
          emptyMessage="Finished books will show up here."
          emptyAction={{ label: "View read shelf", href: "/library/read" }}
        />
      </section>

      <section className="rounded-xl border border-dashed border-border bg-background p-6 text-center">
        <p className="font-medium text-puce-red">Badges & achievements</p>
        <p className="mt-1 text-sm text-text-muted">Coming in a future update.</p>
      </section>
    </div>
  );
}
