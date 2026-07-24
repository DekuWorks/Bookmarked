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

export function parseReadingRoomTab(value: string | null): ReadingRoomTab {
  if (value === "journal") return "trail";
  if (value && READING_ROOM_TAB_OPTIONS.some((tab) => tab.id === value)) {
    return value as ReadingRoomTab;
  }
  return "overview";
}

export function readingRoomTabHref(tab: ReadingRoomTab): string {
  if (tab === "overview") return "/reading-room/";
  return `/reading-room/?tab=${tab}`;
}
