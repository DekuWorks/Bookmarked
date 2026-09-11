import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "./Button";
import { validateDiscussionFields } from "../../../../packages/utils/clubDiscussionUi";

export type EditDiscussionFormValues = {
  title: string;
  body: string;
};

type Props = {
  visible: boolean;
  initialTitle: string;
  initialBody: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: EditDiscussionFormValues) => void | Promise<void>;
};

/** Edit discussion sheet — mirrors create validation. */
export function EditDiscussionSheet({
  visible,
  initialTitle,
  initialBody,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    if (visible) {
      setTitle(initialTitle);
      setBody(initialBody);
    }
  }, [visible, initialTitle, initialBody]);

  async function handleSave() {
    const validated = validateDiscussionFields(title, body);
    if ("error" in validated) {
      Alert.alert("Couldn't save", validated.error);
      return;
    }
    await onSubmit(validated);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="flex-row items-center justify-between border-b border-brand-border px-4 py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            onPress={onClose}
            disabled={submitting}
            className="min-h-[44px] justify-center px-1"
          >
            <Text className="text-base text-ink-muted">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-bold text-puce-red">Edit Discussion</Text>
          <View className="min-w-[64px]" />
        </View>

        <View className="flex-1 gap-4 p-4">
          <View>
            <Text className="mb-1 text-sm font-medium text-ink">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              editable={!submitting}
              placeholder="What do you want to talk about?"
              placeholderTextColor="#9CA3AF"
              accessibilityLabel="Discussion title"
              className="min-h-[44px] rounded-xl border border-brand-border bg-surface px-3 text-base text-ink"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm font-medium text-ink">Body</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              editable={!submitting}
              multiline
              textAlignVertical="top"
              placeholder="Share a thought, question, or reaction with the club…"
              placeholderTextColor="#9CA3AF"
              accessibilityLabel="Discussion body"
              className="min-h-[160px] flex-1 rounded-xl border border-brand-border bg-surface px-3 py-3 text-base leading-6 text-ink"
            />
          </View>
          <Button
            title="Save"
            loading={submitting}
            disabled={!title.trim() || !body.trim()}
            onPress={() => void handleSave()}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
