export {
  parseReadingRoomTab,
  READING_ROOM_TAB_OPTIONS,
  type ReadingRoomTab,
} from "@bookmarked/utils/readingRoomTabs";

import type { ReadingRoomTab } from "@bookmarked/utils/readingRoomTabs";

export function readingRoomTabHref(tab: ReadingRoomTab): string {
  if (tab === "overview") return "/reading-room/";
  return `/reading-room/?tab=${tab}`;
}
