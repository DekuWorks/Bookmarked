export type ReadingRoomTab =
  | "overview"
  | "reviews"
  | "notes"
  | "stats"
  | "trail"
  | "history";

/** Tabs shown in the Reading Room bar. Trail and History stay reachable by deep link. */
export const READING_ROOM_TAB_OPTIONS: { id: ReadingRoomTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "reviews", label: "Reviews" },
  { id: "notes", label: "Notes" },
  { id: "stats", label: "Stats" },
];

const REACHABLE_TABS = new Set<ReadingRoomTab>([
  "overview",
  "reviews",
  "notes",
  "stats",
  "trail",
  "history",
]);

const LEGACY_LABELS: Partial<Record<ReadingRoomTab, string>> = {
  trail: "Trail",
  history: "History",
};

/** Normalize legacy / invalid tab query values to a valid Reading Room tab. */
export function parseReadingRoomTab(value: string | null | undefined): ReadingRoomTab {
  if (value === "journal") return "trail";
  if (value === "dashboard") return "overview";
  if (value === "progress") return "stats";
  if (value && REACHABLE_TABS.has(value as ReadingRoomTab)) {
    return value as ReadingRoomTab;
  }
  return "overview";
}

export function readingRoomTabLabel(tab: ReadingRoomTab): string {
  return (
    READING_ROOM_TAB_OPTIONS.find((option) => option.id === tab)?.label ??
    LEGACY_LABELS[tab] ??
    "Overview"
  );
}
