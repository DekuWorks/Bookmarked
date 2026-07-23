import { Image, type ImageStyle, type StyleProp } from "react-native";
import { getShelfIconConfig, type ShelfIconId } from "../constants/shelfIcons";

type Size = "xs" | "sm" | "md" | "lg";

const sizePx: Record<Size, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
};

type Props = {
  id: ShelfIconId;
  size?: Size;
  style?: StyleProp<ImageStyle>;
  /** When true, exposes the shelf name to assistive tech (default: decorative). */
  labeled?: boolean;
};

export function ShelfIcon({ id, size = "md", style, labeled = false }: Props) {
  const config = getShelfIconConfig(id);
  const px = sizePx[size];

  return (
    <Image
      source={config.source}
      accessibilityLabel={labeled ? config.label : undefined}
      accessibilityElementsHidden={!labeled}
      importantForAccessibility={labeled ? "yes" : "no-hide-descendants"}
      style={[{ width: px, height: px, resizeMode: "contain" }, style]}
    />
  );
}
