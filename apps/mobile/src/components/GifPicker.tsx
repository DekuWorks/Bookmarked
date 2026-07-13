import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  fetchTrendingGiphy,
  isGiphySearchConfigured,
  searchGiphy,
  type GiphySearchResult,
} from "../services/giphy";
import { resolveGiphyImageUrl } from "../utils/giphy";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called with a direct Giphy media URL to attach. */
  onSelect: (url: string) => void;
};

/**
 * Compact Giphy picker shared by the post composer, comment composer, and the
 * Messages thread composer. Mirrors the web `GifSearchPicker`: debounced search,
 * trending on open, a grid of results, and a paste-link fallback.
 */
export function GifPicker({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GiphySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteLink, setPasteLink] = useState("");
  const configured = isGiphySearchConfigured();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    setPasteLink("");
    setError(null);
    if (!configured) return;
    let active = true;
    setLoading(true);
    fetchTrendingGiphy()
      .then((r) => active && setResults(r))
      .catch(() => active && setError("Could not load trending GIFs."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [visible, configured]);

  useEffect(() => {
    if (!visible || !configured) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setError(null);
      (q ? searchGiphy(q) : fetchTrendingGiphy())
        .then(setResults)
        .catch(() => setError("GIF search failed."))
        .finally(() => setLoading(false));
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible, configured]);

  function choose(url: string) {
    onSelect(url);
    onClose();
  }

  function submitPasteLink() {
    const resolved = resolveGiphyImageUrl(pasteLink);
    if (!resolved) {
      setError("Paste a valid Giphy link.");
      return;
    }
    choose(resolved);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View
          style={{ paddingBottom: insets.bottom + 8, maxHeight: "82%" }}
          className="rounded-t-3xl bg-surface"
        >
          <View className="flex-row items-center justify-between border-b border-brand-border px-4 py-3">
            <Text className="text-base font-bold text-puce-red">Add a GIF</Text>
            <Pressable onPress={onClose} className="active:opacity-70">
              <Text className="text-sm text-ink-muted">Close</Text>
            </Pressable>
          </View>

          <View className="px-4 pt-3">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search GIFs"
              placeholderTextColor="#A99DAE"
              autoCapitalize="none"
              editable={configured}
              className="rounded-xl border border-brand-border bg-background px-3 py-2.5 text-base text-ink"
            />
          </View>

          {!configured ? (
            <View className="px-4 py-6">
              <Text className="text-sm text-ink-muted">
                GIF search isn&apos;t configured. Set EXPO_PUBLIC_GIPHY_API_KEY, or paste a
                Giphy link below.
              </Text>
            </View>
          ) : error ? (
            <Text className="px-4 py-2 text-sm text-rust">{error}</Text>
          ) : null}

          {configured ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={{ padding: 12, gap: 8 }}
              columnWrapperStyle={{ gap: 8 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                loading ? (
                  <View className="py-8">
                    <ActivityIndicator color="#642F37" />
                  </View>
                ) : (
                  <Text className="px-2 py-6 text-center text-sm text-ink-muted">
                    No GIFs found.
                  </Text>
                )
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => choose(item.imageUrl)}
                  className="flex-1 overflow-hidden rounded-lg bg-primary/10 active:opacity-70"
                  style={{ aspectRatio: 1 }}
                >
                  <Image
                    source={{ uri: item.previewUrl || item.imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </Pressable>
              )}
            />
          ) : null}

          <View className="flex-row items-center gap-2 border-t border-brand-border px-4 pt-3">
            <TextInput
              value={pasteLink}
              onChangeText={setPasteLink}
              placeholder="Paste a Giphy link"
              placeholderTextColor="#A99DAE"
              autoCapitalize="none"
              className="flex-1 rounded-xl border border-brand-border bg-background px-3 py-2.5 text-sm text-ink"
            />
            <Pressable
              onPress={submitPasteLink}
              disabled={!pasteLink.trim()}
              className={`rounded-xl px-4 py-2.5 ${pasteLink.trim() ? "bg-puce-red" : "bg-primary/40"}`}
            >
              <Text className="text-sm font-semibold text-white">Add</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
