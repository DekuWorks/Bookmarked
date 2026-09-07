import type { ReactNode } from "react";
import { View } from "react-native";

type Props = {
  children: ReactNode;
};

export function ShelfActionRow({ children }: Props) {
  return <View className="flex-row flex-wrap items-center justify-center gap-3">{children}</View>;
}
