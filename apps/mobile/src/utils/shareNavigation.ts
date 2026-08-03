import type { MessageSharePayload } from "../../../../packages/utils/sharePreview";

/** Resolve a clickable in-app path for a share card on iOS. */
export function sharePreviewHref(payload: MessageSharePayload): string {
  switch (payload.contentType) {
    case "post":
      return `/feed?post=${encodeURIComponent(payload.contentId)}`;
    case "book":
      return `/book/${payload.contentId}`;
    case "club":
      return `/clubs/${payload.contentId}`;
    case "profile":
    case "reading_dna": {
      const username = usernameFromShare(payload);
      if (username) {
        return payload.contentType === "reading_dna"
          ? `/reading-dna?username=${encodeURIComponent(username)}`
          : `/reader/${username}`;
      }
      return adaptPathToNative(payload.snapshot.destinationPath);
    }
    case "review":
    case "activity":
    case "reading_list":
    case "author":
    default:
      return adaptPathToNative(payload.snapshot.destinationPath);
  }
}

function usernameFromShare(payload: MessageSharePayload): string | null {
  const subtitle = payload.snapshot.subtitle?.trim() ?? "";
  if (subtitle.startsWith("@") && subtitle.length > 1) {
    return subtitle.slice(1);
  }
  const path = payload.snapshot.destinationPath;
  const queryMatch = path.match(/[?&]username=([^&]+)/);
  if (queryMatch?.[1]) return decodeURIComponent(queryMatch[1]);
  const nativeMatch = path.match(/\/reader\/([^/?#]+)/);
  if (nativeMatch?.[1]) return decodeURIComponent(nativeMatch[1]);
  return null;
}

function adaptPathToNative(path: string): string {
  const trimmed = path.trim() || "/";
  const bookWeb = trimmed.match(/^\/book\/?\?id=([^&]+)/);
  if (bookWeb?.[1]) return `/book/${decodeURIComponent(bookWeb[1])}`;
  const clubWeb = trimmed.match(/^\/clubs\/club\/?\?id=([^&]+)/);
  if (clubWeb?.[1]) return `/clubs/${decodeURIComponent(clubWeb[1])}`;
  const feedWeb = trimmed.match(/^\/feed\/?\?post=([^&]+)/);
  if (feedWeb?.[1]) return `/feed?post=${feedWeb[1]}`;
  const readerWeb = trimmed.match(/^\/reader\/?\?username=([^&]+)/);
  if (readerWeb?.[1]) return `/reader/${decodeURIComponent(readerWeb[1])}`;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
