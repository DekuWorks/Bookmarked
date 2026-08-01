import { useState } from "react";
import { Image, View, type ImageStyle, type StyleProp } from "react-native";
import {
  getShelfIconConfig,
  SHELF_ICON_FRAME_PX,
  SHELF_ICON_SIZE_PX,
  type ShelfIconId,
  type ShelfIconSize,
} from "../constants/shelfIcons";

type Props = {
  id: ShelfIconId;
  size?: ShelfIconSize;
  style?: StyleProp<ImageStyle>;
  /** When true, exposes the shelf name to assistive tech (default: decorative). */
  labeled?: boolean;
};

export function ShelfIcon({ id, size = "small", style, labeled = false }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const config = getShelfIconConfig(id);
  const px = SHELF_ICON_SIZE_PX[size];
  const frame = SHELF_ICON_FRAME_PX[size];

  return (
    <View
      accessibilityLabel={labeled ? config.accessibilityLabel : undefined}
      accessibilityElementsHidden={!labeled}
      importantForAccessibility={labeled ? "yes" : "no-hide-descendants"}
      style={[
        {
          width: frame,
          height: frame,
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible",
          borderRadius: 6,
          borderWidth: 0,
          backgroundColor: "transparent",
        },
        style,
      ]}
    >
      {!loaded && !error ? (
        <View
          style={{
            width: px * 0.8,
            height: px * 0.8,
            borderRadius: 4,
            backgroundColor: "rgba(100, 47, 55, 0.1)",
          }}
        />
      ) : null}
      {error ? (
        <View
          style={{
            width: px * 0.8,
            height: px * 0.8,
            borderRadius: 4,
            backgroundColor: "rgba(100, 47, 55, 0.08)",
          }}
        />
      ) : (
        <Image
          source={config.source}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            width: px,
            height: px,
            resizeMode: "contain",
            opacity: loaded ? 1 : 0,
          }}
        />
      )}
    </View>
  );
}
