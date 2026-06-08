import type { SupabaseClient } from "@supabase/supabase-js";

export type ActivityEventType =
  | "book_added"
  | "shelf_updated"
  | "progress_updated"
  | "book_finished"
  | "review_created"
  | "review_updated"
  | "book_removed"
  // legacy aliases still in DB
  | "reading_started"
  | "reading_finished"
  | "review_added";

type ActivityInput = {
  user_id: string;
  event_type: ActivityEventType;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata_json?: Record<string, unknown> | null;
};

export async function recordActivity(
  supabase: SupabaseClient,
  input: ActivityInput
): Promise<void> {
  await supabase.from("activity_events").insert({
    user_id: input.user_id,
    event_type: input.event_type,
    entity_type: input.entity_type ?? null,
    entity_id: input.entity_id ?? null,
    metadata_json: input.metadata_json ?? null,
  });
}

function bookTitle(metadata: Record<string, unknown> | null): string {
  if (typeof metadata?.title === "string") return metadata.title;
  if (typeof metadata?.book_title === "string") return metadata.book_title;
  return "a book";
}

function shelfLabel(metadata: Record<string, unknown> | null): string | null {
  const raw =
    typeof metadata?.shelf_status === "string" ? metadata.shelf_status : null;
  if (!raw) return null;
  return raw.replace(/_/g, " ");
}

/** Personal dashboard copy — always second person. */
export function formatActivityMessage(
  event_type: string,
  metadata: Record<string, unknown> | null
): string {
  const title = bookTitle(metadata);
  const shelf = shelfLabel(metadata);
  const percent =
    typeof metadata?.progress_percent === "number"
      ? metadata.progress_percent
      : null;

  switch (event_type) {
    case "book_added":
      return shelf
        ? `You added ${title} to ${shelf}`
        : `You added ${title}`;
    case "shelf_updated":
      return shelf
        ? `You moved ${title} to ${shelf}`
        : `You updated ${title}`;
    case "progress_updated":
      return percent != null
        ? `You updated progress on ${title} (${percent}%)`
        : `You updated progress on ${title}`;
    case "book_finished":
    case "reading_finished":
      return `You finished ${title}`;
    case "reading_started":
      return `You started reading ${title}`;
    case "review_created":
    case "review_added":
      return `You reviewed ${title}`;
    case "review_updated":
      return `You updated your review of ${title}`;
    case "book_removed":
      return `You removed ${title} from your library`;
    default:
      return `You updated your library`;
  }
}

export function activityMetadata(
  title: string,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return { title, book_title: title, ...extra };
}
