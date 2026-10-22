import { Text, View } from "react-native";

type Props = {
  startedAt?: string | null;
  finishedAt?: string | null;
};

function formatReadingDate(iso: string): string {
  const day = iso.slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00`) : new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Saved start and finish dates. Trail sits directly under this block. */
export function ReadingDatesSection({ startedAt, finishedAt }: Props) {
  return (
    <View className="rounded-2xl border border-brand-border bg-surface p-4">
      <Text className="text-lg font-bold text-puce-red">Reading dates</Text>
      {startedAt ? (
        <Text className="mt-2 text-sm text-ink">Started {formatReadingDate(startedAt)}</Text>
      ) : null}
      {finishedAt ? (
        <Text className="mt-1 text-sm text-ink">Finished {formatReadingDate(finishedAt)}</Text>
      ) : null}
    </View>
  );
}
