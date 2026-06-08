import { createClient } from "@/lib/supabase/server";
import { AnalyticsGrid } from "@/components/analytics/AnalyticsGrid";
import { computeReadingAnalytics } from "@/lib/services/analytics";
import type { LibraryBookRow } from "@/lib/services/library";

type Props = {
  books: LibraryBookRow[];
  userId: string;
  showFuturePlaceholders?: boolean;
};

export async function LibraryAnalyticsPanel({
  books,
  userId,
  showFuturePlaceholders,
}: Props) {
  const supabase = await createClient();
  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const analytics = computeReadingAnalytics(books, reviewCount ?? 0);

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-puce-red">Reading insights</h2>
      <AnalyticsGrid
        analytics={analytics}
        showFuturePlaceholders={showFuturePlaceholders}
        className="mt-4"
      />
    </section>
  );
}
