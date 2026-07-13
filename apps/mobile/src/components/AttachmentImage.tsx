import { useEffect, useState } from "react";
import { Image, View } from "react-native";

type Props = {
  url: string;
  /** Rounded style; defaults to a medium radius. */
  rounded?: boolean;
  /** Max aspect ratio clamp (w/h). Tall images are capped so they don't dominate. */
  compact?: boolean;
};

/**
 * Renders an uploaded image or Giphy GIF inline with a sensible, size-aware
 * aspect ratio. Mirrors the web attachment rendering (posts, comments, messages).
 */
export function AttachmentImage({ url, rounded = true, compact = false }: Props) {
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Image.getSize(
      url,
      (w, h) => {
        if (active && w > 0 && h > 0) setRatio(w / h);
      },
      () => {
        if (active) setRatio(4 / 3);
      }
    );
    return () => {
      active = false;
    };
  }, [url]);

  // Clamp so very tall/wide media stays reasonable in the feed.
  const min = compact ? 0.9 : 0.6;
  const max = compact ? 1.6 : 1.9;
  const clamped = ratio ? Math.min(max, Math.max(min, ratio)) : 4 / 3;

  return (
    <View
      className={`w-full overflow-hidden bg-primary/10 ${rounded ? "rounded-xl" : ""}`}
      style={{ aspectRatio: clamped, maxHeight: compact ? 220 : 340 }}
    >
      <Image source={{ uri: url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
    </View>
  );
}
