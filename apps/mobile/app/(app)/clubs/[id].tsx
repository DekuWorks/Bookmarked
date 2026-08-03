import { useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
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
import { ClubDiscussionThreadSheet } from "../../../src/components/ClubDiscussionThreadSheet";
import { ClubEventsSection } from "../../../src/components/ClubEventsSection";
import { EmptyState } from "../../../src/components/EmptyState";
import { FeatureLimitModal } from "../../../src/components/FeatureLimitModal";
import { Input } from "../../../src/components/Input";
import { InviteMembersSheet } from "../../../src/components/InviteMembersSheet";
import { LoadingState } from "../../../src/components/LoadingState";
import { isEntitlementLimitError } from "../../../src/utils/subscription";
import {
  useAddClubBook,
  useApproveJoinRequest,
  useBanMember,
  useClub,
  useClubAnnouncements,
  useClubBooks,
  useClubDiscussions,
  useClubJoinRequests,
  useClubStats,
  useCreateAnnouncement,
  useCreateDiscussion,
  useDeclineJoinRequest,
  useDeleteAnnouncement,
  useDeleteClub,
  useDeleteDiscussion,
  useEnsureClubGroupConversation,
  useJoinClub,
  useLeaveClub,
  useRemoveClubBook,
  useRemoveMember,
  useRequestToJoin,
  useSetClubBookCategory,
  useSetCurrentRead,
  useShareClubToFeed,
  useTransferOwnership,
  useUpdateClub,
  useUpdateMemberRole,
} from "../../../src/hooks/useClubs";
import { ensureCatalogBook } from "../../../src/services/bookClubs";
import { TAB_BAR_SPACE } from "../../../src/navigation/TabBarScroll";
import {
  removeClubAvatar,
  uploadClubAvatar,
  type PickedImage,
} from "../../../src/services/storage";
import type { CatalogDoc } from "../../../src/services/isbndb";
import { useAuthStore } from "../../../src/store/authStore";
import type {
  BookClubBookCategory,
  BookClubDiscussionWithAuthor,
  BookClubJoinPolicy,
  BookClubMemberRole,
  BookClubMemberWithProfile,
  BookClubShelfBook,
  BookClubVisibility,
} from "../../../src/types";
import {
  canCreateAnnouncements,
  canEditClub,
  canManageBookshelf,
  canManageMembers,
  canSelfJoin,
  canShareClubToFeed,
  canViewDetailedStats,
  isInviteOnlyClub,
  requiresJoinRequest,
  roleLabel,
  visibilityLabel,
} from "../../../../../packages/utils/clubPermissions";

type HubTab =
  | "overview"
  | "discussions"
  | "schedule"
  | "bookshelf"
  | "members"
  | "stats";

const TABS: { id: HubTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "discussions", label: "Discuss" },
  { id: "schedule", label: "Schedule" },
  { id: "bookshelf", label: "Bookshelf" },
  { id: "members", label: "Members" },
  { id: "stats", label: "Stats" },
];

const VISIBILITY_OPTIONS: { id: BookClubVisibility; label: string }[] = [
  { id: "public", label: "Public" },
  { id: "private", label: "Private" },
  { id: "invite_only", label: "Invite only" },
];

const JOIN_POLICY_OPTIONS: { id: BookClubJoinPolicy; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "request_approval", label: "Request" },
  { id: "invitation_only", label: "Invite only" },
];

const BOOK_CATEGORIES: { id: BookClubBookCategory; label: string }[] = [
  { id: "current_read", label: "Current" },
  { id: "upcoming", label: "Upcoming" },
  { id: "previous", label: "Previous" },
  { id: "suggested", label: "Suggested" },
  { id: "optional", label: "Optional" },
];

const ROLE_FILTERS: Array<{ id: "all" | BookClubMemberRole; label: string }> = [
  { id: "all", label: "All" },
  { id: "owner", label: "Owner" },
  { id: "host", label: "Hosts" },
  { id: "moderator", label: "Mods" },
  { id: "member", label: "Members" },
];

function memberName(member: BookClubMemberWithProfile): string {
  return (
    member.profile.display_name?.trim() ||
    member.profile.username?.trim() ||
    "Reader"
  );
}

export default function ClubDetailRoute() {
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const clubId = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: club, isLoading, isError, error } = useClub(clubId);
  const discussions = useClubDiscussions(clubId);
  const announcements = useClubAnnouncements(clubId);
  const shelfBooks = useClubBooks(clubId);
  const stats = useClubStats(clubId);
  const joinRequests = useClubJoinRequests(clubId);

  const joinMutation = useJoinClub(clubId);
  const requestJoinMutation = useRequestToJoin(clubId);
  const leaveMutation = useLeaveClub(clubId);
  const createDiscussion = useCreateDiscussion(clubId);
  const updateMutation = useUpdateClub(clubId);
  const setCurrentRead = useSetCurrentRead(clubId);
  const removeMemberMutation = useRemoveMember(clubId);
  const banMemberMutation = useBanMember(clubId);
  const updateRoleMutation = useUpdateMemberRole(clubId);
  const transferMutation = useTransferOwnership(clubId);
  const deleteClubMutation = useDeleteClub(clubId);
  const deleteDiscussionMutation = useDeleteDiscussion(clubId);
  const ensureConversation = useEnsureClubGroupConversation(clubId);
  const shareClub = useShareClubToFeed(clubId);
  const createAnnouncement = useCreateAnnouncement(clubId);
  const deleteAnnouncement = useDeleteAnnouncement(clubId);
  const addClubBook = useAddClubBook(clubId);
  const removeClubBook = useRemoveClubBook(clubId);
  const setBookCategory = useSetClubBookCategory(clubId);
  const approveRequest = useApproveJoinRequest(clubId);
  const declineRequest = useDeclineJoinRequest(clubId);

  const initialTab = TABS.some((tab) => tab.id === params.tab)
    ? (params.tab as HubTab)
    : "overview";
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);
  const [discussionTitle, setDiscussionTitle] = useState("");
  const [discussionBody, setDiscussionBody] = useState("");
  const [discussionSpoilers, setDiscussionSpoilers] = useState(false);
  const [threadDiscussion, setThreadDiscussion] =
    useState<BookClubDiscussionWithAuthor | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"current" | "shelf">("current");
  const [shelfCategory, setShelfCategory] =
    useState<BookClubBookCategory>("upcoming");
  const [roleFilter, setRoleFilter] = useState<"all" | BookClubMemberRole>("all");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState<BookClubVisibility>("public");
  const [editJoinPolicy, setEditJoinPolicy] = useState<BookClubJoinPolicy>("open");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);

  useEffect(() => {
    if (editOpen && club) {
      setEditName(club.name);
      setEditDescription(club.description ?? "");
      setEditVisibility(club.visibility);
      setEditJoinPolicy(club.join_policy);
    }
  }, [editOpen, club]);

  const isMember = Boolean(club?.viewer_is_member);
  const viewerRole = club?.viewer_role ?? null;
  const canEdit = canEditClub(viewerRole);
  const manageMembers = canManageMembers(viewerRole);
  const manageBooks = canManageBookshelf(viewerRole);
  const canAnnounce = canCreateAnnouncements(viewerRole);
  const showDetailedStats = canViewDetailedStats(viewerRole);

  const pendingRequests = useMemo(
    () => (joinRequests.data ?? []).filter((row) => row.status === "pending"),
    [joinRequests.data]
  );

  const filteredMembers = useMemo(() => {
    const members = club?.members ?? [];
    if (roleFilter === "all") return members;
    return members.filter((member) => member.role === roleFilter);
  }, [club?.members, roleFilter]);

  const booksByCategory = useMemo(() => {
    const map = new Map<BookClubBookCategory, BookClubShelfBook[]>();
    for (const category of BOOK_CATEGORIES) map.set(category.id, []);
    for (const book of shelfBooks.data ?? []) {
      const list = map.get(book.category) ?? [];
      list.push(book);
      map.set(book.category, list);
    }
    return map;
  }, [shelfBooks.data]);

  async function handleMembershipAction() {
    if (!club) return;

    if (isMember) {
      Alert.alert("Leave club?", "You can rejoin later if the club allows it.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            const result = await leaveMutation.mutateAsync();
            if (result.error) Alert.alert("Couldn't leave", result.error);
          },
        },
      ]);
      return;
    }

    if (
      isInviteOnlyClub({
        visibility: club.visibility,
        joinPolicy: club.join_policy,
      })
    ) {
      Alert.alert(
        "Invite only",
        "This club is invite only. Ask a host for an invitation."
      );
      return;
    }

    if (
      requiresJoinRequest({ joinPolicy: club.join_policy }) ||
      !canSelfJoin({
        visibility: club.visibility,
        joinPolicy: club.join_policy,
      })
    ) {
      const result = await requestJoinMutation.mutateAsync(null);
      if (result.error) {
        if (isEntitlementLimitError(result.error)) {
          setLimitOpen(true);
          return;
        }
        Alert.alert("Couldn't request", result.error);
        return;
      }
      Alert.alert("Request sent", "Hosts will review your request.");
      return;
    }

    const result = await joinMutation.mutateAsync();
    if (result.error) {
      if (isEntitlementLimitError(result.error)) {
        setLimitOpen(true);
        return;
      }
      Alert.alert("Couldn't join", result.error);
    }
  }

  async function handleCreateDiscussion() {
    if (!discussionTitle.trim() || !discussionBody.trim()) {
      Alert.alert("Missing fields", "Add a title and body for the discussion.");
      return;
    }
    const result = await createDiscussion.mutateAsync({
      title: discussionTitle.trim(),
      body: discussionBody.trim(),
      containsSpoilers: discussionSpoilers,
    });
    if (result.error) {
      Alert.alert("Couldn't post", result.error);
      return;
    }
    setDiscussionTitle("");
    setDiscussionBody("");
    setDiscussionSpoilers(false);
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
      joinPolicy: editJoinPolicy,
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

    if (pickerMode === "current") {
      const result = await setCurrentRead.mutateAsync({ bookId: resolved.bookId });
      if (result.error) Alert.alert("Couldn't set book", result.error);
      return;
    }

    const result = await addClubBook.mutateAsync({
      bookId: resolved.bookId,
      category: shelfCategory,
    });
    if (result.error) Alert.alert("Couldn't add book", result.error);
  }

  async function handleMessageClub() {
    const result = await ensureConversation.mutateAsync();
    if (result.error || !result.conversationId) {
      Alert.alert("Couldn't open chat", result.error ?? "Please try again.");
      return;
    }
    router.push(`/(app)/messages/${result.conversationId}`);
  }

  async function handleShare() {
    if (!club) return;
    const options = canShareClubToFeed(club.visibility)
      ? ["Share club to feed", "Share link", "Cancel"]
      : ["Share link", "Cancel"];
    const cancelButtonIndex = options.length - 1;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        userInterfaceStyle: "light",
      },
      async (index) => {
        if (index === cancelButtonIndex) return;
        const label = options[index];
        if (label === "Share club to feed") {
          const result = await shareClub.mutateAsync();
          if (result.error) Alert.alert("Couldn't share", result.error);
          else Alert.alert("Shared", "Your club was shared to the feed.");
          return;
        }
        if (label === "Share link") {
          try {
            await Share.share({
              message: `Join ${club.name} on Bookmarked: https://bookmarked.online/clubs/club/?id=${club.id}`,
            });
          } catch {
            // user dismissed
          }
        }
      }
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
    Alert.alert("Delete discussion", "Delete this discussion?", [
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

  function openMemberActions(member: BookClubMemberWithProfile) {
    if (!manageMembers || !userId || member.user_id === userId) return;
    if (member.role === "owner") return;

    const options = [
      "Promote to host",
      "Promote to moderator",
      "Set as member",
      "Remove",
      "Ban",
      ...(canEdit ? ["Transfer ownership"] : []),
      "Cancel",
    ];
    const cancelButtonIndex = options.length - 1;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex: [
          options.indexOf("Remove"),
          options.indexOf("Ban"),
        ].filter((i) => i >= 0),
      },
      (index) => {
        if (index === cancelButtonIndex) return;
        const label = options[index];
        if (label === "Promote to host") {
          void updateRoleMutation
            .mutateAsync({ memberUserId: member.user_id, role: "host" })
            .then((result) => {
              if (result.error) Alert.alert("Couldn't update role", result.error);
            });
        } else if (label === "Promote to moderator") {
          void updateRoleMutation
            .mutateAsync({ memberUserId: member.user_id, role: "moderator" })
            .then((result) => {
              if (result.error) Alert.alert("Couldn't update role", result.error);
            });
        } else if (label === "Set as member") {
          void updateRoleMutation
            .mutateAsync({ memberUserId: member.user_id, role: "member" })
            .then((result) => {
              if (result.error) Alert.alert("Couldn't update role", result.error);
            });
        } else if (label === "Remove") {
          Alert.alert(
            "Remove member",
            `Remove ${memberName(member)} from this club?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: () =>
                  void removeMemberMutation
                    .mutateAsync(member.user_id)
                    .then((result) => {
                      if (result.error)
                        Alert.alert("Couldn't remove member", result.error);
                    }),
              },
            ]
          );
        } else if (label === "Ban") {
          Alert.alert("Ban member", `Ban ${memberName(member)}?`, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Ban",
              style: "destructive",
              onPress: () =>
                void banMemberMutation.mutateAsync(member.user_id).then((result) => {
                  if (result.error) Alert.alert("Couldn't ban member", result.error);
                }),
            },
          ]);
        } else if (label === "Transfer ownership") {
          Alert.alert(
            "Transfer ownership",
            `Make ${memberName(member)} the owner? You will become a host.`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Transfer",
                style: "destructive",
                onPress: () =>
                  void transferMutation
                    .mutateAsync(member.user_id)
                    .then((result) => {
                      if (result.error)
                        Alert.alert("Couldn't transfer", result.error);
                    }),
              },
            ]
          );
        }
      }
    );
  }

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Club" }} />
        <LoadingState message="Loading club�" />
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

  const memberLabel = `${club.member_count} member${club.member_count === 1 ? "" : "s"}`;
  const actionPending =
    joinMutation.isPending ||
    leaveMutation.isPending ||
    requestJoinMutation.isPending;
  const membershipLabel = isMember
    ? "Leave"
    : isInviteOnlyClub({
          visibility: club.visibility,
          joinPolicy: club.join_policy,
        })
      ? "Invite only"
      : requiresJoinRequest({ joinPolicy: club.join_policy }) ||
          !canSelfJoin({
            visibility: club.visibility,
            joinPolicy: club.join_policy,
          })
        ? "Request to join"
        : "Join club";

  const header = (
    <View className="gap-4 pb-4">
      <Stack.Screen options={{ title: club.name }} />
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Book clubs"
        limitMessage="Free members can join 3 book clubs. Upgrade to Bookmarked Plus for unlimited clubs."
      />

      <View className="overflow-hidden rounded-2xl border border-brand-border bg-surface">
        {club.banner_url ? (
          <Image
            source={{ uri: club.banner_url }}
            className="h-28 w-full"
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className="h-20 w-full bg-primary/20" />
        )}
        <View className="-mt-8 px-4 pb-4">
          <Avatar url={club.image_url} name={club.name} size={72} />
          <View className="mt-3 flex-row items-start gap-2">
            <Text className="flex-1 text-2xl font-bold text-puce-red">{club.name}</Text>
            <Text className="mt-1 text-[10px] font-semibold uppercase text-ink-muted">
              {visibilityLabel(club.visibility)}
            </Text>
          </View>
          <Text className="mt-1 text-sm text-ink-muted">
            {memberLabel}
            {viewerRole ? ` � ${roleLabel(viewerRole)}` : ""}
          </Text>
          {club.description ? (
            <Text className="mt-3 leading-6 text-ink">{club.description}</Text>
          ) : null}
          {club.genre_tags?.length ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {club.genre_tags.map((tag) => (
                <Text
                  key={tag}
                  className="rounded-full bg-primary/15 px-2 py-1 text-[11px] font-semibold text-puce-red"
                >
                  {tag}
                </Text>
              ))}
            </View>
          ) : null}

          <View className="mt-4 flex-row flex-wrap gap-2">
            {viewerRole !== "owner" ? (
              <Button
                title={membershipLabel}
                variant={isMember ? "ghost" : "primary"}
                loading={actionPending}
                disabled={membershipLabel === "Invite only"}
                onPress={() => void handleMembershipAction()}
                className="min-w-[120px] flex-1"
              />
            ) : null}
            {isMember ? (
              <Button
                title="Message"
                variant="secondary"
                loading={ensureConversation.isPending}
                onPress={() => void handleMessageClub()}
                className="min-w-[110px] flex-1"
              />
            ) : null}
            {manageMembers ? (
              <Button
                title="Invite"
                variant="ghost"
                onPress={() => setInviteOpen(true)}
                className="min-w-[90px] flex-1"
              />
            ) : null}
            {canEdit ? (
              <Button
                title="Settings"
                variant="ghost"
                onPress={() => setEditOpen(true)}
                className="min-w-[90px] flex-1"
              />
            ) : null}
            <Button
              title="Share"
              variant="ghost"
              onPress={() => void handleShare()}
              className="min-w-[90px] flex-1"
            />
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 px-1" accessibilityRole="tablist">
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={tab.label}
                onPress={() => setActiveTab(tab.id)}
                className={`min-h-[44px] justify-center rounded-full px-3 ${
                  selected ? "bg-puce-red" : "bg-primary/15"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selected ? "text-white" : "text-puce-red"
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {activeTab === "overview" ? (
        <View className="gap-4">
          <View className="rounded-2xl border border-brand-border bg-surface p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-puce-red">Current read</Text>
              {manageBooks ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setPickerMode("current");
                    setPickerOpen(true);
                  }}
                  className="min-h-[44px] justify-center rounded-full bg-primary/15 px-3"
                >
                  <Text className="text-xs font-semibold text-puce-red">
                    {club.current_book ? "Change" : "Set book"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {club.current_book ? (
              <Pressable
                onPress={() => router.push(`/book/${club.current_book!.id}`)}
                className="flex-row items-center gap-4 active:opacity-80"
              >
                <BookCover
                  url={club.current_book.cover_url}
                  title={club.current_book.title}
                  sizeClassName="w-16 h-24"
                />
                <View className="flex-1">
                  <Text className="font-semibold text-ink">{club.current_book.title}</Text>
                  {club.current_book.author ? (
                    <Text className="mt-0.5 text-sm text-ink-muted">
                      {club.current_book.author}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ) : (
              <Text className="text-sm text-ink-muted">
                No current book yet.
              </Text>
            )}
          </View>

          <View className="rounded-2xl border border-brand-border bg-surface p-4">
            <Text className="mb-3 text-lg font-semibold text-puce-red">
              Announcements
            </Text>
            {canAnnounce ? (
              <View className="mb-3 gap-2">
                <Input
                  label="Title"
                  value={announcementTitle}
                  onChangeText={setAnnouncementTitle}
                  placeholder="Club update"
                />
                <Input
                  label="Body"
                  value={announcementBody}
                  onChangeText={setAnnouncementBody}
                  placeholder="Share news with members"
                  multiline
                  className="min-h-[70px]"
                  style={{ textAlignVertical: "top" }}
                />
                <Button
                  title="Post announcement"
                  variant="primary"
                  loading={createAnnouncement.isPending}
                  disabled={!announcementTitle.trim() || !announcementBody.trim()}
                  onPress={() =>
                    void createAnnouncement
                      .mutateAsync({
                        title: announcementTitle.trim(),
                        body: announcementBody.trim(),
                      })
                      .then((result) => {
                        if (result.error) {
                          Alert.alert("Couldn't post", result.error);
                          return;
                        }
                        setAnnouncementTitle("");
                        setAnnouncementBody("");
                      })
                  }
                />
              </View>
            ) : null}
            {(announcements.data ?? []).slice(0, 3).map((item) => (
              <View
                key={item.id}
                className="mb-2 rounded-xl border border-brand-border bg-background p-3"
              >
                <View className="flex-row items-start justify-between gap-2">
                  <Text className="flex-1 font-semibold text-ink">{item.title}</Text>
                  {canAnnounce ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        void deleteAnnouncement.mutateAsync(item.id).then((result) => {
                          if (result.error)
                            Alert.alert("Couldn't delete", result.error);
                        })
                      }
                      className="min-h-[44px] justify-center"
                    >
                      <Text className="text-xs text-ink-muted">Delete</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Text className="mt-1 text-sm text-ink">{item.body}</Text>
              </View>
            ))}
            {!announcements.data?.length ? (
              <Text className="text-sm text-ink-muted">No announcements yet.</Text>
            ) : null}
          </View>

          <View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-puce-red">
                Latest discussions
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveTab("discussions")}
                className="min-h-[44px] justify-center"
              >
                <Text className="text-xs font-semibold text-primary">See all</Text>
              </Pressable>
            </View>
            {(discussions.data ?? []).slice(0, 3).map((post) => (
              <ClubDiscussionCard
                key={post.id}
                post={post}
                onPress={() => setThreadDiscussion(post)}
              />
            ))}
            {!discussions.data?.length ? (
              <Text className="text-sm text-ink-muted">No discussions yet.</Text>
            ) : null}
          </View>

          <ClubEventsSection
            clubId={club.id}
            isMember={isMember}
            viewerId={userId ?? ""}
            viewerRole={viewerRole}
            previewLimit={2}
          />

          <View className="rounded-2xl border border-brand-border bg-surface p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-puce-red">Bookshelf</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveTab("bookshelf")}
                className="min-h-[44px] justify-center"
              >
                <Text className="text-xs font-semibold text-primary">See all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {(shelfBooks.data ?? []).slice(0, 8).map((item) =>
                  item.book ? (
                    <Pressable
                      key={item.id}
                      onPress={() => router.push(`/book/${item.book!.id}`)}
                      className="w-20 active:opacity-80"
                    >
                      <BookCover
                        url={item.book.cover_url}
                        title={item.book.title}
                        sizeClassName="h-28 w-20"
                      />
                    </Pressable>
                  ) : null
                )}
              </View>
            </ScrollView>
            {!shelfBooks.data?.length ? (
              <Text className="text-sm text-ink-muted">Bookshelf is empty.</Text>
            ) : null}
          </View>

          <View className="rounded-2xl border border-brand-border bg-surface p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-puce-red">Members</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveTab("members")}
                className="min-h-[44px] justify-center"
              >
                <Text className="text-xs font-semibold text-primary">See all</Text>
              </Pressable>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {club.members.slice(0, 8).map((member) => (
                <Pressable
                  key={member.id}
                  onPress={() => {
                    const username = member.profile.username?.trim();
                    if (username) router.push(`/reader/${username}`);
                  }}
                  className="w-16 items-center active:opacity-80"
                >
                  <Avatar
                    url={member.profile.avatar_url}
                    name={memberName(member)}
                    size={40}
                  />
                  <Text className="mt-1 text-[11px] text-ink" numberOfLines={1}>
                    {memberName(member)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {activeTab === "discussions" ? (
        <View>
          <Text className="mb-3 text-left text-lg font-semibold text-puce-red">
            Discussions
          </Text>
          {isMember ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              className="mb-3 rounded-2xl border border-brand-border bg-surface p-3"
            >
              <Input
                label="Title"
                value={discussionTitle}
                onChangeText={setDiscussionTitle}
                placeholder="What should we talk about?"
              />
              <TextInput
                placeholder="Start the conversation…"
                placeholderTextColor="#A99DAE"
                multiline
                value={discussionBody}
                onChangeText={setDiscussionBody}
                accessibilityLabel="Discussion body"
                className="min-h-[72px] px-1 py-1 text-left text-base text-ink"
                style={{ textAlignVertical: "top", textAlign: "left" }}
              />
              <View className="mt-2 flex-row items-center justify-between">
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: discussionSpoilers }}
                  onPress={() => setDiscussionSpoilers((value) => !value)}
                  className="min-h-[44px] flex-row items-center gap-2"
                >
                  <View
                    className={`h-5 w-5 rounded border ${
                      discussionSpoilers
                        ? "border-puce-red bg-puce-red"
                        : "border-brand-border"
                    }`}
                  />
                  <Text className="text-sm text-ink">Spoilers</Text>
                </Pressable>
                <Button
                  title="Post"
                  variant="primary"
                  loading={createDiscussion.isPending}
                  disabled={!discussionTitle.trim() || !discussionBody.trim()}
                  onPress={() => void handleCreateDiscussion()}
                  className="min-w-[100px]"
                />
              </View>
            </KeyboardAvoidingView>
          ) : (
            <View className="mb-3 rounded-2xl border border-dashed border-brand-border bg-surface px-4 py-6">
              <Text className="text-center text-sm text-ink-muted">
                Join this club to start and reply to discussions.
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {activeTab === "schedule" ? (
        <ClubEventsSection
          clubId={club.id}
          isMember={isMember}
          viewerId={userId ?? ""}
          viewerRole={viewerRole}
        />
      ) : null}

      {activeTab === "bookshelf" ? (
        <View className="rounded-2xl border border-brand-border bg-surface p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-puce-red">Club bookshelf</Text>
            {manageBooks ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setPickerMode("shelf");
                  setPickerOpen(true);
                }}
                className="min-h-[44px] justify-center rounded-full bg-primary/15 px-3"
              >
                <Text className="text-xs font-semibold text-puce-red">Add book</Text>
              </Pressable>
            ) : null}
          </View>
          {manageBooks ? (
            <View className="mb-3 flex-row flex-wrap gap-2">
              {BOOK_CATEGORIES.map((category) => {
                const active = shelfCategory === category.id;
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setShelfCategory(category.id)}
                    className={`min-h-[44px] justify-center rounded-full px-3 ${
                      active ? "bg-puce-red" : "bg-primary/15"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-puce-red"
                      }`}
                    >
                      Add to {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {BOOK_CATEGORIES.map((category) => {
            const items = booksByCategory.get(category.id) ?? [];
            if (!items.length) return null;
            return (
              <View key={category.id} className="mb-4">
                <Text className="mb-2 text-sm font-semibold text-ink-muted">
                  {category.label}
                </Text>
                <View className="gap-2">
                  {items.map((item) =>
                    item.book ? (
                      <View
                        key={item.id}
                        className="flex-row items-center gap-3 rounded-xl bg-background p-2"
                      >
                        <Pressable
                          onPress={() => router.push(`/book/${item.book!.id}`)}
                          className="flex-1 flex-row items-center gap-3 active:opacity-80"
                        >
                          <BookCover
                            url={item.book.cover_url}
                            title={item.book.title}
                            sizeClassName="h-20 w-14"
                          />
                          <View className="flex-1">
                            <Text className="font-semibold text-ink" numberOfLines={1}>
                              {item.book.title}
                            </Text>
                            {item.book.author ? (
                              <Text
                                className="mt-1 text-sm text-ink-muted"
                                numberOfLines={1}
                              >
                                {item.book.author}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                        {manageBooks ? (
                          <View className="gap-1">
                            {category.id !== "current_read" ? (
                              <Pressable
                                accessibilityRole="button"
                                onPress={() =>
                                  void setCurrentRead
                                    .mutateAsync({ bookId: item.book_id })
                                    .then((result) => {
                                      if (result.error)
                                        Alert.alert("Couldn't set read", result.error);
                                    })
                                }
                                className="min-h-[44px] justify-center px-1"
                              >
                                <Text className="text-[11px] font-semibold text-puce-red">
                                  Set current
                                </Text>
                              </Pressable>
                            ) : null}
                            <Pressable
                              accessibilityRole="button"
                              onPress={() => {
                                const next =
                                  category.id === "upcoming"
                                    ? "previous"
                                    : category.id === "previous"
                                      ? "suggested"
                                      : "upcoming";
                                void setBookCategory
                                  .mutateAsync({
                                    shelfBookId: item.id,
                                    category: next,
                                  })
                                  .then((result) => {
                                    if (result.error)
                                      Alert.alert("Couldn't move", result.error);
                                  });
                              }}
                              className="min-h-[44px] justify-center px-1"
                            >
                              <Text className="text-[11px] text-ink-muted">Move</Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              onPress={() =>
                                void removeClubBook
                                  .mutateAsync(item.id)
                                  .then((result) => {
                                    if (result.error)
                                      Alert.alert("Couldn't remove", result.error);
                                  })
                              }
                              className="min-h-[44px] justify-center px-1"
                            >
                              <Text className="text-[11px] text-ink-muted">Remove</Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    ) : null
                  )}
                </View>
              </View>
            );
          })}
          {!shelfBooks.data?.length ? (
            <Text className="text-sm text-ink-muted">
              Add books to build the club bookshelf.
            </Text>
          ) : null}
        </View>
      ) : null}

      {activeTab === "members" ? (
        <View className="rounded-2xl border border-brand-border bg-surface p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-puce-red">
              Members ({club.members.length})
            </Text>
            {manageMembers ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setInviteOpen(true)}
                className="min-h-[44px] justify-center rounded-full bg-primary/15 px-3"
              >
                <Text className="text-xs font-semibold text-puce-red">Invite</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <View className="flex-row gap-2">
              {ROLE_FILTERS.map((filter) => {
                const selected = roleFilter === filter.id;
                return (
                  <Pressable
                    key={filter.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setRoleFilter(filter.id)}
                    className={`min-h-[44px] justify-center rounded-full px-3 ${
                      selected ? "bg-puce-red" : "bg-primary/15"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        selected ? "text-white" : "text-puce-red"
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {manageMembers && pendingRequests.length ? (
            <View className="mb-4 rounded-xl border border-brand-border bg-background p-3">
              <Text className="mb-2 text-sm font-semibold text-puce-red">
                Join requests ({pendingRequests.length})
              </Text>
              {pendingRequests.map((request) => {
                const name =
                  request.requester.display_name?.trim() ||
                  request.requester.username?.trim() ||
                  "Reader";
                return (
                  <View key={request.id} className="mb-2">
                    <Text className="text-sm font-medium text-ink">{name}</Text>
                    {request.message ? (
                      <Text className="text-xs text-ink-muted">{request.message}</Text>
                    ) : null}
                    <View className="mt-2 flex-row gap-2">
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          void approveRequest.mutateAsync(request.id).then((result) => {
                            if (result.error)
                              Alert.alert("Couldn't approve", result.error);
                          })
                        }
                        className="min-h-[44px] flex-1 items-center justify-center rounded-full bg-puce-red"
                      >
                        <Text className="text-xs font-semibold text-white">Approve</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          void declineRequest.mutateAsync(request.id).then((result) => {
                            if (result.error)
                              Alert.alert("Couldn't decline", result.error);
                          })
                        }
                        className="min-h-[44px] flex-1 items-center justify-center rounded-full bg-primary/15"
                      >
                        <Text className="text-xs font-semibold text-puce-red">
                          Decline
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <View className="gap-3">
            {filteredMembers.map((member) => (
              <View key={member.id} className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => {
                    const username = member.profile.username?.trim();
                    if (username) router.push(`/reader/${username}`);
                  }}
                  disabled={!member.profile.username?.trim()}
                  className="min-h-[44px] flex-1 flex-row items-center gap-3 active:opacity-80"
                  accessibilityRole={member.profile.username ? "link" : undefined}
                >
                  <Avatar
                    url={member.profile.avatar_url}
                    name={memberName(member)}
                    size={32}
                  />
                  <View className="flex-1">
                    <Text className="text-ink" numberOfLines={1}>
                      {memberName(member)}
                    </Text>
                    <Text className="text-[11px] font-semibold text-puce-red">
                      {roleLabel(member.role)}
                    </Text>
                  </View>
                </Pressable>
                {manageMembers &&
                member.role !== "owner" &&
                member.user_id !== userId ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Manage ${memberName(member)}`}
                    onPress={() => openMemberActions(member)}
                    className="min-h-[44px] justify-center rounded-full bg-primary/15 px-3"
                  >
                    <Text className="text-xs font-semibold text-puce-red">Manage</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {activeTab === "stats" ? (
        <View className="rounded-2xl border border-brand-border bg-surface p-4">
          <Text className="text-lg font-semibold text-puce-red">Club stats</Text>
          {stats.isLoading ? (
            <LoadingState message="Loading stats�" />
          ) : stats.data ? (
            <View className="mt-4 flex-row flex-wrap gap-3">
              {[
                { label: "Members", value: stats.data.active_members },
                { label: "Discussions", value: stats.data.discussions_created },
                { label: "Replies", value: stats.data.replies_posted },
                { label: "Events", value: stats.data.events_created },
                ...(showDetailedStats
                  ? [
                      { label: "RSVPs going", value: stats.data.rsvp_participation },
                      { label: "Books done", value: stats.data.books_completed },
                      { label: "Growth 30d", value: stats.data.member_growth_30d },
                    ]
                  : []),
              ].map((stat) => (
                <View
                  key={stat.label}
                  className="min-w-[30%] flex-1 rounded-xl bg-background p-3"
                >
                  <Text className="text-xs text-ink-muted">{stat.label}</Text>
                  <Text className="mt-1 text-2xl font-bold text-puce-red">
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="mt-3 text-sm text-ink-muted">Stats unavailable.</Text>
          )}
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      <FlatList
        className="flex-1 bg-background"
        data={activeTab === "discussions" ? discussions.data ?? [] : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: TAB_BAR_SPACE }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ClubDiscussionCard
            post={item}
            canDelete={item.user_id === userId || canManageMembers(viewerRole)}
            deleting={deletingPostId === item.id}
            onDelete={() => confirmDeletePost(item.id)}
            onPress={() => setThreadDiscussion(item)}
          />
        )}
        ListEmptyComponent={
          activeTab === "discussions" ? (
            discussions.isLoading ? (
              <LoadingState message="Loading discussions�" />
            ) : (
              <View className="rounded-2xl border border-dashed border-brand-border bg-surface px-4 py-8">
                <Text className="text-center font-medium text-puce-red">
                  No discussions yet
                </Text>
                <Text className="mt-1 text-center text-sm text-ink-muted">
                  {isMember
                    ? "Be the first to start a discussion above."
                    : "This club hasn't started any discussions yet."}
                </Text>
              </View>
            )
          ) : null
        }
      />

      <BookPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(doc) => {
          setPickerOpen(false);
          void handlePickBook(doc);
        }}
        title={
          pickerMode === "current" ? "Set the current book" : "Add to bookshelf"
        }
      />

      <InviteMembersSheet
        visible={inviteOpen}
        clubId={clubId}
        currentUserId={userId ?? ""}
        excludeUserIds={(club.members ?? []).map((member) => member.user_id)}
        onClose={() => setInviteOpen(false)}
      />

      <ClubDiscussionThreadSheet
        visible={Boolean(threadDiscussion)}
        clubId={clubId}
        discussion={threadDiscussion}
        viewerId={userId ?? ""}
        viewerRole={viewerRole}
        isMember={isMember}
        onClose={() => setThreadDiscussion(null)}
      />

      <Modal
        visible={editOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setEditOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View
            className="max-h-[90%] rounded-t-3xl bg-background px-5 pt-5"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-puce-red">Club settings</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditOpen(false)}
                className="min-h-[44px] justify-center rounded-full bg-primary/15 px-4 active:opacity-80"
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

              <View className="mb-3">
                <Text className="mb-1 text-sm font-medium text-ink">Visibility</Text>
                <View className="flex-row flex-wrap gap-2">
                  {VISIBILITY_OPTIONS.map((option) => {
                    const isActive = editVisibility === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="button"
                        onPress={() => setEditVisibility(option.id)}
                        className={`min-h-[44px] justify-center rounded-xl px-4 ${
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

              <View className="mb-4">
                <Text className="mb-1 text-sm font-medium text-ink">Join policy</Text>
                <View className="flex-row flex-wrap gap-2">
                  {JOIN_POLICY_OPTIONS.map((option) => {
                    const isActive = editJoinPolicy === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole="button"
                        onPress={() => setEditJoinPolicy(option.id)}
                        className={`min-h-[44px] justify-center rounded-xl px-4 ${
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
                onPress={() => void handleSaveEdit()}
              />
              <View className="h-3" />
              <Button
                title="Delete club"
                variant="ghost"
                loading={deleteClubMutation.isPending}
                onPress={confirmDeleteClub}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
