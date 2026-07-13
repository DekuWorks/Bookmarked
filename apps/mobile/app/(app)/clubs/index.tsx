import { useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BrandHeader } from "../../../src/components/BrandHeader";
import { Button } from "../../../src/components/Button";
import { ClubCard } from "../../../src/components/ClubCard";
import { EmptyState } from "../../../src/components/EmptyState";
import { LoadingState } from "../../../src/components/LoadingState";
import { useDiscoverClubs, useMyClubs } from "../../../src/hooks/useClubs";

type ClubsTab = "discover" | "yours";

const TAB_OPTIONS: { id: ClubsTab; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "yours", label: "Your clubs" },
];

export default function ClubsRoute() {
  const router = useRouter();
  const [tab, setTab] = useState<ClubsTab>("discover");
  const discover = useDiscoverClubs();
  const mine = useMyClubs();

  const active = tab === "discover" ? discover : mine;
  const clubs = active.data ?? [];

  return (
    <View className="flex-1 bg-background">
      <BrandHeader
        title="Book Clubs"
        subtitle="Read together and join the conversation."
      />

      <View className="flex-row items-center justify-between gap-2 px-5 pt-4 pb-1">
        <View className="flex-row gap-2">
          {TAB_OPTIONS.map((option) => {
            const isActive = tab === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="tab"
                onPress={() => setTab(option.id)}
                className={`rounded-full px-4 py-2 ${
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

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/(app)/clubs/new")}
          className="rounded-full bg-puce-red px-4 py-2 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">+ New</Text>
        </Pressable>
      </View>

      {active.isLoading ? (
        <LoadingState message="Loading book clubs…" />
      ) : active.isError ? (
        <EmptyState
          title="Couldn't load book clubs"
          description={
            active.error instanceof Error ? active.error.message : "Please try again."
          }
        />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 32, flexGrow: 1 }}
          renderItem={({ item }) => <ClubCard club={item} />}
          refreshControl={
            <RefreshControl
              refreshing={active.isRefetching}
              onRefresh={active.refetch}
              tintColor="#642F37"
            />
          }
          ListEmptyComponent={
            tab === "discover" ? (
              <EmptyState
                title="No public clubs yet"
                description="Start a club and invite readers to join the conversation."
                action={
                  <Button
                    title="Start a club"
                    variant="primary"
                    onPress={() => router.push("/(app)/clubs/new")}
                  />
                }
              />
            ) : (
              <EmptyState
                title="You haven't joined any clubs"
                description="Browse the Discover tab or start your own club."
                action={
                  <Button
                    title="Start a club"
                    variant="primary"
                    onPress={() => router.push("/(app)/clubs/new")}
                  />
                }
              />
            )
          }
        />
      )}
    </View>
  );
}
