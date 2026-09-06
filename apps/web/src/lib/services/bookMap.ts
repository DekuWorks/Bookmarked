import { createClient } from "@/lib/supabase/client";
import { filterBookMapPlaces } from "@bookmarked/utils/bookMap";
import type { BookMapListQuery, BookMapPlace } from "@bookmarked/utils/mapProvider";
import type { ContentReportReason } from "@bookmarked/utils/contentReports";
import { reportContent } from "@/lib/services/moderation";

const PLACE_SELECT =
  "id, name, category, address_text, city, region, postal_code, country, lat, lng, website, phone, hours, verified, active, source";

function mapPlace(row: BookMapPlace): BookMapPlace {
  return {
    ...row,
    hours: row.hours && typeof row.hours === "object" ? row.hours : null,
  };
}

export async function listBookMapPlaces(query: BookMapListQuery = {}): Promise<BookMapPlace[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("book_map_places")
    .select(PLACE_SELECT)
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return filterBookMapPlaces((data ?? []).map((row) => mapPlace(row as BookMapPlace)), query);
}

export async function reportBookMapPlace(
  placeId: string,
  reason: ContentReportReason,
  details?: string
): Promise<{ error?: string }> {
  return reportContent({
    contentType: "book_map_place",
    contentId: placeId,
    reason,
    details,
  });
}
