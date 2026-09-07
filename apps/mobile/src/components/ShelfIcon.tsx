import { useState } from "react";
import { Image, Text, View, type ImageStyle, type StyleProp } from "react-native";
import {
  getCustomShelfIconA11yLabel,
  getCustomShelfIconSource,
  getShelfIconConfig,
  resolveCustomShelfIcon,
  SHELF_ICON_FRAME_PX,
  SHELF_ICON_SIZE_PX,
  type ShelfIconId,
  type ShelfIconSize,
} from "../constants/shelfIcons";

type DefaultProps = {
  id: ShelfIconId;
  iconKey?: never;
  iconType?: never;
  iconEmoji?: never;
};

type CustomProps = {
  id?: never;
  iconKey?: string | null;
  iconType?: string | null;
  iconEmoji?: string | null;
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
  iconType,
  iconEmoji,
  size = "small",
  style,
  labeled = false,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isCustom = id == null;
  const defaultConfig = id ? getShelfIconConfig(id) : null;
  const customSelection = isCustom
    ? resolveCustomShelfIcon({
        icon_key: iconKey,
        icon_type: iconType,
        icon_emoji: iconEmoji,
      })
    : null;
  const isEmoji = customSelection?.type === "emoji";
  const source = isCustom
    ? getCustomShelfIconSource(iconKey)
    : defaultConfig!.source;
  const a11y = isCustom
    ? getCustomShelfIconA11yLabel(customSelection)
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
      {isEmoji ? (
        <Text style={{ fontSize: Math.round(px * 0.82), lineHeight: px }}>{customSelection.value}</Text>
      ) : (
        <>
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
        </>
      )}
    </View>
  );
}
