export type ReadingRoomTab =
  | "overview"
  | "reviews"
  | "notes"
  | "stats"
  | "history";

/** Tabs shown in the Reading Room bar. History stays reachable by deep link. Trail lives on Book Detail. */
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
  "history",
]);

const LEGACY_LABELS: Partial<Record<ReadingRoomTab, string>> = {
  history: "History",
};

const PROGRESS_GOAL_HASHES = new Set(["reading-goal", "goal"]);

/** Goal anchors on the old Progress tab now live on Overview. */
export function isProgressGoalHash(hash: string | null | undefined): boolean {
  const normalized = (hash ?? "").replace(/^#/, "").toLowerCase();
  return PROGRESS_GOAL_HASHES.has(normalized);
}

/**
 * Where a Reading Room tab should open.
 * A bare `progress` link opens Stats. A goal anchor opens Overview.
 * Calendar, statistics, analytics, and insights stay on Stats.
 */
export function resolveReadingRoomDestination(
  tab: string | null | undefined,
  hash?: string | null
): ReadingRoomTab {
  if (tab === "progress" && isProgressGoalHash(hash)) return "overview";
  return parseReadingRoomTab(tab);
}

/** Replacement for a legacy Progress URL. Null when the tab is not progress. */
export function legacyProgressLocation(
  tab: string | null | undefined,
  hash?: string | null
): { tab: ReadingRoomTab; hash: string } | null {
  if (tab !== "progress") return null;
  const destination = resolveReadingRoomDestination(tab, hash);
  if (destination === "overview") return { tab: "overview", hash: "reading-goal" };
  const normalized = (hash ?? "").replace(/^#/, "");
  const keep = normalized && !isProgressGoalHash(normalized) ? normalized : "";
  return { tab: "stats", hash: keep };
}

/** Normalize legacy / invalid tab query values to a valid Reading Room tab. */
export function parseReadingRoomTab(value: string | null | undefined): ReadingRoomTab {
  if (value === "journal" || value === "trail") return "overview";
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
