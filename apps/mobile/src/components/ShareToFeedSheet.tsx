import { useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookCover } from "./BookCover";
import { Button } from "./Button";
import { createPost } from "../services/posts";
import type { FeedSourceType } from "../../../../packages/utils/feedShare";

export type ShareToFeedPreview = {
  sourceType: FeedSourceType;
  sourceId: string;
  bookId?: string | null;
  bookTitle?: string | null;
  bookCoverUrl?: string | null;
  rating?: number | null;
  body: string;
};

type Props = {
  visible: boolean;
  preview: ShareToFeedPreview | null;
  onClose: () => void;
  onShared?: () => void;
};

export function ShareToFeedSheet({ visible, preview, onClose, onShared }: Props) {
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

  async function share() {
    if (!preview) return;
    setSaving(true);
    const captionText = caption.trim();
    const result = await createPost({
      body: captionText ? `${captionText}\n\n${preview.body}` : preview.body,
      bookId: preview.bookId,
      sourceType: preview.sourceType,
      sourceId: preview.sourceId,
    });
    setSaving(false);
    if (result.error) {
      Alert.alert("Couldn't share", result.error);
      return;
    }
    setCaption("");
    onShared?.();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center justify-between border-b border-brand-border px-4 pb-3">
          <Pressable onPress={onClose}>
            <Text className="text-base text-ink-muted">Skip</Text>
          </Pressable>
          <Text className="text-lg font-bold text-puce-red">Share to Feed</Text>
          <View className="w-10" />
        </View>

        {preview ? (
          <View className="gap-4 p-4">
            <View className="flex-row gap-3 rounded-2xl border border-brand-border bg-surface p-3">
              {preview.bookTitle ? (
                <BookCover url={preview.bookCoverUrl} title={preview.bookTitle} sizeClassName="w-14 h-20" />
              ) : null}
              <View className="min-w-0 flex-1">
                {preview.bookTitle ? (
                  <Text className="font-semibold text-ink">{preview.bookTitle}</Text>
                ) : null}
                {preview.rating != null ? (
                  <Text className="text-sm text-ink-muted">{preview.rating}/5</Text>
                ) : null}
                <Text className="mt-1 text-sm text-ink-muted" numberOfLines={6}>
                  {preview.body}
                </Text>
              </View>
            </View>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a note for your feed…"
              multiline
              className="min-h-[88px] rounded-xl border border-brand-border bg-surface px-3 py-3 text-base text-ink"
            />
            <Button title="Share to Feed" loading={saving} onPress={() => void share()} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
