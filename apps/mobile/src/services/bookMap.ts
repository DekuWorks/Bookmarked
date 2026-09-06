import { filterBookMapPlaces } from "../../../../packages/utils/bookMap";
import type { BookMapListQuery, BookMapPlace } from "../../../../packages/utils/mapProvider";
import type { ContentReportReason } from "../../../../packages/utils/contentReports";
import { reportContent } from "./moderation";
import { supabase } from "./supabase";

const PLACE_SELECT =
  "id, name, category, address_text, city, region, postal_code, country, lat, lng, website, phone, hours, verified, active, source";

export async function listBookMapPlaces(query: BookMapListQuery = {}): Promise<BookMapPlace[]> {
  const { data, error } = await supabase
    .from("book_map_places")
    .select(PLACE_SELECT)
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return filterBookMapPlaces((data ?? []) as BookMapPlace[], query);
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
