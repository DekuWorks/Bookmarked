import { useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { BookCard } from "../../src/components/BookCard";
import { EmptyState } from "../../src/components/EmptyState";
import { Input } from "../../src/components/Input";
import { useBookSearch } from "../../src/hooks/useBookSearch";

export default function SearchRoute() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data: results, isFetching, isError, error } = useBookSearch(submitted);

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-4">
        <Input
          label="Search books"
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
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <BookCard
              title={item.title}
              author={item.author_name?.join(", ")}
              coverUrl={item.cover_url}
              subtitle={item.first_publish_year ? `${item.first_publish_year}` : null}
            />
          )}
          ListEmptyComponent={
            submitted.trim().length >= 2 ? (
              <EmptyState title="No results" description={`Nothing found for "${submitted}".`} />
            ) : (
              <EmptyState
                title="Find your next read"
                description="Search millions of books by title, author, or ISBN via ISBNdb."
              />
            )
          }
        />
      )}
    </View>
  );
}
