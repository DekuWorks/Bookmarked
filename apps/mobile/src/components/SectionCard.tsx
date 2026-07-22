import type { ReactNode } from "react";
import { Text, View } from "react-native";

type Props = {
  title: string;
  emoji?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Card container with a section title, mirroring the web DashboardCard/ReadingRoomSection. */
export function SectionCard({ title, emoji, action, children, className }: Props) {
  return (
    <View
      className={`rounded-2xl border border-brand-border bg-surface p-4 shadow-md ${className ?? ""}`}
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-bold text-puce-red">
          {emoji ? `${emoji} ` : ""}
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}
