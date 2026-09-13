import { Text, TextInput, View } from "react-native";
import {
  combineListeningTimeParts,
  formatListeningTimeSpoken,
  parseListeningTime,
} from "../../../../packages/utils/listeningTime";

type Props = {
  label: string;
  hint?: string;
  hours: string;
  minutes: string;
  onHoursChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  onBlur?: () => void;
  error?: string | null;
  /** When true, reserve equal label height for side-by-side columns. */
  aligned?: boolean;
};

function spokenLabel(hours: string, minutes: string): string | undefined {
  const parsed = parseListeningTime(combineListeningTimeParts(hours, minutes));
  return parsed.ok ? formatListeningTimeSpoken(parsed.seconds) : undefined;
}

export function ListeningTimeInput({
  label,
  hint,
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  onBlur,
  error,
  aligned = false,
}: Props) {
  const accessibilityValue = spokenLabel(hours, minutes);

  return (
    <View className="min-w-0 flex-1 gap-1.5">
      <View className={aligned ? "min-h-[40px] justify-end" : undefined}>
        <Text className="text-sm font-medium leading-5 text-ink">{label}</Text>
      </View>
      {hint ? <Text className="text-xs text-ink-muted">{hint}</Text> : null}
      <View className="flex-row items-center gap-2">
        <TextInput
          value={hours}
          onChangeText={onHoursChange}
          onBlur={onBlur}
          keyboardType="number-pad"
          placeholder="2"
          placeholderTextColor="#A99DAE"
          accessibilityLabel={`${label} hours`}
          accessibilityValue={accessibilityValue ? { text: accessibilityValue } : undefined}
          className="min-h-[48px] min-w-[72px] flex-1 rounded-xl border border-brand-border bg-background px-3 py-3 text-center text-base text-ink"
        />
        <Text className="text-lg font-semibold text-ink">:</Text>
        <TextInput
          value={minutes}
          onChangeText={onMinutesChange}
          onBlur={onBlur}
          keyboardType="number-pad"
          placeholder="30"
          placeholderTextColor="#A99DAE"
          maxLength={2}
          accessibilityLabel={`${label} minutes`}
          accessibilityValue={accessibilityValue ? { text: accessibilityValue } : undefined}
          className="min-h-[48px] min-w-[72px] flex-1 rounded-xl border border-brand-border bg-background px-3 py-3 text-center text-base text-ink"
        />
      </View>
      {error ? <Text className="text-xs text-rust">{error}</Text> : null}
    </View>
  );
}
