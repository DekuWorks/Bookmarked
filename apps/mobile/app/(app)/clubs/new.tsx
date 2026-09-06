import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { BookCover } from "../../../src/components/BookCover";
import { BookPicker } from "../../../src/components/BookPicker";
import { Button } from "../../../src/components/Button";
import { CircleAvatarPicker } from "../../../src/components/CircleAvatarPicker";
import { FeatureLimitModal } from "../../../src/components/FeatureLimitModal";
import { Input } from "../../../src/components/Input";
import { InviteMembersSheet } from "../../../src/components/InviteMembersSheet";
import { ENTITLEMENT_LIMIT_MESSAGES, isEntitlementLimitError } from "../../../src/utils/subscription";
import {
  useCreateClub,
  useShareClubToFeed,
} from "../../../src/hooks/useClubs";
import { ensureCatalogBook } from "../../../src/services/bookClubs";
import { uploadClubAvatar, type PickedImage } from "../../../src/services/storage";
import { TAB_BAR_SPACE } from "../../../src/navigation/TabBarScroll";
import type { CatalogDoc } from "../../../src/services/isbndb";
import { useAuthStore } from "../../../src/store/authStore";
import type { BookClubJoinPolicy, BookClubVisibility } from "../../../src/types";
import {
  CLUB_GENRE_OPTIONS,
  canShareClubToFeed,
} from "../../../../../packages/utils/clubPermissions";

type Step = 0 | 1 | 2 | 3;

const VISIBILITY_OPTIONS: {
  id: BookClubVisibility;
  label: string;
  hint: string;
}[] = [
  {
    id: "public",
    label: "Public",
    hint: "Anyone can discover this club.",
  },
  {
    id: "private",
    label: "Private",
    hint: "Hidden from discovery; join by request or invite.",
  },
  {
    id: "invite_only",
    label: "Invite only",
    hint: "Members join only with an invitation.",
  },
];

function defaultJoinPolicyFor(visibility: BookClubVisibility): BookClubJoinPolicy {
  if (visibility === "public") return "open";
  if (visibility === "invite_only") return "invitation_only";
  return "request_approval";
}

export default function CreateClubRoute() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const createMutation = useCreateClub();

  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<BookClubVisibility>("public");
  const [joinPolicy, setJoinPolicy] = useState<BookClubJoinPolicy>("open");
  const [genres, setGenres] = useState<string[]>([]);
  const [currentBook, setCurrentBook] = useState<CatalogDoc | null>(null);
  const [avatarImage, setAvatarImage] = useState<PickedImage | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdClubId, setCreatedClubId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const shareToFeed = useShareClubToFeed(createdClubId ?? "");

  const joinPolicyOptions = useMemo(() => {
    if (visibility === "public") {
      return [
        { id: "open" as const, label: "Open", hint: "Anyone can join instantly." },
        {
          id: "request_approval" as const,
          label: "Request",
          hint: "Readers request; hosts approve.",
        },
      ];
    }
    if (visibility === "private") {
      return [
        {
          id: "request_approval" as const,
          label: "Request",
          hint: "Readers request; hosts approve.",
        },
        {
          id: "invitation_only" as const,
          label: "Invite only",
          hint: "Only people you invite can join.",
        },
      ];
    }
    return [
      {
        id: "invitation_only" as const,
        label: "Invite only",
        hint: "Only people you invite can join.",
      },
    ];
  }, [visibility]);

  function setVisibilityAndPolicy(next: BookClubVisibility) {
    setVisibility(next);
    setJoinPolicy(defaultJoinPolicyFor(next));
  }

  function toggleGenre(genre: string) {
    setGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre]
    );
  }

  function canContinue(): boolean {
    if (step === 0) return Boolean(name.trim());
    return true;
  }

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
      joinPolicy,
      genreTags: genres,
      currentBookId,
    });
    setSubmitting(false);

    if (result.error || !result.clubId) {
      if (result.error && isEntitlementLimitError(result.error)) {
        setLimitOpen(true);
        return;
      }
      Alert.alert("Couldn't create club", result.error ?? "Please try again.");
      return;
    }

    if (avatarImage) {
      const upload = await uploadClubAvatar(result.clubId, avatarImage);
      if (upload.error) {
        Alert.alert("Club created", `Photo upload failed: ${upload.error}`);
      }
    }

    setCreatedClubId(result.clubId);
    setStep(3);
  }

  async function handleShareToFeed() {
    if (!createdClubId || !canShareClubToFeed(visibility)) return;
    const result = await shareToFeed.mutateAsync();
    if (result.error) {
      Alert.alert("Couldn't share", result.error);
      return;
    }
    Alert.alert("Shared", "Your club was shared to the feed.");
  }

  function finish() {
    if (createdClubId) {
      router.replace(`/(app)/clubs/${createdClubId}`);
      return;
    }
    router.back();
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Start a club" }} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: TAB_BAR_SPACE }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-1 text-xs font-semibold uppercase text-ink-muted">
          Step {Math.min(step + 1, 4)} of 4
        </Text>
        <Text className="mb-4 text-lg font-semibold text-puce-red">
          {step === 0
            ? "Basics"
            : step === 1
              ? "Who can join"
              : step === 2
                ? "Genres & current book"
                : "You're ready"}
        </Text>

        {step === 0 ? (
          <>
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
          </>
        ) : null}

        {step === 1 ? (
          <>
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-ink">Visibility</Text>
              <View className="gap-2">
                {VISIBILITY_OPTIONS.map((option) => {
                  const active = visibility === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={option.label}
                      onPress={() => setVisibilityAndPolicy(option.id)}
                      className={`min-h-[44px] rounded-xl px-4 py-3 ${
                        active ? "bg-puce-red" : "bg-primary/15"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          active ? "text-white" : "text-puce-red"
                        }`}
                      >
                        {option.label}
                      </Text>
                      <Text
                        className={`mt-1 text-xs ${
                          active ? "text-white/85" : "text-ink-muted"
                        }`}
                      >
                        {option.hint}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="mb-2">
              <Text className="mb-2 text-sm font-medium text-ink">Join policy</Text>
              <View className="gap-2">
                {joinPolicyOptions.map((option) => {
                  const active = joinPolicy === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setJoinPolicy(option.id)}
                      className={`min-h-[44px] rounded-xl px-4 py-3 ${
                        active ? "bg-puce-red" : "bg-primary/15"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          active ? "text-white" : "text-puce-red"
                        }`}
                      >
                        {option.label}
                      </Text>
                      <Text
                        className={`mt-1 text-xs ${
                          active ? "text-white/85" : "text-ink-muted"
                        }`}
                      >
                        {option.hint}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-ink">Genres</Text>
              <View className="flex-row flex-wrap gap-2">
                {CLUB_GENRE_OPTIONS.map((genre: string) => {
                  const active = genres.includes(genre);
                  return (
                    <Pressable
                      key={genre}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={genre}
                      onPress={() => toggleGenre(genre)}
                      className={`min-h-[44px] justify-center rounded-full px-3 ${
                        active ? "bg-puce-red" : "bg-primary/15"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          active ? "text-white" : "text-puce-red"
                        }`}
                      >
                        {genre}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-1 text-sm font-medium text-ink">
                Current book (optional)
              </Text>
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
                      <Text className="mt-0.5 text-xs text-ink-muted" numberOfLines={1}>
                        {currentBook.author_name.join(", ")}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setCurrentBook(null)}
                    className="min-h-[44px] justify-center rounded-full bg-primary/15 px-3 active:opacity-80"
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
          </>
        ) : null}

        {step === 3 && createdClubId ? (
          <View className="gap-3">
            <Text className="text-ink">
              <Text className="font-semibold text-puce-red">{name.trim()}</Text> is live.
              Invite readers or jump into the club hub.
            </Text>
            <Button
              title="Invite members"
              variant="primary"
              onPress={() => setInviteOpen(true)}
            />
            {canShareClubToFeed(visibility) ? (
              <Button
                title="Share club to feed"
                variant="secondary"
                loading={shareToFeed.isPending}
                onPress={() => void handleShareToFeed()}
              />
            ) : null}
            <Button title="Open club" variant="ghost" onPress={finish} />
          </View>
        ) : null}

        {step < 3 ? (
          <View className="mt-2 flex-row gap-2">
            {step > 0 ? (
              <Button
                title="Back"
                variant="ghost"
                className="flex-1"
                onPress={() => setStep((current) => (current - 1) as Step)}
              />
            ) : null}
            {step < 2 ? (
              <Button
                title="Continue"
                variant="primary"
                className="flex-1"
                disabled={!canContinue()}
                onPress={() => setStep((current) => (current + 1) as Step)}
              />
            ) : (
              <Button
                title="Create club"
                variant="primary"
                className="flex-1"
                loading={submitting}
                disabled={!name.trim()}
                onPress={() => void handleCreate()}
              />
            )}
          </View>
        ) : null}
      </ScrollView>

      <BookPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={setCurrentBook}
        title="Set the current book"
      />

      {createdClubId && userId ? (
        <InviteMembersSheet
          visible={inviteOpen}
          clubId={createdClubId}
          currentUserId={userId}
          onClose={() => setInviteOpen(false)}
        />
      ) : null}

      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Book clubs"
        limitMessage={ENTITLEMENT_LIMIT_MESSAGES.joined_book_clubs}
      />
    </View>
  );
}
