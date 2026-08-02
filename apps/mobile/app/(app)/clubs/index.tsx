import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";
import { useQueries } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { BrandHeader } from "../../../src/components/BrandHeader";
import { Button } from "../../../src/components/Button";
import { ClubCard } from "../../../src/components/ClubCard";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { SegmentedTabs } from "../../../src/components/SegmentedTabs";
import {
  useAcceptInvitation,
  useApproveJoinRequest,
  useDeclineInvitation,
  useDeclineJoinRequest,
  useDiscoverClubs,
  useMyClubs,
  useClubInvitations,
} from "../../../src/hooks/useClubs";
import { useUpcomingEvents } from "../../../src/hooks/useClubEvents";
import { listJoinRequests, searchClubs } from "../../../src/services/bookClubs";
import { formatEventDateTime } from "../../../src/services/clubEvents";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../../src/navigation/TabBarScroll";
import { useAuthStore } from "../../../src/store/authStore";
import type { BookClubJoinRequestWithDetails, BookClubSummary } from "../../../src/types";
import { canManageMembers } from "../../../../../packages/utils/clubPermissions";

type ClubsTab = "mine" | "discover" | "invites";

export default function ClubsRoute() {
  const router = useRouter();
  const { onScroll } = useTabBarScroll();
  const userId = useAuthStore((s) => s.user?.id);
  const [tab, setTab] = useState<ClubsTab>("mine");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<BookClubSummary[] | null>(null);
  const [searching, setSearching] = useState(false);

  const discover = useDiscoverClubs();
  const mine = useMyClubs();
  const invitations = useClubInvitations();
  const upcoming = useUpcomingEvents();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  const managedClubs = useMemo(
    () =>
      (mine.data ?? []).filter((club) => canManageMembers(club.viewer_role)),
    [mine.data]
  );

  const joinRequestQueries = useQueries({
    queries: managedClubs.map((club) => ({
      queryKey: ["club-join-requests", club.id],
      queryFn: () => listJoinRequests(club.id),
      enabled: Boolean(club.id),
    })),
  });

  const hostJoinRequests = useMemo(() => {
    const rows: Array<BookClubJoinRequestWithDetails & { clubName: string }> = [];
    joinRequestQueries.forEach((query, index) => {
      const club = managedClubs[index];
      if (!club || !query.data) return;
      for (const request of query.data) {
        if (request.status === "pending") {
          rows.push({ ...request, clubName: club.name });
        }
      }
    });
    return rows;
  }, [joinRequestQueries, managedClubs]);

  useEffect(() => {
    const trimmed = search.trim();
    if (tab !== "discover" || trimmed.length < 2 || !userId) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    const handle = setTimeout(() => {
      void searchClubs(userId, trimmed)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 250);

    return () => clearTimeout(handle);
  }, [search, tab, userId]);

  const discoverClubs = search.trim().length >= 2 ? searchResults ?? [] : discover.data ?? [];
  const pendingInvites = (invitations.data ?? []).filter(
    (invite) => invite.status === "pending"
  );

  async function handleAccept(invitationId: string, clubId: string) {
    const result = await acceptInvitation.mutateAsync(invitationId);
    if (result.error) {
      Alert.alert("Couldn't accept invite", result.error);
      return;
    }
    router.push(`/(app)/clubs/${clubId}`);
  }

  async function handleDecline(invitationId: string) {
    const result = await declineInvitation.mutateAsync(invitationId);
    if (result.error) Alert.alert("Couldn't decline invite", result.error);
  }

  const refreshing =
    discover.isRefetching ||
    mine.isRefetching ||
    invitations.isRefetching ||
    upcoming.isRefetching;

  function refetchAll() {
    void discover.refetch();
    void mine.refetch();
    void invitations.refetch();
    void upcoming.refetch();
    for (const query of joinRequestQueries) {
      void query.refetch();
    }
  }

  return (
    <View className="flex-1 bg-background">
      <BrandHeader
        title="Book Clubs"
        subtitle="Read together, discuss, and meet up."
      />

      <View className="gap-3 px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between gap-2">
          <SegmentedTabs
            options={[
              { id: "mine", label: "My Clubs" },
              { id: "discover", label: "Discover" },
              {
                id: "invites",
                label: pendingInvites.length
                  ? `Invites (${pendingInvites.length})`
                  : "Invites",
              },
            ]}
            value={tab}
            onChange={setTab}
            compact
            accessibilityLabel="Book clubs sections"
            className="flex-1"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start a club"
            onPress={() => router.push("/(app)/clubs/new")}
            className="min-h-[44px] justify-center rounded-full bg-puce-red px-4 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-white">Start</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View upcoming events"
          onPress={() => router.push("/(app)/events")}
          className="min-h-[44px] items-center justify-center self-start rounded-full border border-brand-border bg-surface px-4 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-puce-red">
            Upcoming events
            {upcoming.data?.length ? ` (${upcoming.data.length})` : ""}
          </Text>
        </Pressable>
      </View>

      {tab === "discover" ? (
        <View className="px-5 pb-2">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search public clubs"
            placeholderTextColor="#A99DAE"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search public clubs"
            className="min-h-[44px] rounded-full border border-brand-border bg-surface px-4 py-3 text-base text-ink"
          />
        </View>
      ) : null}

      {hostJoinRequests.length && (tab === "mine" || tab === "invites") ? (
        <View className="mx-5 mb-2 rounded-2xl border border-brand-border bg-surface p-3">
          <Text className="mb-2 text-sm font-semibold text-puce-red">
            Join requests ({hostJoinRequests.length})
          </Text>
          {hostJoinRequests.slice(0, 5).map((request) => (
            <HostJoinRequestRow key={request.id} request={request} />
          ))}
        </View>
      ) : null}

      {tab === "invites" ? (
        pendingInvites.length === 0 && invitations.isLoading ? (
          <LoadingState message="Loading invitations…" />
        ) : pendingInvites.length === 0 ? (
          <EmptyState
            title="No invitations"
            description="When someone invites you to a club, it will show up here."
          />
        ) : (
          <Animated.FlatList
            data={pendingInvites}
            keyExtractor={(item) => item.id}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              padding: 20,
              paddingBottom: TAB_BAR_SPACE,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refetchAll}
                tintColor="#642F37"
              />
            }
            renderItem={({ item }) => {
              const inviter =
                item.inviter.display_name?.trim() ||
                item.inviter.username?.trim() ||
                "A reader";
              return (
                <View className="mb-3 rounded-2xl border border-brand-border bg-surface p-4">
                  <Text className="text-base font-semibold text-puce-red">
                    {item.club.name}
                  </Text>
                  <Text className="mt-1 text-sm text-ink-muted">
                    Invited by {inviter}
                  </Text>
                  {item.message ? (
                    <Text className="mt-2 text-sm text-ink">{item.message}</Text>
                  ) : null}
                  <View className="mt-3 flex-row gap-2">
                    <Button
                      title="Accept"
                      variant="primary"
                      className="flex-1"
                      loading={acceptInvitation.isPending}
                      onPress={() => void handleAccept(item.id, item.club_id)}
                    />
                    <Button
                      title="Decline"
                      variant="ghost"
                      className="flex-1"
                      loading={declineInvitation.isPending}
                      onPress={() => void handleDecline(item.id)}
                    />
                  </View>
                </View>
              );
            }}
          />
        )
      ) : tab === "mine" ? (
        mine.isLoading ? (
          <LoadingState message="Loading your clubs…" />
        ) : mine.isError ? (
          <EmptyState
            title="Couldn't load clubs"
            description={
              mine.error instanceof Error ? mine.error.message : "Please try again."
            }
          />
        ) : (
          <Animated.FlatList
            data={mine.data ?? []}
            keyExtractor={(item) => item.id}
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              padding: 20,
              paddingBottom: TAB_BAR_SPACE,
              flexGrow: 1,
            }}
            renderItem={({ item }) => <ClubCard club={item} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refetchAll}
                tintColor="#642F37"
              />
            }
            ListHeaderComponent={
              upcoming.data?.length ? (
                <View className="mb-4 rounded-2xl border border-brand-border bg-surface p-3">
                  <Text className="mb-2 text-sm font-semibold text-puce-red">
                    Next up
                  </Text>
                  {upcoming.data.slice(0, 2).map((event) => (
                    <Pressable
                      key={event.id}
                      accessibilityRole="button"
                      onPress={() => router.push(`/(app)/clubs/${event.club.id}`)}
                      className="mb-2 min-h-[44px] justify-center active:opacity-80"
                    >
                      <Text className="font-medium text-ink" numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text className="text-xs text-ink-muted">
                        {event.club.name} · {formatEventDateTime(event.starts_at)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                title="You haven't joined any clubs"
                description="Browse Discover or start your own club."
                action={
                  <Button
                    title="Start a club"
                    variant="primary"
                    onPress={() => router.push("/(app)/clubs/new")}
                  />
                }
              />
            }
          />
        )
      ) : discover.isLoading || searching ? (
        <LoadingState message="Loading book clubs…" />
      ) : discover.isError ? (
        <EmptyState
          title="Couldn't load book clubs"
          description={
            discover.error instanceof Error
              ? discover.error.message
              : "Please try again."
          }
        />
      ) : (
        <Animated.FlatList
          data={discoverClubs}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: TAB_BAR_SPACE,
            flexGrow: 1,
          }}
          renderItem={({ item }) => <ClubCard club={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refetchAll}
              tintColor="#642F37"
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={
                search.trim().length >= 2 ? "No clubs match" : "No public clubs yet"
              }
              description={
                search.trim().length >= 2
                  ? "Try another search or start a club of your own."
                  : "Start a club and invite readers to join the conversation."
              }
              action={
                <Button
                  title="Start a club"
                  variant="primary"
                  onPress={() => router.push("/(app)/clubs/new")}
                />
              }
            />
          }
        />
      )}
    </View>
  );
}

function HostJoinRequestRow({
  request,
}: {
  request: BookClubJoinRequestWithDetails & { clubName: string };
}) {
  const approve = useApproveJoinRequest(request.club_id);
  const decline = useDeclineJoinRequest(request.club_id);
  const name =
    request.requester.display_name?.trim() ||
    request.requester.username?.trim() ||
    "Reader";

  return (
    <View className="mb-2 rounded-xl bg-background px-3 py-2">
      <Text className="text-sm font-medium text-ink" numberOfLines={1}>
        {name} · {request.clubName}
      </Text>
      {request.message ? (
        <Text className="mt-1 text-xs text-ink-muted" numberOfLines={2}>
          {request.message}
        </Text>
      ) : null}
      <View className="mt-2 flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Approve ${name}`}
          disabled={approve.isPending}
          onPress={() =>
            void approve.mutateAsync(request.id).then((result) => {
              if (result.error) Alert.alert("Couldn't approve", result.error);
            })
          }
          className="min-h-[44px] flex-1 items-center justify-center rounded-full bg-puce-red"
        >
          <Text className="text-xs font-semibold text-white">Approve</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decline ${name}`}
          disabled={decline.isPending}
          onPress={() =>
            void decline.mutateAsync(request.id).then((result) => {
              if (result.error) Alert.alert("Couldn't decline", result.error);
            })
          }
          className="min-h-[44px] flex-1 items-center justify-center rounded-full bg-primary/15"
        >
          <Text className="text-xs font-semibold text-puce-red">Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}
