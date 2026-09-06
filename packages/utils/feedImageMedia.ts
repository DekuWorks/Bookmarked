/**
 * Shared Feed image sizing. Preserve the source aspect ratio on every
 * breakpoint — never stretch, auto-crop, or clamp to a fake ratio.
 *
 * Multi-image / crop: posts store a single `image_url`. There is no crop
 * metadata and no multi-image gallery. Compact thumbnails (share cards,
 * 48×64 chips) may still crop; Full Image View always shows the original
 * with `contain`.
 */

export const FEED_IMAGE_MEDIA = {
  fit: "contain",
  /** Default Feed / post-detail max height (px). Portrait taller than this is narrowed + centered. */
  maxHeightPx: 480,
  /** Repost embed, comment attachment. */
  compactMaxHeightPx: 280,
  /**
   * Cap for a very wide post column (iPad landscape, large desktop).
   * Web Feed is already `max-w-3xl`; this only bites when the media slot
   * itself is wider than a readable column.
   */
  maxMediaWidthPx: 640,
  /** Reserved box before natural size is known — avoids CLS without inventing a crop. */
  fallbackAspectRatio: 4 / 3,
  radiusPx: 8,
  /** Do not scale a naturally small image past this width. */
  tinyNaturalWidthPx: 240,
} as const;

export type FeedImageFit = typeof FEED_IMAGE_MEDIA.fit;

export type FeedImageOrientation = "portrait" | "landscape" | "square";

export type FeedImageCropMode = "contain" | "cover";

/**
 * Optional crop hint from an upload cropper. Bookmarked does not store
 * crop metadata today — callers should omit this unless a future upload
 * flow records an explicit user crop.
 */
export type FeedImageCrop = {
  mode: FeedImageCropMode;
};

export type FeedImageLayoutInput = {
  containerWidth: number;
  maxHeight: number;
  maxWidth?: number;
  naturalWidth?: number | null;
  naturalHeight?: number | null;
  crop?: FeedImageCrop | null;
};

export type FeedImageLayout = {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: FeedImageOrientation;
  fit: FeedImageCropMode;
  /** True when the max-height cap made the box narrower than the available width. */
  narrowedByMaxHeight: boolean;
  /** Horizontal inset to center a narrowed (or tiny) box in the container. */
  offsetX: number;
  reserved: boolean;
};

export function resolveFeedImageAspectRatio(
  width: number | null | undefined,
  height: number | null | undefined
): number | null {
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }
  return width / height;
}

export function feedImageOrientation(aspectRatio: number): FeedImageOrientation {
  if (Math.abs(aspectRatio - 1) < 0.02) return "square";
  return aspectRatio > 1 ? "landscape" : "portrait";
}

export function resolveFeedImageMaxHeight(options: {
  compact?: boolean;
  viewportHeight: number;
}): number {
  const token = options.compact
    ? FEED_IMAGE_MEDIA.compactMaxHeightPx
    : FEED_IMAGE_MEDIA.maxHeightPx;
  if (!Number.isFinite(options.viewportHeight) || options.viewportHeight <= 0) {
    return token;
  }
  const viewportCap = Math.round(options.viewportHeight * 0.7);
  return Math.max(120, Math.min(token, viewportCap));
}

export function resolveFeedImageMaxWidth(containerWidth: number): number {
  const available = Math.max(0, containerWidth);
  return Math.min(available, FEED_IMAGE_MEDIA.maxMediaWidthPx);
}

/**
 * Size a Feed image inside a post column.
 *
 * - Width up to the post content width (and {@link FEED_IMAGE_MEDIA.maxMediaWidthPx}).
 * - Height from the source ratio.
 * - Portrait taller than `maxHeight` is narrowed (not cropped) and centered.
 * - Tiny sources are not stretched to the full column.
 * - `crop.mode === "cover"` only when the user explicitly cropped on upload.
 */
export function layoutFeedImageMedia(input: FeedImageLayoutInput): FeedImageLayout {
  const containerWidth = Math.max(0, input.containerWidth);
  const maxHeight = Math.max(1, input.maxHeight);
  const maxWidth = Math.min(
    containerWidth,
    input.maxWidth ?? FEED_IMAGE_MEDIA.maxMediaWidthPx
  );
  const naturalRatio = resolveFeedImageAspectRatio(
    input.naturalWidth,
    input.naturalHeight
  );
  const aspectRatio = naturalRatio ?? FEED_IMAGE_MEDIA.fallbackAspectRatio;
  const reserved = naturalRatio == null;
  const fit: FeedImageCropMode = input.crop?.mode === "cover" ? "cover" : "contain";

  let width = maxWidth;
  if (
    !reserved &&
    input.naturalWidth &&
    input.naturalWidth > 0 &&
    input.naturalWidth < maxWidth &&
    input.naturalWidth <= FEED_IMAGE_MEDIA.tinyNaturalWidthPx
  ) {
    width = input.naturalWidth;
  }

  let height = width / aspectRatio;
  let narrowedByMaxHeight = false;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
    narrowedByMaxHeight = true;
  }

  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
    narrowedByMaxHeight = height >= maxHeight - 0.5 && naturalRatio != null
      ? (maxWidth / aspectRatio) > maxHeight
      : narrowedByMaxHeight;
  }

  const offsetX = Math.max(0, (containerWidth - width) / 2);

  return {
    width,
    height,
    aspectRatio,
    orientation: feedImageOrientation(aspectRatio),
    fit,
    narrowedByMaxHeight,
    offsetX,
    reserved,
  };
}
