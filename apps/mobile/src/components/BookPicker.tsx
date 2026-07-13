import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookCard } from "./BookCard";
import { EmptyState } from "./EmptyState";
import { Input } from "./Input";
import { useBookSearch } from "../hooks/useBookSearch";
import type { CatalogDoc } from "../services/isbndb";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (doc: CatalogDoc) => void;
  title?: string;
};

/**
 * Full-screen catalog picker used by the club owner flows to choose a current
 * book. Reuses the shared ISBNdb book search (same source as the Search tab).
 */
export function BookPicker({ visible, onClose, onSelect, title = "Choose a book" }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data: results, isFetching, isError, error } = useBookSearch(submitted);

  function handleSelect(doc: CatalogDoc) {
    onSelect(doc);
    setQuery("");
    setSubmitted("");
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-5 pt-3 pb-1">
          <Text className="text-xl font-bold text-puce-red">{title}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            className="rounded-full bg-primary/15 px-4 py-2 active:opacity-80"
          >
            <Text className="text-sm font-semibold text-puce-red">Close</Text>
          </Pressable>
        </View>

        <View className="px-5 pt-2">
          <Input
            label="Search the catalog"
            placeholder="Title, author, or ISBN"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => setSubmitted(query)}
          />
        </View>

        {isFetching ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="large" color="#642F37" />
          </View>
        ) : isError ? (
          <EmptyState
            title="Search failed"
            description={error instanceof Error ? error.message : "Please try again."}
          />
        ) : (
          <FlatList
            data={results ?? []}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 32,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <BookCard
                title={item.title}
                author={item.author_name?.join(", ")}
                coverUrl={item.cover_url}
                subtitle={item.first_publish_year ? `${item.first_publish_year}` : null}
                onPress={() => handleSelect(item)}
              />
            )}
            ListEmptyComponent={
              submitted.trim().length >= 2 ? (
                <EmptyState title="No results" description={`Nothing found for "${submitted}".`} />
              ) : (
                <EmptyState
                  title="Find the club's next read"
                  description="Search millions of books by title, author, or ISBN."
                />
              )
            }
          />
        )}
      </View>
    </Modal>
  );
}
