import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../src/components/Avatar";
import { BookCard } from "../../src/components/BookCard";
import { CoverTile } from "../../src/components/CoverTile";
import { EmptyState } from "../../src/components/EmptyState";
import { Input } from "../../src/components/Input";
import { ScreenGradientWash } from "../../src/components/ScreenGradientWash";
import { SegmentedTabs } from "../../src/components/SegmentedTabs";
import { useBookSearch } from "../../src/hooks/useBookSearch";
import { addCatalogBookToShelf, ensureCatalogBook } from "../../src/services/books";
import {
  addBookToCustomShelf,
  listCustomShelfIdsForBook,
  listUserCustomShelves,
  removeBookFromCustomShelf,
} from "../../src/services/customShelves";
import {
  getBookShelfMemberships,
  removeBookFromShelf,
  type BookShelfMembership,
} from "../../src/services/library";
import { needsMissingPageCountPrompt } from "../../src/services/completeReadingSession";
import { searchClubs } from "../../src/services/bookClubs";
import { createDirectConversation } from "../../src/services/messages";
import { searchProfiles } from "../../src/services/profile";
import { fetchTrendingSections } from "../../src/services/trending";
import { ShelfBadge } from "../../src/components/ShelfBadge";
import { ShelfIcon } from "../../src/components/ShelfIcon";
import { TAB_BAR_SPACE, useTabBarScroll } from "../../src/navigation/TabBarScroll";
import { useAuthStore } from "../../src/store/authStore";
import { trackProductEvent } from "../../src/services/productAnalytics";
import type { CatalogDoc } from "../../src/services/isbndb";
import type { ShelfStatus } from "../../src/types";
import type { UserShelf } from "../../src/types";
import {
  CURRENTLY_READING_ADD_EVENTS,
  isCurrentlyReadingAddFromOverview,
} from "../../../../packages/utils/currentlyReadingAdd";
import { CURRENTLY_READING_ADD_COPY } from "../../../../packages/utils/overviewCopy";

type Mode = "books" | "people" | "clubs";

const MODE_TABS: { id: Mode; label: string }[] = [
  { id: "books", label: "Books" },
  { id: "people", label: "People" },
  { id: "clubs", label: "Clubs" },
];

const SHELF_CHOICES: { status: ShelfStatus; label: string }[] = [
  { status: "want_to_read", label: "TBR" },
  { status: "currently_reading", label: "Currently Reading" },
  { status: "read", label: "Finished" },
  { status: "dnf", label: "DNF" },
];

const SHELF_LABEL_BY_STATUS: Record<ShelfStatus, string> = {
  want_to_read: "TBR",
  currently_reading: "Currently Reading",
  read: "Finished",
  dnf: "DNF",
};

/** Same catalog key used for shelf lookups when adding a book (isbn, falling back to the search key). */
function membershipKeyFor(doc: Pick<CatalogDoc, "isbn" | "key">): string {
  return doc.isbn?.[0]?.trim() || doc.key;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { origin: originParam } = useLocalSearchParams<{ origin?: string }>();
  const origin = Array.isArray(originParam) ? originParam[0] : originParam;
  const addFromOverview = isCurrentlyReadingAddFromOverview({ origin });
  const userId = useAuthStore((s) => s.user?.id);
  const { onScroll } = useTabBarScroll();

  const [mode, setMode] = useState<Mode>("books");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [target, setTarget] = useState<CatalogDoc | null>(null);
  const [pendingShelf, setPendingShelf] = useState<ShelfStatus | null>(null);
  const [pageCountInput, setPageCountInput] = useState("");
  const [pageCountOpen, setPageCountOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingShelf, setRemovingShelf] = useState(false);
  const [customShelves, setCustomShelves] = useState<UserShelf[]>([]);
  const [customMemberIds, setCustomMemberIds] = useState<string[]>([]);
  const [memberships, setMemberships] = useState<Map<string, BookShelfMembership>>(new Map());

  useEffect(() => {
    if (!target || !userId) return;
    void listUserCustomShelves(userId)
      .then(setCustomShelves)
      .catch(() => setCustomShelves([]));
  }, [target, userId]);

  useEffect(() => {
    if (!userId) {
      setMemberships(new Map());
      return;
    }
    void getBookShelfMemberships(userId)
      .then(setMemberships)
      .catch((error) => console.error("[search] failed to load shelf memberships:", error));
  }, [userId]);

  const targetMembership = target ? memberships.get(membershipKeyFor(target)) : undefined;

  useEffect(() => {
    if (!userId || !targetMembership?.bookId) {
      setCustomMemberIds([]);
      return;
    }
    void listCustomShelfIdsForBook(userId, targetMembership.bookId)
      .then(setCustomMemberIds)
      .catch(() => setCustomMemberIds([]));
  }, [userId, targetMembership?.bookId]);

  const books = useBookSearch(submitted);
  const trending = useQuery({ queryKey: ["trending-sections"], queryFn: fetchTrendingSections });
  const people = useQuery({
    queryKey: ["search-people", query, userId],
    queryFn: () => searchProfiles(query, userId),
    enabled: mode === "people" && query.trim().length >= 2,
  });
  const clubs = useQuery({
    queryKey: ["search-clubs", query, userId],
    queryFn: () => searchClubs(userId as string, query),
    enabled: mode === "clubs" && Boolean(userId) && query.trim().length >= 2,
  });

  async function addToShelf(
    shelf: ShelfStatus,
    options?: { manualPageCount?: number; doc?: CatalogDoc }
  ) {
    const book = options?.doc ?? target;
    if (!book) return;
    const key = membershipKeyFor(book);
    const wasShelved = Boolean(memberships.get(key)?.shelfStatus);
    setSaving(true);
    const result = await addCatalogBookToShelf(book, shelf, {
      manualPageCount: options?.manualPageCount,
    });
    setSaving(false);
    setTarget(null);
    setPendingShelf(null);
    setPageCountOpen(false);
    setPageCountInput("");
    if (!result.error && result.bookId) {
      setMemberships((prev) => {
        const next = new Map(prev);
        next.set(key, { bookId: result.bookId!, shelfStatus: shelf, isFavorite: false });
        return next;
      });
    }
    if (addFromOverview && shelf === "currently_reading") {
      if (result.error) {
        Alert.alert("Couldn't add book", result.error);
        return;
      }
      trackProductEvent(CURRENTLY_READING_ADD_EVENTS.fromSearch, { book_id: result.bookId ?? "" });
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: ["library", userId] });
      }
      router.replace("/");
      return;
    }
    Alert.alert(
      result.error ? "Couldn't add book" : wasShelved ? "Moved" : "Added",
      result.error ?? `"${book.title}" was saved to ${SHELF_LABEL_BY_STATUS[shelf]}.`
    );
  }

  async function removeFromShelf() {
    if (!target || !userId || !targetMembership?.bookId) return;
    const key = membershipKeyFor(target);
    setRemovingShelf(true);
    const result = await removeBookFromShelf(userId, targetMembership.bookId);
    setRemovingShelf(false);
    setTarget(null);
    if (result.error) {
      Alert.alert("Couldn't remove book", result.error);
      return;
    }
    setMemberships((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    Alert.alert("Removed", `"${target.title}" was removed from your shelves.`);
  }

  function chooseShelf(shelf: ShelfStatus) {
    if (
      shelf === "read" &&
      needsMissingPageCountPrompt({
        editionSelected: Boolean(target?.isbn?.[0]),
        catalogPageCount: target?.number_of_pages_median ?? null,
        previousPage: 0,
      })
    ) {
      setPendingShelf(shelf);
      setPageCountOpen(true);
      return;
    }
    void addToShelf(shelf);
  }

  async function addToCustomShelf(shelf: UserShelf) {
    if (!target || !userId) return;
    const isMember = customMemberIds.includes(shelf.id);
    setSaving(true);
    try {
      const ensured = await ensureCatalogBook(target);
      if (ensured.error || !ensured.bookId) {
        Alert.alert("Couldn't add book", ensured.error ?? "Please try again.");
        return;
      }

      if (isMember) {
        const result = await removeBookFromCustomShelf(shelf.id, ensured.bookId);
        if (result.error) {
          Alert.alert("Couldn't remove book", result.error);
          return;
        }
        setCustomMemberIds((prev) => prev.filter((id) => id !== shelf.id));
        Alert.alert("Removed", `"${target.title}" was removed from ${shelf.name}.`);
        return;
      }

      const result = await addBookToCustomShelf(shelf.id, userId, ensured.bookId);
      if (result.error) {
        Alert.alert("Couldn't add book", result.error);
        return;
      }
      setCustomMemberIds((prev) => [...prev, shelf.id]);
      Alert.alert("Added", `"${target.title}" was added to ${shelf.name}.`);
    } finally {
      setSaving(false);
    }
  }

  async function openDm(personId: string) {
    const result = await createDirectConversation(personId);
    if (result.error || !result.conversationId) {
      Alert.alert("Couldn't open chat", result.error ?? "Please try again.");
      return;
    }
    router.push(`/messages/${result.conversationId}`);
  }

  const listPadding = { paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 };

  return (
    <View className="flex-1 bg-background">
      <ScreenGradientWash />
      <View style={{ paddingTop: insets.top + 8 }} className="px-4 pb-2">
        <Text className="mb-2 text-3xl font-black text-puce-red">Search</Text>
        {addFromOverview ? (
          <View className="mb-3 flex-row items-center justify-between rounded-xl border border-brand-border bg-surface px-3 py-2">
            <Text className="flex-1 text-sm text-ink">{CURRENTLY_READING_ADD_COPY.addingBanner}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={() => {
                trackProductEvent(CURRENTLY_READING_ADD_EVENTS.canceled);
                router.replace("/");
              }}
              className="min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <Text className="text-sm font-semibold text-primary-dark">Cancel</Text>
            </Pressable>
          </View>
        ) : null}
        <Input
          placeholder={
            mode === "books"
              ? "Title, author, or ISBN"
              : mode === "people"
                ? "Search readers"
                : "Search book clubs"
          }
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => setSubmitted(query)}
        />
        <SegmentedTabs options={MODE_TABS} value={mode} onChange={setMode} />
      </View>

      {mode === "books" ? (
        books.isFetching ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#642F37" />
          </View>
        ) : submitted.trim().length >= 2 ? (
          <Animated.FlatList
            data={books.data ?? []}
            keyExtractor={(item) => item.key}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={listPadding}
            renderItem={({ item }) => {
              const membership = memberships.get(membershipKeyFor(item));
              return (
                <BookCard
                  title={item.title}
                  author={item.author_name?.join(", ")}
                  coverUrl={item.cover_url}
                  subtitle={
                    item.first_publish_year
                      ? `${item.first_publish_year}`
                      : addFromOverview
                        ? "Tap to add to Currently Reading"
                        : "Tap to add to a shelf"
                  }
                  onPress={() => {
                    if (addFromOverview) {
                      void addToShelf("currently_reading", { doc: item });
                      return;
                    }
                    setTarget(item);
                  }}
                  rightAccessory={
                    membership?.shelfStatus ? (
                      <ShelfBadge label={SHELF_LABEL_BY_STATUS[membership.shelfStatus]} />
                    ) : undefined
                  }
                />
              );
            }}
            ListEmptyComponent={
              <EmptyState title="No results" description={`Nothing found for "${submitted}".`} />
            }
          />
        ) : (
          <Animated.ScrollView
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE }}
          >
            {(trending.data ?? []).length === 0 ? (
              <EmptyState
                title="Find your next read"
                description="Search millions of books, or check back for community trends."
              />
            ) : (
              (trending.data ?? []).map((section) => (
                <View key={section.id} className="mb-6">
                  <Text className="mb-3 text-lg font-bold text-puce-red">{section.title}</Text>
                  <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {section.books.map((book) => (
                      <View key={book.bookId} className="mr-3">
                        <CoverTile
                          bookId={book.bookId}
                          title={book.title}
                          author={book.author}
                          coverUrl={book.coverUrl}
                        />
                      </View>
                    ))}
                  </Animated.ScrollView>
                </View>
              ))
            )}
          </Animated.ScrollView>
        )
      ) : mode === "people" ? (
        <Animated.FlatList
          data={people.data ?? []}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={listPadding}
          renderItem={({ item }) => (
            <View className="mb-2 flex-row items-center gap-3 rounded-2xl border border-brand-border bg-surface p-3">
              <Pressable
                onPress={() => {
                  const username = item.username?.trim();
                  if (username) router.push(`/reader/${username}`);
                }}
                disabled={!item.username?.trim()}
                className="flex-row items-center gap-3 flex-1 active:opacity-80"
                accessibilityRole={item.username ? "link" : undefined}
              >
                <Avatar url={item.avatar_url} name={item.display_name ?? item.username} size={44} />
                <View className="flex-1">
                  <Text className="font-semibold text-ink" numberOfLines={1}>
                    {item.display_name?.trim() || item.username?.trim() || "Reader"}
                  </Text>
                  {item.username ? (
                    <Text className="text-sm text-ink-muted">@{item.username}</Text>
                  ) : null}
                </View>
              </Pressable>
              <Pressable onPress={() => openDm(item.id)} className="active:opacity-70">
                <Text className="text-sm font-semibold text-primary-dark">Message</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="Find readers"
              description="Search by name or @username to open a profile or message someone."
            />
          }
        />
      ) : (
        <Animated.FlatList
          data={clubs.data ?? []}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={listPadding}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/clubs/${item.id}`)}
              className="mb-2 rounded-2xl border border-brand-border bg-surface p-4 active:opacity-80"
            >
              <Text className="font-bold text-ink" numberOfLines={1}>
                {item.name}
              </Text>
              {item.description ? (
                <Text className="mt-1 text-sm text-ink-muted" numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text className="mt-2 text-xs text-primary-dark">
                {item.member_count} member{item.member_count === 1 ? "" : "s"}
                {item.viewer_is_member ? " · Joined" : ""}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState title="Find book clubs" description="Search public clubs to join by name." />
          }
        />
      )}

      {/* Add-to-shelf sheet */}
      <Modal transparent visible={Boolean(target)} animationType="slide" onRequestClose={() => setTarget(null)}>
        <Pressable className="flex-1 justify-end bg-black/30" onPress={() => setTarget(null)}>
          <View className="rounded-t-3xl bg-surface p-5" style={{ paddingBottom: insets.bottom + 16 }}>
            <Text className="mb-1 text-lg font-bold text-puce-red" numberOfLines={1}>
              {target?.title}
            </Text>
            <Text className="mb-4 text-sm text-ink-muted">
              {targetMembership?.shelfStatus
                ? `On ${SHELF_LABEL_BY_STATUS[targetMembership.shelfStatus]} · tap a shelf to move`
                : "Add to a shelf"}
            </Text>
            {SHELF_CHOICES.map((choice) => {
              const isCurrent = targetMembership?.shelfStatus === choice.status;
              return (
                <Pressable
                  key={choice.status}
                  disabled={saving || isCurrent}
                  onPress={() => chooseShelf(choice.status)}
                  className={`mb-2 min-h-[44px] flex-row items-center gap-2 rounded-xl px-4 py-3 active:opacity-80 ${
                    isCurrent ? "bg-primary/25 border border-primary" : "bg-primary/10"
                  }`}
                >
                  <ShelfIcon id={choice.status} size="medium" />
                  <Text className="flex-1 font-medium leading-tight text-puce-red">{choice.label}</Text>
                  {isCurrent ? <Text className="font-bold text-puce-red">✓</Text> : null}
                </Pressable>
              );
            })}
            {targetMembership?.shelfStatus ? (
              <Pressable
                disabled={removingShelf}
                onPress={() => void removeFromShelf()}
                className="mb-2 min-h-[44px] flex-row items-center justify-center rounded-xl border border-red-300 bg-red-50 px-4 py-3 active:opacity-80"
              >
                <Text className="font-semibold text-red-600">
                  {removingShelf ? "Removing…" : "Remove from shelves"}
                </Text>
              </Pressable>
            ) : null}
            {customShelves.length ? (
              <>
                <Text className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Collections
                </Text>
                {customShelves.map((shelf) => {
                  const isMember = customMemberIds.includes(shelf.id);
                  return (
                    <Pressable
                      key={shelf.id}
                      disabled={saving}
                      onPress={() => void addToCustomShelf(shelf)}
                      className={`mb-2 flex-row items-center gap-3 rounded-xl border px-4 py-3 active:opacity-80 ${
                        isMember ? "border-primary bg-primary/10" : "border-brand-border bg-background"
                      }`}
                    >
                      <Text className="text-lg">📚</Text>
                      <Text className="flex-1 font-medium text-puce-red">{shelf.name}</Text>
                      {isMember ? <Text className="font-bold text-puce-red">✓</Text> : null}
                    </Pressable>
                  );
                })}
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={pageCountOpen}
        animationType="fade"
        onRequestClose={() => {
          if (!saving) {
            setPageCountOpen(false);
            setPendingShelf(null);
          }
        }}
      >
        <Pressable
          className="flex-1 justify-center bg-black/40 px-6"
          onPress={() => {
            if (!saving) {
              setPageCountOpen(false);
              setPendingShelf(null);
            }
          }}
        >
          <Pressable className="rounded-2xl bg-surface p-5" onPress={() => undefined}>
            <Text className="text-lg font-bold text-puce-red">Page count needed</Text>
            <Text className="mt-2 text-sm text-ink-muted">
              Enter how many pages this book has so it counts toward your reading stats.
            </Text>
            <TextInput
              className="mt-4 rounded-xl border border-brand-border bg-background px-4 py-3 text-ink"
              keyboardType="number-pad"
              placeholder="Total pages"
              value={pageCountInput}
              onChangeText={setPageCountInput}
            />
            <View className="mt-4 flex-row gap-3">
              <Pressable
                disabled={saving}
                onPress={() => {
                  if (!pendingShelf) return;
                  void addToShelf(pendingShelf);
                }}
                className="flex-1 rounded-xl border border-brand-border px-4 py-3 active:opacity-80"
              >
                <Text className="text-center font-medium text-ink-muted">Skip for now</Text>
              </Pressable>
              <Pressable
                disabled={saving}
                onPress={() => {
                  if (!pendingShelf) return;
                  const manualPageCount = Number.parseInt(pageCountInput.trim(), 10);
                  if (!Number.isFinite(manualPageCount) || manualPageCount <= 0) {
                    Alert.alert("Invalid page count", "Enter a whole number greater than zero.");
                    return;
                  }
                  void addToShelf(pendingShelf, { manualPageCount });
                }}
                className="flex-1 rounded-xl bg-primary px-4 py-3 active:opacity-80"
              >
                <Text className="text-center font-semibold text-white">Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
