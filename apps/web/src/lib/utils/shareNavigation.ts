import { bookDetailsPath } from "@/lib/routes/book";
import { clubDetailPath } from "@/lib/routes/clubs";
import { postFeedPath } from "@/lib/routes/posts";
import { readerProfilePath } from "@/lib/routes/reader";
import type { MessageSharePayload } from "@bookmarked/utils/sharePreview";

/** Resolve a clickable in-app href for a share card on web (static-export safe). */
export function sharePreviewHref(payload: MessageSharePayload): string {
  switch (payload.contentType) {
    case "post":
      return postFeedPath(payload.contentId);
    case "book":
      return bookDetailsPath(payload.contentId);
    case "club":
      return clubDetailPath(payload.contentId);
    case "profile":
    case "reading_dna": {
      const username = usernameFromShare(payload);
      if (username) {
        return payload.contentType === "reading_dna"
          ? `/reading-dna/?username=${encodeURIComponent(username)}`
          : readerProfilePath(username);
      }
      return adaptPathToWeb(payload.snapshot.destinationPath);
    }
    case "review":
    case "activity":
    case "reading_list":
    case "author":
    default:
      return adaptPathToWeb(payload.snapshot.destinationPath);
  }
}

function usernameFromShare(payload: MessageSharePayload): string | null {
  const subtitle = payload.snapshot.subtitle?.trim() ?? "";
  if (subtitle.startsWith("@") && subtitle.length > 1) {
    return subtitle.slice(1);
  }
  const path = payload.snapshot.destinationPath;
  const readerMatch = path.match(/[?&]username=([^&]+)/);
  if (readerMatch?.[1]) return decodeURIComponent(readerMatch[1]);
  const nativeMatch = path.match(/\/reader\/([^/?#]+)/);
  if (nativeMatch?.[1]) return decodeURIComponent(nativeMatch[1]);
  return null;
}

function adaptPathToWeb(path: string): string {
  const trimmed = path.trim() || "/";
  const bookNative = trimmed.match(/^\/book\/([^/?#]+)/);
  if (bookNative?.[1] && !trimmed.includes("?id=")) {
    return bookDetailsPath(bookNative[1]);
  }
  const clubNative = trimmed.match(/^\/clubs\/([^/?#]+)/);
  if (clubNative?.[1] && clubNative[1] !== "club" && clubNative[1] !== "new") {
    return clubDetailPath(clubNative[1]);
  }
  const feedMatch = trimmed.match(/^\/feed\/?\?post=([^&]+)/);
  if (feedMatch?.[1]) return postFeedPath(decodeURIComponent(feedMatch[1]));
  const readerNative = trimmed.match(/^\/reader\/([^/?#]+)/);
  if (readerNative?.[1]) return readerProfilePath(decodeURIComponent(readerNative[1]));
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
