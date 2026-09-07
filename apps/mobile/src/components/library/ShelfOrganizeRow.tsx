import { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  getShelfSortOptions,
  type ShelfSortMode,
} from "../../../../../packages/utils/shelfSort";

const SIDE_BY_SIDE_MIN_WIDTH = 640;
const CONTROL_HEIGHT = 44;

type Props = {
  query: string;
  onQueryChange: (query: string) => void;
  sort: ShelfSortMode;
  onSortChange: (mode: ShelfSortMode) => void;
  shelfStatus?: string;
};

export function ShelfOrganizeRow({
  query,
  onQueryChange,
  sort,
  onSortChange,
  shelfStatus,
}: Props) {
  const { width } = useWindowDimensions();
  const sideBySide = width >= SIDE_BY_SIDE_MIN_WIDTH;
  const [sortOpen, setSortOpen] = useState(false);
  const options = getShelfSortOptions(shelfStatus);
  const activeLabel = options.find((option) => option.mode === sort)?.label ?? "Sort by";

  return (
    <View className="rounded-xl border border-brand-border bg-surface p-4">
      <Text className="mb-3 text-center text-sm font-medium text-puce-red">Organize shelf</Text>
      <View className={sideBySide ? "flex-row items-end gap-3" : "flex-col gap-3"}>
        <View className={sideBySide ? "min-w-0 flex-1" : "w-full"}>
          <Text className="mb-1 text-xs font-medium leading-4 text-ink-muted">
            Filter by title or author
          </Text>
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Filter by title or author"
            placeholderTextColor="#A99DAE"
            autoCorrect={false}
            autoCapitalize="none"
            className="rounded-lg border border-brand-border bg-background px-3 text-sm text-ink"
            style={{ height: CONTROL_HEIGHT, lineHeight: 20, paddingVertical: 0 }}
            accessibilityLabel="Filter by title or author"
          />
        </View>
        <View className={sideBySide ? "w-56" : "w-full"}>
          <Text className="mb-1 text-xs font-medium leading-4 text-ink-muted">Sort by</Text>
          <Pressable
            onPress={() => setSortOpen(true)}
            className="justify-center rounded-lg border border-brand-border bg-background px-3"
            style={{ height: CONTROL_HEIGHT }}
            accessibilityRole="button"
            accessibilityLabel="Sort by"
          >
            <Text className="text-sm text-ink" numberOfLines={1}>
              {activeLabel}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal transparent visible={sortOpen} animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setSortOpen(false)}>
          <Pressable
            className="rounded-t-2xl border border-brand-border bg-surface px-4 pb-8 pt-3"
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="mb-2 text-center text-sm font-medium text-puce-red">Sort by</Text>
            {options.map((option) => {
              const active = option.mode === sort;
              return (
                <Pressable
                  key={option.mode}
                  onPress={() => {
                    onSortChange(option.mode);
                    setSortOpen(false);
                  }}
                  className="min-h-[44px] justify-center border-b border-brand-border py-2"
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text className={active ? "font-semibold text-puce-red" : "text-ink"}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
