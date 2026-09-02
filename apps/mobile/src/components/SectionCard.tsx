import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { ShelfIconId } from "../constants/shelfIcons";
import { ShelfIcon } from "./ShelfIcon";

type Props = {
  title: string;
  emoji?: string;
  shelfIconId?: ShelfIconId;
  action?: ReactNode;
  /** `stacked` puts the action under the heading, left-aligned (Recent Activity). */
  actionLayout?: "inline" | "stacked";
  children: ReactNode;
  className?: string;
};

/** Card container with a section title, mirroring the web DashboardCard/ReadingRoomSection. */
export function SectionCard({
  title,
  emoji,
  shelfIconId,
  action,
  actionLayout = "inline",
  children,
  className,
}: Props) {
  const stacked = actionLayout === "stacked";

  return (
    <View
      className={`rounded-2xl border border-brand-border bg-surface p-4 shadow-md ${className ?? ""}`}
    >
      <View className={stacked ? "mb-4 items-start gap-1.5" : "mb-3 flex-row items-center justify-between"}>
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          {shelfIconId ? <ShelfIcon id={shelfIconId} size="small" /> : null}
          <Text
            className={
              stacked
                ? "flex-shrink text-base font-bold leading-tight text-ink"
                : "flex-shrink text-base font-bold leading-tight text-puce-red"
            }
          >
            {emoji && !shelfIconId ? `${emoji} ` : ""}
            {title}
          </Text>
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}
