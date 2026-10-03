import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { ShelfIconId } from "../constants/shelfIcons";
import { SECTION_CARD_HEADING_CLASS } from "../constants/sectionHeading";
import { ShelfIcon } from "./ShelfIcon";

type Props = {
  title: string;
  emoji?: string;
  /** waiting-on-assets: prefer BrandChromeIcon / ShelfIcon over Apple emoji. */
  icon?: ReactNode;
  shelfIconId?: ShelfIconId;
  action?: ReactNode;
  /** `stacked` puts the action under the heading, centered (Recent Activity). */
  actionLayout?: "inline" | "stacked";
  /** Overview sections center the title. Other screens keep the split header. */
  headerAlign?: "center" | "between";
  children: ReactNode;
  className?: string;
};

/** Card container with a section title, mirroring the web DashboardCard/ReadingRoomSection. */
export function SectionCard({
  title,
  emoji,
  icon,
  shelfIconId,
  action,
  actionLayout = "inline",
  headerAlign = "between",
  children,
  className,
}: Props) {
  const stacked = actionLayout === "stacked";
  const centered = stacked || headerAlign === "center";

  return (
    <View
      className={`rounded-2xl border border-brand-border bg-surface p-4 shadow-md ${className ?? ""}`}
    >
      <View
        className={
          centered
            ? "mb-4 w-full items-center gap-1.5"
            : "mb-3 flex-row items-center justify-between"
        }
      >
        <View
          className={
            centered
              ? "flex-row items-center justify-center gap-2"
              : "min-w-0 flex-1 flex-row items-center gap-2"
          }
        >
          {icon ?? (shelfIconId ? <ShelfIcon id={shelfIconId} size="small" /> : null)}
          <Text
            accessibilityRole="header"
            className={`${SECTION_CARD_HEADING_CLASS}${centered ? " text-center" : ""}`}
          >
            {emoji && !shelfIconId && !icon ? `${emoji} ` : ""}
            {title}
          </Text>
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}
