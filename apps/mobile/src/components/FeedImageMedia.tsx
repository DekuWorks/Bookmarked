import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";
import {
  layoutFeedImageMedia,
  resolveFeedImageMaxHeight,
  type FeedImageCrop,
} from "../../../../packages/utils/feedImageMedia";
import { resolveFeedInlineImageSource } from "../../../../packages/utils/mediaDisplayUrl";
import { useThemeColors } from "../store/themeStore";
import { isGiphyImageUrl } from "../utils/giphy";
import { FeedImageViewer } from "./FeedImageViewer";

type LoadState = "loading" | "ready" | "error";

type Props = {
  url: string;
  alt?: string;
  originalWidth?: number | null;
  originalHeight?: number | null;
  compact?: boolean;
  crop?: FeedImageCrop | null;
  rounded?: boolean;
  priority?: boolean;
  onOpen?: () => void;
};

export function FeedImageMedia({
  url,
  alt,
  originalWidth,
  originalHeight,
  compact = false,
  crop = null,
  rounded = true,
  priority: _priority = false,
  onOpen,
}: Props) {
  const { height: viewportHeight } = useWindowDimensions();
  const colors = useThemeColors();
  const [containerWidth, setContainerWidth] = useState(0);
  const [naturalWidth, setNaturalWidth] = useState<number | null>(originalWidth ?? null);
  const [naturalHeight, setNaturalHeight] = useState<number | null>(originalHeight ?? null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [viewerOpen, setViewerOpen] = useState(false);
  const source = resolveFeedInlineImageSource(url, isGiphyImageUrl(url));
  const [displayUrl, setDisplayUrl] = useState(source.displayUrl);

  const resolvedAlt = alt ?? (isGiphyImageUrl(url) ? "Post GIF" : "Post image");

  useEffect(() => {
    const next = resolveFeedInlineImageSource(url, isGiphyImageUrl(url));
    setNaturalWidth(originalWidth ?? null);
    setNaturalHeight(originalHeight ?? null);
    setLoadState("loading");
    setDisplayUrl(next.displayUrl);
  }, [url, originalWidth, originalHeight]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (next > 0) setContainerWidth(next);
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

  const handleOpen = useCallback(() => {
    if (loadState !== "ready") return;
    onOpen?.();
    setViewerOpen(true);
  }, [loadState, onOpen]);

  return (
    <View className="w-full max-w-full" onLayout={onLayout}>
      {loadState === "error" ? (
        <View
          className={`border border-brand-border bg-background px-3 py-6 ${rounded ? "rounded-lg" : ""}`}
          accessibilityRole="text"
          accessibilityLabel="Image unavailable"
        >
          <Text className="text-center text-sm text-ink-muted">Image unavailable</Text>
        </View>
      ) : (
        <Pressable
          onPress={handleOpen}
          accessibilityRole="button"
          accessibilityLabel={`View ${resolvedAlt}`}
          className={`overflow-hidden bg-background ${rounded ? "rounded-lg" : ""}`}
          style={{
            width: measured ? layout.width : "100%",
            height: measured ? layout.height : undefined,
            maxHeight,
            aspectRatio: measured ? undefined : layout.aspectRatio,
            alignSelf: "center",
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {loadState === "loading" ? (
            <View
              className="absolute inset-0 bg-primary/10"
              accessibilityElementsHidden
            />
          ) : null}
          <Image
            source={{ uri: displayUrl }}
            resizeMode={layout.fit}
            accessibilityLabel={resolvedAlt}
            onLoad={(event) => {
              const imageSource = event.nativeEvent.source;
              if (imageSource.width > 0 && imageSource.height > 0) {
                setNaturalWidth(imageSource.width);
                setNaturalHeight(imageSource.height);
              }
              setLoadState("ready");
            }}
            onError={() => {
              const next = resolveFeedInlineImageSource(url, isGiphyImageUrl(url));
              if (next.fallbackUrl && displayUrl !== next.fallbackUrl) {
                setDisplayUrl(next.fallbackUrl);
                setLoadState("loading");
                return;
              }
              setLoadState("error");
            }}
            style={{
              width: "100%",
              height: "100%",
            }}
          />
        </Pressable>
      )}

      <FeedImageViewer
        open={viewerOpen}
        url={url}
        alt={resolvedAlt}
        onClose={() => setViewerOpen(false)}
      />
    </View>
  );
}
