export type ReadingRoomTab =
  | "overview"
  | "progress"
  | "trail"
  | "notes"
  | "reviews"
  | "history";

export const READING_ROOM_TAB_OPTIONS: { id: ReadingRoomTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "progress", label: "Progress" },
  { id: "trail", label: "Trail" },
  { id: "notes", label: "Notes" },
  { id: "reviews", label: "Reviews" },
  { id: "history", label: "History" },
];

/** Normalize legacy / invalid tab query values to a valid Reading Room tab. */
export function parseReadingRoomTab(value: string | null | undefined): ReadingRoomTab {
  if (value === "journal") return "trail";
  if (value === "dashboard") return "overview";
  if (value && READING_ROOM_TAB_OPTIONS.some((tab) => tab.id === value)) {
    return value as ReadingRoomTab;
  }
  return "overview";
}
