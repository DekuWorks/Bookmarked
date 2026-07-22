import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { Button } from "./Button";

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  visible: boolean;
  bookTitle: string;
  startedAt?: string | null;
  onClose: () => void;
  onConfirm: (finishedAt: string) => void;
  loading?: boolean;
};

export function MarkFinishedSheet({
  visible,
  bookTitle,
  startedAt,
  onClose,
  onConfirm,
  loading,
}: Props) {
  const [finishDate, setFinishDate] = useState(todayInputValue());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setFinishDate(todayInputValue());
    setError(null);
  }, [visible]);

  const startedDate = startedAt?.slice(0, 10) ?? "";

  function handleConfirm() {
    if (startedDate && finishDate < startedDate) {
      setError("Finish date cannot be before start date.");
      return;
    }
    if (finishDate > todayInputValue()) {
      setError("Finish date cannot be in the future.");
      return;
    }
    setError(null);
    onConfirm(finishDate);
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/30" onPress={onClose}>
        <Pressable
          className="w-[min(100%,22rem)] rounded-2xl bg-surface p-5"
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-lg font-bold text-puce-red">Mark as finished</Text>
          <Text className="mt-2 text-sm leading-5 text-ink-muted">
            <Text className="font-semibold text-ink">{bookTitle}</Text> will move to your Read shelf,
            progress will be set to 100%, and a journal entry will be added.
          </Text>

          <Text className="mb-1 mt-4 text-sm font-medium text-ink">Finish date</Text>
          <TextInput
            value={finishDate}
            onChangeText={(value) => {
              setFinishDate(value);
              setError(null);
            }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#A99DAE"
            autoCapitalize="none"
            className="rounded-xl border border-brand-border bg-background px-3 py-3 text-base text-ink"
          />
          {error ? <Text className="mt-2 text-sm text-rust">{error}</Text> : null}

          <View className="mt-4 flex-row gap-2">
            <View className="flex-1">
              <Button title="Cancel" variant="ghost" onPress={onClose} disabled={loading} />
            </View>
            <View className="flex-1">
              <Button title="Mark finished" onPress={handleConfirm} loading={loading} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
