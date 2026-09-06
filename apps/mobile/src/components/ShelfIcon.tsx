import { useState } from "react";
import { Image, View, type ImageStyle, type StyleProp } from "react-native";
import {
  getCustomShelfA11yLabel,
  getCustomShelfIconSource,
  getShelfIconConfig,
  SHELF_ICON_FRAME_PX,
  SHELF_ICON_SIZE_PX,
  type ShelfIconId,
  type ShelfIconSize,
} from "../constants/shelfIcons";

type DefaultProps = {
  id: ShelfIconId;
  iconKey?: never;
};

type CustomProps = {
  id?: never;
  iconKey?: string | null;
};

type Props = (DefaultProps | CustomProps) & {
  size?: ShelfIconSize;
  style?: StyleProp<ImageStyle>;
  /** When true, exposes the shelf name to assistive tech (default: decorative). */
  labeled?: boolean;
};

export function ShelfIcon({
  id,
  iconKey,
  size = "small",
  style,
  labeled = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isCustom = id == null;
  const defaultConfig = id ? getShelfIconConfig(id) : null;
  const source = isCustom
    ? getCustomShelfIconSource(iconKey)
    : defaultConfig!.source;
  const a11y = isCustom
    ? getCustomShelfA11yLabel(iconKey)
    : defaultConfig!.accessibilityLabel;
  const px = SHELF_ICON_SIZE_PX[size];
  const frame = SHELF_ICON_FRAME_PX[size];

  return (
    <View
      accessibilityLabel={labeled ? a11y : undefined}
      accessibilityElementsHidden={!labeled}
      importantForAccessibility={labeled ? "yes" : "no-hide-descendants"}
      style={[
        {
          width: frame,
          height: frame,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
          borderWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        },
        style,
      ]}
    >
      {!loaded && !error ? (
        <View
          style={{
            width: px,
            height: px,
            backgroundColor: "transparent",
            opacity: 0.35,
          }}
        />
      ) : null}
      {error && !isCustom ? (
        <View
          style={{
            width: px,
            height: px,
            backgroundColor: "transparent",
          }}
        />
      ) : (
        <Image
          source={source}
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
