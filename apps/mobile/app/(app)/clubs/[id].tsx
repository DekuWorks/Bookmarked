import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../../src/components/Avatar";
import { BookCover } from "../../../src/components/BookCover";
import { BookPicker } from "../../../src/components/BookPicker";
import { Button } from "../../../src/components/Button";
import { CircleAvatarPicker } from "../../../src/components/CircleAvatarPicker";
import { ClubDiscussionCard } from "../../../src/components/ClubDiscussionCard";
import { EmptyState } from "../../../src/components/EmptyState";
import { Input } from "../../../src/components/Input";
import { LoadingState } from "../../../src/components/LoadingState";
import {
  useClub,
  useClubDiscussions,
  useCreateDiscussion,
  useDeleteClub,
  useDeleteDiscussion,
  useJoinClub,
  useLeaveClub,
  useRemoveMember,
  useSetCurrentBook,
  useUpdateClub,
} from "../../../src/hooks/useClubs";
import { ensureCatalogBook } from "../../../src/services/bookClubs";
import {
  removeClubAvatar,
  uploadClubAvatar,
  type PickedImage,
} from "../../../src/services/storage";
import type { CatalogDoc } from "../../../src/services/isbndb";
import { useAuthStore } from "../../../src/store/authStore";
import type { BookClubMemberWithProfile, BookClubVisibility } from "../../../src/types";

function memberName(member: BookClubMemberWithProfile): string {
  return (
    member.profile.display_name?.trim() ||
    member.profile.username?.trim() ||
    "Reader"
  );
}

const VISIBILITY_OPTIONS: { id: BookClubVisibility; label: string }[] = [
  { id: "public", label: "Public" },
  { id: "private", label: "Private" },
];

export default function ClubDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const clubId = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: club, isLoading, isError, error } = useClub(clubId);
  const discussions = useClubDiscussions(clubId);
  const joinMutation = useJoinClub(clubId);
  const leaveMutation = useLeaveClub(clubId);
  const createMutation = useCreateDiscussion(clubId);
  const updateMutation = useUpdateClub(clubId);
  const setBookMutation = useSetCurrentBook(clubId);
  const removeMemberMutation = useRemoveMember(clubId);
  const deleteClubMutation = useDeleteClub(clubId);
  const deleteDiscussionMutation = useDeleteDiscussion(clubId);

  const [draft, setDraft] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState<BookClubVisibility>("public");
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (editOpen && club) {
      setEditName(club.name);
      setEditDescription(club.description ?? "");
      setEditVisibility(club.visibility);
    }
  }, [editOpen, club]);

  async function handleJoin() {
    const result = await joinMutation.mutateAsync();
    if (result.error) Alert.alert("Couldn't join", result.error);
  }

  async function handleLeave() {
    const result = await leaveMutation.mutateAsync();
    if (result.error) Alert.alert("Couldn't leave", result.error);
  }

  async function handlePost() {
    const result = await createMutation.mutateAsync(draft);
    if (result.error) {
      Alert.alert("Couldn't post", result.error);
      return;
    }
    setDraft("");
  }

  async function handleSaveEdit() {
    if (!editName.trim()) {
      Alert.alert("Name required", "Give your club a name.");
      return;
    }
    const result = await updateMutation.mutateAsync({
      name: editName,
      description: editDescription,
      visibility: editVisibility,
    });
    if (result.error) {
      Alert.alert("Couldn't update club", result.error);
      return;
    }
    setEditOpen(false);
  }

  async function handleAvatarPicked(image: PickedImage) {
    setAvatarUploading(true);
    const result = await uploadClubAvatar(clubId, image);
    setAvatarUploading(false);
    if (result.error) {
      Alert.alert("Couldn't upload photo", result.error);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["club", clubId] });
    await queryClient.invalidateQueries({ queryKey: ["clubs"] });
  }

  async function handleAvatarRemove() {
    setAvatarUploading(true);
    const result = await removeClubAvatar(clubId);
    setAvatarUploading(false);
    if (result.error) {
      Alert.alert("Couldn't remove photo", result.error);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["club", clubId] });
    await queryClient.invalidateQueries({ queryKey: ["clubs"] });
  }

  async function handlePickBook(doc: CatalogDoc) {
    const resolved = await ensureCatalogBook(doc);
    if (resolved.error || !resolved.bookId) {
      Alert.alert("Couldn't add book", resolved.error ?? "Please try again.");
      return;
    }
    const result = await setBookMutation.mutateAsync(resolved.bookId);
    if (result.error) Alert.alert("Couldn't set book", result.error);
  }

  async function handleClearBook() {
    const result = await setBookMutation.mutateAsync(null);
    if (result.error) Alert.alert("Couldn't clear book", result.error);
  }

  function confirmRemoveMember(member: BookClubMemberWithProfile) {
    Alert.alert(
      "Remove member",
      `Remove ${memberName(member)} from this club?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemovingUserId(member.user_id);
            const result = await removeMemberMutation.mutateAsync(member.user_id);
            setRemovingUserId(null);
            if (result.error) Alert.alert("Couldn't remove member", result.error);
          },
        },
      ]
    );
  }

  function confirmDeleteClub() {
    Alert.alert("Delete club", "Delete this club? This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const result = await deleteClubMutation.mutateAsync();
          if (result.error) {
            Alert.alert("Couldn't delete club", result.error);
            return;
          }
          router.replace("/(app)/clubs");
        },
      },
    ]);
  }

  function confirmDeletePost(postId: string) {
    Alert.alert("Delete discussion", "Delete this discussion post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingPostId(postId);
          const result = await deleteDiscussionMutation.mutateAsync(postId);
          setDeletingPostId(null);
          if (result.error) Alert.alert("Couldn't delete", result.error);
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Club" }} />
        <LoadingState message="Loading club…" />
      </>
    );
  }

  if (isError || !club) {
    return (
      <>
        <Stack.Screen options={{ title: "Club" }} />
        <EmptyState
          title="Club not found"
          description={
            error instanceof Error
              ? error.message
              : "This club may be private or no longer exists."
          }
        />
      </>
    );
  }

  const isOwner = club.viewer_role === "owner";
  const isMember = club.viewer_is_member;
  const memberLabel = `${club.member_count} member${club.member_count === 1 ? "" : "s"}`;
  const actionPending = joinMutation.isPending || leaveMutation.isPending;

  const header = (
    <View className="gap-5 pb-4">
      <Stack.Screen options={{ title: club.name }} />

      <View className="rounded-2xl border border-brand-border bg-surface p-4">
        <View className="flex-row items-start gap-4">
          <Avatar url={club.image_url} name={club.name} size={72} />
          <View className="flex-1">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl font-bold text-puce-red flex-1">{club.name}</Text>
                  {club.visibility === "private" ? (
                    <Text className="text-[10px] font-semibold uppercase text-ink-muted">
                      Private
                    </Text>
                  ) : null}
                </View>
                <Text className="text-sm text-ink-muted mt-1">{memberLabel}</Text>
              </View>
            </View>

            {club.description ? (
              <Text className="text-ink mt-3 leading-6">{club.description}</Text>
            ) : null}
          </View>
        </View>

        <View className="mt-4">
          {isOwner ? (
            <View className="flex-row gap-2">
              <Button
                title="Edit club"
                variant="ghost"
                onPress={() => setEditOpen(true)}
                className="flex-1"
              />
              <Button
                title="Delete"
                variant="ghost"
                loading={deleteClubMutation.isPending}
                onPress={confirmDeleteClub}
                className="flex-1"
              />
            </View>
          ) : isMember ? (
            <Button
              title="Leave club"
              variant="ghost"
              loading={actionPending}
              onPress={handleLeave}
            />
          ) : (
            <Button
              title="Join club"
              variant="primary"
              loading={actionPending}
              onPress={handleJoin}
            />
          )}
        </View>
      </View>

      <View className="rounded-2xl border border-brand-border bg-surface p-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-puce-red">Current book</Text>
          {isOwner ? (
            <Pressable
              accessibilityRole="button"
              disabled={setBookMutation.isPending}
              onPress={() => setPickerOpen(true)}
              className="rounded-full bg-primary/15 px-3 py-1.5 active:opacity-80"
            >
              <Text className="text-xs font-semibold text-puce-red">
                {club.current_book ? "Change" : "Set book"}
              </Text>
            </Pressable>
          ) : null}
        </View>
        {club.current_book ? (
          <View className="flex-row items-center gap-4">
            <BookCover
              url={club.current_book.cover_url}
              title={club.current_book.title}
              sizeClassName="w-16 h-24"
            />
            <View className="flex-1">
              <Text className="font-semibold text-ink">{club.current_book.title}</Text>
              {club.current_book.author ? (
                <Text className="text-sm text-ink-muted mt-0.5">
                  {club.current_book.author}
                </Text>
              ) : null}
              {isOwner ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={setBookMutation.isPending}
                  onPress={handleClearBook}
                  className="mt-2 active:opacity-70"
                >
                  <Text className="text-xs text-ink-muted">Clear current book</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : (
          <Text className="text-sm text-ink-muted">
            {isOwner
              ? "No current book yet. Set one to give the club something to read together."
              : "This club hasn't picked a current book yet."}
          </Text>
        )}
      </View>

      <View className="rounded-2xl border border-brand-border bg-surface p-4">
        <Text className="text-lg font-semibold text-puce-red mb-3">
          Members ({club.members.length})
        </Text>
        <View className="gap-3">
          {club.members.map((member) => {
            const canRemove =
              isOwner && member.role !== "owner" && member.user_id !== userId;
            return (
              <View key={member.id} className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => {
                    const username = member.profile.username?.trim();
                    if (username) router.push(`/reader/${username}`);
                  }}
                  disabled={!member.profile.username?.trim()}
                  className="flex-row items-center gap-3 flex-1 active:opacity-80"
                  accessibilityRole={member.profile.username ? "link" : undefined}
                >
                  <Avatar
                    url={member.profile.avatar_url}
                    name={memberName(member)}
                    size={32}
                  />
                  <Text className="text-ink flex-1" numberOfLines={1}>
                    {memberName(member)}
                  </Text>
                </Pressable>
                {member.role === "owner" ? (
                  <Text className="text-[11px] font-semibold text-puce-red">Owner</Text>
                ) : null}
                {canRemove ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={removingUserId === member.user_id}
                    onPress={() => confirmRemoveMember(member)}
                    className="rounded-full bg-primary/15 px-3 py-1.5 active:opacity-80"
                  >
                    <Text className="text-xs font-semibold text-puce-red">
                      {removingUserId === member.user_id ? "Removing…" : "Remove"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      <View>
        <Text className="text-lg font-semibold text-puce-red mb-3">Discussions</Text>
        {isMember ? (
          <View className="rounded-2xl border border-brand-border bg-surface p-3 mb-3">
            <TextInput
              placeholder="Start a discussion…"
              placeholderTextColor="#A99DAE"
              multiline
              value={draft}
              onChangeText={setDraft}
              className="text-base text-ink min-h-[44px] px-1 py-1"
            />
            <View className="items-end mt-2">
              <Button
                title="Post"
                variant="primary"
                loading={createMutation.isPending}
                disabled={!draft.trim()}
                onPress={handlePost}
                className="px-6"
              />
            </View>
          </View>
        ) : (
          <View className="rounded-2xl border border-dashed border-brand-border bg-surface px-4 py-6 mb-3">
            <Text className="text-sm text-ink-muted text-center">
              Join this club to start and reply to discussions.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <>
      <FlatList
        className="flex-1 bg-background"
        data={discussions.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ClubDiscussionCard
            post={item}
            canDelete={item.user_id === userId}
            deleting={deletingPostId === item.id}
            onDelete={() => confirmDeletePost(item.id)}
          />
        )}
        ListEmptyComponent={
          discussions.isLoading ? (
            <LoadingState message="Loading discussions…" />
          ) : (
            <View className="rounded-2xl border border-dashed border-brand-border bg-surface px-4 py-8">
              <Text className="font-medium text-puce-red text-center">No discussions yet</Text>
              <Text className="text-sm text-ink-muted text-center mt-1">
                {isMember
                  ? "Be the first to start a discussion above."
                  : "This club hasn't started any discussions yet."}
              </Text>
            </View>
          )
        }
      />

      <BookPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickBook}
        title="Set the current book"
      />

      <Modal
        visible={editOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setEditOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="rounded-t-3xl bg-background px-5 pt-5"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-puce-red">Edit club</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditOpen(false)}
                className="rounded-full bg-primary/15 px-4 py-2 active:opacity-80"
              >
                <Text className="text-sm font-semibold text-puce-red">Cancel</Text>
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <CircleAvatarPicker
                imageUrl={club.image_url}
                fallbackLabel={editName || club.name}
                disabled={avatarUploading || updateMutation.isPending}
                onImagePicked={(image) => void handleAvatarPicked(image)}
                onRemove={() => void handleAvatarRemove()}
              />

              <Input
                label="Club name"
                value={editName}
                onChangeText={setEditName}
                placeholder="Club name"
              />
              <Input
                label="Description"
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="What's this club about?"
                multiline
                className="min-h-[90px]"
                style={{ textAlignVertical: "top" }}
              />

              <View className="mb-4">
                <Text className="text-sm font-medium text-ink mb-1">Who can join?</Text>
                <View className="flex-row gap-2">
                  {VISIBILITY_OPTIONS.map((option) => {
                    const isActive = editVisibility === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="button"
                        onPress={() => setEditVisibility(option.id)}
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
              </View>

              <Button
                title="Save changes"
                variant="primary"
                loading={updateMutation.isPending}
                disabled={!editName.trim()}
                onPress={handleSaveEdit}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
