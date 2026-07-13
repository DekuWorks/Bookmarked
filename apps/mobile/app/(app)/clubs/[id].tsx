import { useState } from "react";
import { Alert, FlatList, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Avatar } from "../../../src/components/Avatar";
import { BookCover } from "../../../src/components/BookCover";
import { Button } from "../../../src/components/Button";
import { ClubDiscussionCard } from "../../../src/components/ClubDiscussionCard";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import {
  useClub,
  useClubDiscussions,
  useCreateDiscussion,
  useJoinClub,
  useLeaveClub,
} from "../../../src/hooks/useClubs";
import type { BookClubMemberWithProfile } from "../../../src/types";

function memberName(member: BookClubMemberWithProfile): string {
  return (
    member.profile.display_name?.trim() ||
    member.profile.username?.trim() ||
    "Reader"
  );
}

export default function ClubDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const clubId = typeof params.id === "string" ? params.id : "";

  const { data: club, isLoading, isError, error } = useClub(clubId);
  const discussions = useClubDiscussions(clubId);
  const joinMutation = useJoinClub(clubId);
  const leaveMutation = useLeaveClub(clubId);
  const createMutation = useCreateDiscussion(clubId);

  const [draft, setDraft] = useState("");

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

        <View className="mt-4">
          {isOwner ? (
            <Text className="text-xs text-ink-muted">
              You own this club. Manage it on the web app.
            </Text>
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
        <Text className="text-lg font-semibold text-puce-red mb-3">Current book</Text>
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
            </View>
          </View>
        ) : (
          <Text className="text-sm text-ink-muted">
            This club hasn't picked a current book yet.
          </Text>
        )}
      </View>

      <View className="rounded-2xl border border-brand-border bg-surface p-4">
        <Text className="text-lg font-semibold text-puce-red mb-3">
          Members ({club.members.length})
        </Text>
        <View className="gap-3">
          {club.members.map((member) => (
            <View key={member.id} className="flex-row items-center gap-3">
              <Avatar
                url={member.profile.avatar_url}
                name={memberName(member)}
                size={32}
              />
              <Text className="text-ink flex-1" numberOfLines={1}>
                {memberName(member)}
              </Text>
              {member.role === "owner" ? (
                <Text className="text-[11px] font-semibold text-puce-red">Owner</Text>
              ) : null}
            </View>
          ))}
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
    <FlatList
      className="flex-1 bg-background"
      data={discussions.data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      renderItem={({ item }) => <ClubDiscussionCard post={item} />}
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
  );
}
