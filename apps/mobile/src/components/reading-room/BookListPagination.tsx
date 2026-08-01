import { Pressable, Text, View } from "react-native";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label?: string;
};

export function BookListPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  label = "books",
}: Props) {
  if (total <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <View className="mt-4 gap-2">
      <Text className="text-center text-sm text-ink-muted">
        Showing {start}–{end} of {total} {label}
      </Text>
      <View className="flex-row items-center justify-center gap-3">
        <Pressable
          onPress={() => onPageChange(page - 1)}
          disabled={page <= 1}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-brand-border bg-surface px-3 ${
            page <= 1 ? "opacity-40" : "active:opacity-80"
          }`}
        >
          <Text className="text-base font-semibold text-ink">←</Text>
        </Pressable>
        <Text className="text-sm font-medium text-ink">
          Page {page} of {totalPages}
        </Text>
        <Pressable
          onPress={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          accessibilityRole="button"
          accessibilityLabel="Next page"
          className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-brand-border bg-surface px-3 ${
            page >= totalPages ? "opacity-40" : "active:opacity-80"
          }`}
        >
          <Text className="text-base font-semibold text-ink">→</Text>
        </Pressable>
      </View>
    </View>
  );
}
