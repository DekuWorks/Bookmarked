import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type BrandChromeIconName = "notes" | "clubs" | "save" | "library" | "search" | "home";

const ICONS: Record<BrandChromeIconName, ComponentProps<typeof Ionicons>["name"]> = {
  notes: "document-text-outline",
  clubs: "people-outline",
  save: "bookmark-outline",
  library: "library-outline",
  search: "search-outline",
  home: "home-outline",
};

type Props = {
  name: BrandChromeIconName;
  size?: number;
  color?: string;
};

/** waiting-on-assets: Leighton final purple chrome set. ShelfIcon/brand mark until then. */
export function BrandChromeIcon({ name, size = 20, color = "#642F37" }: Props) {
  return <Ionicons name={ICONS[name]} size={size} color={color} accessible={false} />;
}
