/**
 * Universal share preview engine for in-app DM cards.
 * Register new content types here; clients resolve live data via services.
 */

export const SHARE_CONTENT_TYPES = [
  "post",
  "review",
  "book",
  "club",
  "reading_list",
  "reading_dna",
  "author",
  "profile",
  "activity",
] as const;

export type ShareContentType = (typeof SHARE_CONTENT_TYPES)[number];

export type SharePreviewSnapshot = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  posterName?: string | null;
  posterAvatarUrl?: string | null;
  rating?: number | null;
  tags?: string[];
  timestamp?: string | null;
  spoiler?: boolean;
  edited?: boolean;
  /** Relative in-app path (no absolute URLs). */
  destinationPath: string;
};

export type MessageSharePayload = {
  contentType: ShareContentType;
  contentId: string;
  snapshot: SharePreviewSnapshot;
};

export type SharePreviewCardModel = {
  contentType: ShareContentType;
  contentId: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  posterName: string | null;
  posterAvatarUrl: string | null;
  rating: number | null;
  tags: string[];
  timestamp: string | null;
  spoiler: boolean;
  edited: boolean;
  destinationPath: string;
  unavailable: boolean;
};

export type ShareComposerPayload = {
  contentType: ShareContentType;
  contentId: string;
  /** Legacy display helpers used by Share → Feed. */
  title: string;
  body: string;
  bookId?: string | null;
  imageUrl?: string | null;
  snapshot: SharePreviewSnapshot;
};

const MAX_DESCRIPTION_CHARS = 180;
const MAX_TAGS = 3;

export function isShareContentType(value: unknown): value is ShareContentType {
  return (
    typeof value === "string" &&
    (SHARE_CONTENT_TYPES as readonly string[]).includes(value)
  );
}

export function truncateShareDescription(
  text: string | null | undefined,
  max = MAX_DESCRIPTION_CHARS
): string | null {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return null;
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function limitShareTags(tags: string[] | null | undefined): string[] {
  if (!tags?.length) return [];
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, MAX_TAGS);
}

export function buildMessageSharePayload(
  input: ShareComposerPayload
): MessageSharePayload {
  return {
    contentType: input.contentType,
    contentId: input.contentId,
    snapshot: {
      ...input.snapshot,
      description: truncateShareDescription(input.snapshot.description),
      tags: limitShareTags(input.snapshot.tags),
      destinationPath: normalizeShareDestination(input.snapshot.destinationPath),
    },
  };
}

/** Strip absolute origins and force app-relative paths. */
export function normalizeShareDestination(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      return `${url.pathname}${url.search}${url.hash}` || "/";
    }
  } catch {
    // fall through
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function parseMessageSharePayload(
  value: unknown
): MessageSharePayload | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!isShareContentType(row.contentType)) return null;
  if (typeof row.contentId !== "string" || !row.contentId.trim()) return null;
  const snapshotRaw = row.snapshot;
  if (!snapshotRaw || typeof snapshotRaw !== "object") return null;
  const snapshot = snapshotRaw as Record<string, unknown>;
  if (typeof snapshot.title !== "string" || !snapshot.title.trim()) return null;
  if (
    typeof snapshot.destinationPath !== "string" ||
    !snapshot.destinationPath.trim()
  ) {
    return null;
  }

  const tags = Array.isArray(snapshot.tags)
    ? snapshot.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  return {
    contentType: row.contentType,
    contentId: row.contentId.trim(),
    snapshot: {
      title: snapshot.title.trim(),
      subtitle:
        typeof snapshot.subtitle === "string" ? snapshot.subtitle : null,
      description:
        typeof snapshot.description === "string" ? snapshot.description : null,
      thumbnailUrl:
        typeof snapshot.thumbnailUrl === "string" ? snapshot.thumbnailUrl : null,
      posterName:
        typeof snapshot.posterName === "string" ? snapshot.posterName : null,
      posterAvatarUrl:
        typeof snapshot.posterAvatarUrl === "string"
          ? snapshot.posterAvatarUrl
          : null,
      rating: typeof snapshot.rating === "number" ? snapshot.rating : null,
      tags: limitShareTags(tags),
      timestamp:
        typeof snapshot.timestamp === "string" ? snapshot.timestamp : null,
      spoiler: Boolean(snapshot.spoiler),
      edited: Boolean(snapshot.edited),
      destinationPath: normalizeShareDestination(snapshot.destinationPath),
    },
  };
}

export function cardModelFromSnapshot(
  payload: MessageSharePayload,
  options?: { unavailable?: boolean }
): SharePreviewCardModel {
  const { snapshot } = payload;
  return {
    contentType: payload.contentType,
    contentId: payload.contentId,
    title: snapshot.title,
    subtitle: snapshot.subtitle ?? null,
    description: truncateShareDescription(snapshot.description),
    thumbnailUrl: snapshot.thumbnailUrl ?? null,
    posterName: snapshot.posterName ?? null,
    posterAvatarUrl: snapshot.posterAvatarUrl ?? null,
    rating: snapshot.rating ?? null,
    tags: limitShareTags(snapshot.tags),
    timestamp: snapshot.timestamp ?? null,
    spoiler: Boolean(snapshot.spoiler),
    edited: Boolean(snapshot.edited),
    destinationPath: normalizeShareDestination(snapshot.destinationPath),
    unavailable: Boolean(options?.unavailable),
  };
}

export function unavailableShareCard(
  payload: MessageSharePayload | null
): SharePreviewCardModel {
  return {
    contentType: payload?.contentType ?? "post",
    contentId: payload?.contentId ?? "",
    title: "This content is no longer available.",
    subtitle: null,
    description: null,
    thumbnailUrl: null,
    posterName: null,
    posterAvatarUrl: null,
    rating: null,
    tags: [],
    timestamp: null,
    spoiler: false,
    edited: false,
    destinationPath: "/",
    unavailable: true,
  };
}

export function shareContentTypeLabel(type: ShareContentType): string {
  switch (type) {
    case "post":
      return "Post";
    case "review":
      return "Review";
    case "book":
      return "Book";
    case "club":
      return "Book Club";
    case "reading_list":
      return "Reading List";
    case "reading_dna":
      return "Reading DNA";
    case "author":
      return "Author";
    case "profile":
      return "Profile";
    case "activity":
      return "Update";
    default:
      return "Shared";
  }
}

/** Build a composer payload for a feed post share. */
export function buildPostShareComposerPayload(input: {
  postId: string;
  body: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  bookTitle?: string | null;
  bookCoverUrl?: string | null;
  bookId?: string | null;
  imageUrl?: string | null;
  createdAt?: string | null;
  destinationPath: string;
  spoiler?: boolean;
  edited?: boolean;
  tags?: string[];
  rating?: number | null;
}): ShareComposerPayload {
  const description = truncateShareDescription(input.body);
  const title = input.bookTitle?.trim() || `Post by ${input.authorName}`;
  return {
    contentType: "post",
    contentId: input.postId,
    title,
    body: input.body.trim() || "Shared a post on Bookmarked",
    bookId: input.bookId ?? null,
    imageUrl: input.imageUrl ?? input.bookCoverUrl ?? null,
    snapshot: {
      title,
      subtitle: input.bookTitle?.trim() ? input.authorName : null,
      description,
      thumbnailUrl: input.bookCoverUrl ?? input.imageUrl ?? null,
      posterName: input.authorName,
      posterAvatarUrl: input.authorAvatarUrl ?? null,
      rating: input.rating ?? null,
      tags: limitShareTags(input.tags),
      timestamp: input.createdAt ?? null,
      spoiler: Boolean(input.spoiler),
      edited: Boolean(input.edited),
      destinationPath: normalizeShareDestination(input.destinationPath),
    },
  };
}

export function buildReviewShareComposerPayload(input: {
  reviewId: string;
  body: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  bookTitle?: string | null;
  bookCoverUrl?: string | null;
  bookId?: string | null;
  rating?: number | null;
  spoiler?: boolean;
  createdAt?: string | null;
  destinationPath: string;
  tags?: string[];
}): ShareComposerPayload {
  const title = input.bookTitle?.trim() || `Review by ${input.authorName}`;
  return {
    contentType: "review",
    contentId: input.reviewId,
    title,
    body: input.body.trim() || `${input.authorName} shared a review`,
    bookId: input.bookId ?? null,
    imageUrl: input.bookCoverUrl ?? null,
    snapshot: {
      title,
      subtitle: input.authorName,
      description: truncateShareDescription(input.body),
      thumbnailUrl: input.bookCoverUrl ?? null,
      posterName: input.authorName,
      posterAvatarUrl: input.authorAvatarUrl ?? null,
      rating: input.rating ?? null,
      tags: limitShareTags(input.tags),
      timestamp: input.createdAt ?? null,
      spoiler: Boolean(input.spoiler),
      edited: false,
      destinationPath: normalizeShareDestination(input.destinationPath),
    },
  };
}

export function buildBookShareComposerPayload(input: {
  bookId: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  destinationPath?: string;
}): ShareComposerPayload {
  return {
    contentType: "book",
    contentId: input.bookId,
    title: input.title,
    body: input.description?.trim() || input.title,
    bookId: input.bookId,
    imageUrl: input.coverUrl ?? null,
    snapshot: {
      title: input.title,
      subtitle: input.author ?? null,
      description: truncateShareDescription(input.description),
      thumbnailUrl: input.coverUrl ?? null,
      posterName: null,
      posterAvatarUrl: null,
      rating: null,
      tags: [],
      timestamp: null,
      spoiler: false,
      edited: false,
      destinationPath: normalizeShareDestination(
        input.destinationPath ?? `/book/${input.bookId}`
      ),
    },
  };
}

export function buildClubShareComposerPayload(input: {
  clubId: string;
  name: string;
  coverUrl?: string | null;
  description?: string | null;
  destinationPath?: string;
}): ShareComposerPayload {
  return {
    contentType: "club",
    contentId: input.clubId,
    title: input.name,
    body: input.description?.trim() || input.name,
    imageUrl: input.coverUrl ?? null,
    snapshot: {
      title: input.name,
      subtitle: "Book Club",
      description: truncateShareDescription(input.description),
      thumbnailUrl: input.coverUrl ?? null,
      posterName: null,
      posterAvatarUrl: null,
      rating: null,
      tags: [],
      timestamp: null,
      spoiler: false,
      edited: false,
      destinationPath: normalizeShareDestination(
        input.destinationPath ?? `/clubs/${input.clubId}`
      ),
    },
  };
}

export function buildProfileShareComposerPayload(input: {
  userId: string;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  destinationPath: string;
}): ShareComposerPayload {
  return {
    contentType: "profile",
    contentId: input.userId,
    title: input.displayName,
    body: input.bio?.trim() || input.displayName,
    imageUrl: input.avatarUrl ?? null,
    snapshot: {
      title: input.displayName,
      subtitle: input.username ? `@${input.username}` : null,
      description: truncateShareDescription(input.bio),
      thumbnailUrl: input.avatarUrl ?? null,
      posterName: input.displayName,
      posterAvatarUrl: input.avatarUrl ?? null,
      rating: null,
      tags: [],
      timestamp: null,
      spoiler: false,
      edited: false,
      destinationPath: normalizeShareDestination(input.destinationPath),
    },
  };
}

export function buildReadingListShareComposerPayload(input: {
  listId: string;
  title: string;
  ownerName?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  destinationPath: string;
}): ShareComposerPayload {
  return {
    contentType: "reading_list",
    contentId: input.listId,
    title: input.title,
    body: input.description?.trim() || input.title,
    imageUrl: input.coverUrl ?? null,
    snapshot: {
      title: input.title,
      subtitle: input.ownerName ?? "Reading List",
      description: truncateShareDescription(input.description),
      thumbnailUrl: input.coverUrl ?? null,
      posterName: input.ownerName ?? null,
      posterAvatarUrl: null,
      rating: null,
      tags: [],
      timestamp: null,
      spoiler: false,
      edited: false,
      destinationPath: normalizeShareDestination(input.destinationPath),
    },
  };
}

export function buildReadingDnaShareComposerPayload(input: {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  summary?: string | null;
  destinationPath: string;
}): ShareComposerPayload {
  return {
    contentType: "reading_dna",
    contentId: input.userId,
    title: `${input.displayName}'s Reading DNA`,
    body: input.summary?.trim() || `${input.displayName}'s Reading DNA`,
    imageUrl: input.avatarUrl ?? null,
    snapshot: {
      title: `${input.displayName}'s Reading DNA`,
      subtitle: input.displayName,
      description: truncateShareDescription(input.summary),
      thumbnailUrl: input.avatarUrl ?? null,
      posterName: input.displayName,
      posterAvatarUrl: input.avatarUrl ?? null,
      rating: null,
      tags: [],
      timestamp: null,
      spoiler: false,
      edited: false,
      destinationPath: normalizeShareDestination(input.destinationPath),
    },
  };
}

export function buildAuthorShareComposerPayload(input: {
  authorId: string;
  name: string;
  photoUrl?: string | null;
  bio?: string | null;
  destinationPath: string;
}): ShareComposerPayload {
  return {
    contentType: "author",
    contentId: input.authorId,
    title: input.name,
    body: input.bio?.trim() || input.name,
    imageUrl: input.photoUrl ?? null,
    snapshot: {
      title: input.name,
      subtitle: "Author",
      description: truncateShareDescription(input.bio),
      thumbnailUrl: input.photoUrl ?? null,
      posterName: null,
      posterAvatarUrl: null,
      rating: null,
      tags: [],
      timestamp: null,
      spoiler: false,
      edited: false,
      destinationPath: normalizeShareDestination(input.destinationPath),
    },
  };
}

export function buildActivityShareComposerPayload(input: {
  activityId: string;
  title: string;
  body: string;
  actorName: string;
  actorAvatarUrl?: string | null;
  bookId?: string | null;
  bookCoverUrl?: string | null;
  destinationPath: string;
  createdAt?: string | null;
}): ShareComposerPayload {
  return {
    contentType: "activity",
    contentId: input.activityId,
    title: input.title,
    body: input.body.trim() || input.title,
    bookId: input.bookId ?? null,
    imageUrl: input.bookCoverUrl ?? null,
    snapshot: {
      title: input.title,
      subtitle: input.actorName,
      description: truncateShareDescription(input.body),
      thumbnailUrl: input.bookCoverUrl ?? null,
      posterName: input.actorName,
      posterAvatarUrl: input.actorAvatarUrl ?? null,
      rating: null,
      tags: [],
      timestamp: input.createdAt ?? null,
      spoiler: false,
      edited: false,
      destinationPath: normalizeShareDestination(input.destinationPath),
    },
  };
}

/** Inbox / notification one-line preview for a message with optional share. */
export function conversationSharePreviewText(input: {
  body?: string | null;
  share?: MessageSharePayload | null;
  attachmentUrl?: string | null;
}): string {
  const note = input.body?.trim() ?? "";
  if (note) return note;
  if (input.share) {
    const label = shareContentTypeLabel(input.share.contentType);
    const title = input.share.snapshot.title.trim();
    return title ? `Shared ${label}: ${title}` : `Shared a ${label.toLowerCase()}`;
  }
  if (input.attachmentUrl) return "Sent an image";
  return "No messages yet";
}

export const DEFAULT_SITE_URL = "https://bookmarked.online";

export type ExternalShareContent = {
  title: string;
  /** Branded preview text (no internal IDs). */
  text: string;
  /** Absolute https URL for rich previews / deep links. */
  url: string;
};

export function absoluteShareUrl(
  destinationPath: string,
  siteUrl: string = DEFAULT_SITE_URL
): string {
  const path = normalizeShareDestination(destinationPath);
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${path}`;
}

/**
 * Build native/Web Share API payload from a composer or message share snapshot.
 * Text stays human-readable; the absolute URL is provided separately for link previews.
 */
export function buildExternalShareContent(
  input: ShareComposerPayload | MessageSharePayload,
  siteUrl: string = DEFAULT_SITE_URL
): ExternalShareContent {
  const snap = input.snapshot;
  const label = shareContentTypeLabel(input.contentType);
  const title = `${snap.title} · Bookmarked`;

  const lines: string[] = [];
  if (snap.posterName?.trim()) {
    lines.push(`${label} by ${snap.posterName.trim()}`);
  } else {
    lines.push(label);
  }
  lines.push(snap.title.trim());
  if (snap.subtitle?.trim() && snap.subtitle.trim() !== snap.posterName?.trim()) {
    lines.push(snap.subtitle.trim());
  }
  if (typeof snap.rating === "number" && Number.isFinite(snap.rating)) {
    const stars = "★".repeat(Math.min(5, Math.max(0, Math.round(snap.rating))));
    lines.push(`${stars} ${snap.rating.toFixed(1).replace(/\.0$/, "")}/5`);
  }
  if (snap.description?.trim()) {
    lines.push(`“${snap.description.trim()}”`);
  }
  lines.push("");
  lines.push("Shared via Bookmarked");

  return {
    title,
    text: lines.join("\n"),
    url: absoluteShareUrl(snap.destinationPath, siteUrl),
  };
}
