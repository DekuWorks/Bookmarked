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
