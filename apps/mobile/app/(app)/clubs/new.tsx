import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { BookCover } from "../../../src/components/BookCover";
import { BookPicker } from "../../../src/components/BookPicker";
import { Button } from "../../../src/components/Button";
import { CircleAvatarPicker } from "../../../src/components/CircleAvatarPicker";
import { Input } from "../../../src/components/Input";
import { useCreateClub } from "../../../src/hooks/useClubs";
import { ensureCatalogBook } from "../../../src/services/bookClubs";
import { uploadClubAvatar, type PickedImage } from "../../../src/services/storage";
import type { CatalogDoc } from "../../../src/services/isbndb";
import type { BookClubVisibility } from "../../../src/types";

const VISIBILITY_OPTIONS: { id: BookClubVisibility; label: string }[] = [
  { id: "public", label: "Public" },
  { id: "private", label: "Private" },
];

export default function CreateClubRoute() {
  const router = useRouter();
  const createMutation = useCreateClub();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<BookClubVisibility>("public");
  const [currentBook, setCurrentBook] = useState<CatalogDoc | null>(null);
  const [avatarImage, setAvatarImage] = useState<PickedImage | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert("Name required", "Give your club a name.");
      return;
    }

    setSubmitting(true);

    let currentBookId: string | null = null;
    if (currentBook) {
      const resolved = await ensureCatalogBook(currentBook);
      if (resolved.error || !resolved.bookId) {
        setSubmitting(false);
        Alert.alert("Couldn't add book", resolved.error ?? "Please try again.");
        return;
      }
      currentBookId = resolved.bookId;
    }

    const result = await createMutation.mutateAsync({
      name,
      description,
      visibility,
      currentBookId,
    });
    setSubmitting(false);

    if (result.error || !result.clubId) {
      Alert.alert("Couldn't create club", result.error ?? "Please try again.");
      return;
    }

    if (avatarImage) {
      const upload = await uploadClubAvatar(result.clubId, avatarImage);
      if (upload.error) {
        Alert.alert("Club created", `Photo upload failed: ${upload.error}`);
      }
    }

    router.replace(`/(app)/clubs/${result.clubId}`);
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Start a club" }} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <CircleAvatarPicker
          imageUrl={avatarImage?.uri ?? null}
          fallbackLabel={name || "Club"}
          disabled={submitting}
          onImagePicked={setAvatarImage}
          onRemove={() => setAvatarImage(null)}
        />

        <Input
          label="Club name"
          placeholder="Fantasy Fanatics, Cozy Mystery Crew…"
          value={name}
          onChangeText={setName}
          returnKeyType="next"
        />

        <Input
          label="Description"
          placeholder="What's this club about? What are you reading together?"
          value={description}
          onChangeText={setDescription}
          multiline
          className="min-h-[90px]"
          style={{ textAlignVertical: "top" }}
        />

        <View className="mb-3">
          <Text className="text-sm font-medium text-ink mb-1">Who can join?</Text>
          <View className="flex-row gap-2">
            {VISIBILITY_OPTIONS.map((option) => {
              const isActive = visibility === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  onPress={() => setVisibility(option.id)}
                  className={`flex-1 rounded-xl px-4 py-3 items-center ${
                    isActive ? "bg-puce-red" : "bg-primary/15"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isActive ? "text-white" : "text-puce-red"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="text-xs text-ink-muted mt-1.5">
            {visibility === "public"
              ? "Anyone can discover this club and join the discussion."
              : "Only people you add can see and join this club."}
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-ink mb-1">Current book (optional)</Text>
          {currentBook ? (
            <View className="flex-row items-center gap-3 rounded-xl border border-brand-border bg-surface p-3">
              <BookCover
                url={currentBook.cover_url}
                title={currentBook.title}
                sizeClassName="w-12 h-16"
              />
              <View className="flex-1">
                <Text className="font-medium text-ink" numberOfLines={2}>
                  {currentBook.title}
                </Text>
                {currentBook.author_name?.length ? (
                  <Text className="text-xs text-ink-muted mt-0.5" numberOfLines={1}>
                    {currentBook.author_name.join(", ")}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCurrentBook(null)}
                className="rounded-full bg-primary/15 px-3 py-2 active:opacity-80"
              >
                <Text className="text-xs font-semibold text-puce-red">Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Button
              title="Pick a book"
              variant="ghost"
              onPress={() => setPickerOpen(true)}
            />
          )}
        </View>

        <Button
          title="Create club"
          variant="primary"
          loading={submitting}
          disabled={!name.trim()}
          onPress={handleCreate}
        />
      </ScrollView>

      <BookPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={setCurrentBook}
        title="Set the current book"
      />
    </View>
  );
}
