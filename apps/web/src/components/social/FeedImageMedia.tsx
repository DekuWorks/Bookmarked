"use client";

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";
import { FeedImageViewer } from "@/components/social/FeedImageViewer";
import { isGiphyImageUrl } from "@/lib/utils/giphy";
import { cn } from "@/lib/utils/cn";
import {
  layoutFeedImageMedia,
  resolveFeedImageMaxHeight,
  type FeedImageCrop,
} from "@bookmarked/utils/feedImageMedia";

type LoadState = "loading" | "ready" | "error";

type Props = {
  url: string;
  alt?: string;
  originalWidth?: number | null;
  originalHeight?: number | null;
  compact?: boolean;
  crop?: FeedImageCrop | null;
  className?: string;
  onOpen?: () => void;
};

export function FeedImageMedia({
  url,
  alt,
  originalWidth,
  originalHeight,
  compact = false,
  crop = null,
  className,
  onOpen,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(
    typeof window === "undefined" ? 800 : window.innerHeight
  );
  const [naturalWidth, setNaturalWidth] = useState<number | null>(
    originalWidth ?? null
  );
  const [naturalHeight, setNaturalHeight] = useState<number | null>(
    originalHeight ?? null
  );
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [viewerOpen, setViewerOpen] = useState(false);
  const sourceKey = `${url}:${originalWidth ?? ""}:${originalHeight ?? ""}`;
  const [activeSource, setActiveSource] = useState(sourceKey);

  if (sourceKey !== activeSource) {
    setActiveSource(sourceKey);
    setNaturalWidth(originalWidth ?? null);
    setNaturalHeight(originalHeight ?? null);
    setLoadState("loading");
    setViewerOpen(false);
  }

  const resolvedAlt =
    alt ?? (isGiphyImageUrl(url) ? "Post GIF" : "Post image");

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      setContainerWidth(node.clientWidth);
      setViewportHeight(window.innerHeight);
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const maxHeight = resolveFeedImageMaxHeight({ compact, viewportHeight });
  const measured = containerWidth > 0;
  const layout = layoutFeedImageMedia({
    containerWidth: measured ? containerWidth : 360,
    maxHeight,
    naturalWidth,
    naturalHeight,
    crop,
  });

  const handleLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setNaturalWidth(image.naturalWidth);
      setNaturalHeight(image.naturalHeight);
    }
    setLoadState("ready");
  }, []);

  const handleOpen = useCallback(() => {
    if (loadState !== "ready") return;
    onOpen?.();
    setViewerOpen(true);
  }, [loadState, onOpen]);

  return (
    <div
      ref={containerRef}
      className={cn("w-full max-w-full", className)}
    >
      {loadState === "error" ? (
        <p
          className="rounded-lg border border-border bg-background px-3 py-6 text-center text-sm text-text-muted"
          role="status"
        >
          Image unavailable
        </p>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="mx-auto block max-w-full overflow-hidden rounded-lg border border-border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          style={{
            width: measured ? layout.width : "100%",
            height: measured ? layout.height : undefined,
            maxHeight,
            aspectRatio: measured ? undefined : layout.aspectRatio,
          }}
          aria-label={`View ${resolvedAlt}`}
        >
          {loadState === "loading" ? (
            <span className="skeleton block h-full w-full" aria-hidden />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={resolvedAlt}
            width={naturalWidth ?? undefined}
            height={naturalHeight ?? undefined}
            loading="lazy"
            decoding="async"
            onLoad={handleLoad}
            onError={() => setLoadState("error")}
            className={cn(
              "h-full w-full object-center",
              layout.fit === "cover" ? "object-cover" : "object-contain",
              loadState !== "ready" && "sr-only"
            )}
          />
        </button>
      )}

      <FeedImageViewer
        open={viewerOpen}
        src={url}
        alt={resolvedAlt}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
