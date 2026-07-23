import { Pressable, Text, View } from "react-native";
import type { DisplayLibraryView } from "../../services/libraryView";

const OPTIONS: { mode: DisplayLibraryView; label: string }[] = [
  { mode: "bookshelf", label: "Bookshelf" },
  { mode: "grid", label: "Grid" },
];

type Props = {
  view: DisplayLibraryView;
  onChange: (mode: DisplayLibraryView) => void;
  disabled?: boolean;
};

export function LibraryViewToggle({ view, onChange, disabled }: Props) {
  return (
    <View
      className="flex-row rounded-xl border border-brand-border bg-surface p-1"
      accessibilityRole="tablist"
      accessibilityLabel="Library view mode"
    >
      {OPTIONS.map(({ mode, label }) => {
        const active = view === mode;
        return (
          <Pressable
            key={mode}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            disabled={disabled}
            onPress={() => onChange(mode)}
            className={`min-h-[40px] flex-1 items-center justify-center rounded-lg px-3 py-2 ${
              active ? "bg-puce-red" : "active:bg-primary/10"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${active ? "text-white" : "text-ink-muted"}`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
