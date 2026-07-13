import { View } from "react-native";

/** Lavender/puce progress track mirroring the web reading-progress bars. */
export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
      <View className="h-2 rounded-full bg-royal-orange" style={{ width: `${clamped}%` }} />
    </View>
  );
}
