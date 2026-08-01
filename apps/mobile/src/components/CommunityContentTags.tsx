import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { supabase } from "../services/supabase";

const TAGS = [
  ["romance", "Romance"], ["smut", "Smut"], ["high_spice", "High Spice"],
  ["slow_burn", "Slow Burn"], ["dragons", "Dragons"], ["magic", "Magic"],
  ["cozy", "Cozy"], ["emotional", "Emotional"], ["found_family", "Found Family"],
] as const;

export function CommunityContentTags({ bookId, canVote }: { bookId: string; canVote: boolean }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    const [{ data: totals }, { data: votes }] = await Promise.all([
      supabase.from("book_content_tag_summary").select("tag, vote_percentage").eq("book_id", bookId),
      auth.user
        ? supabase.from("book_content_tag_votes").select("tag").eq("book_id", bookId).eq("user_id", auth.user.id)
        : Promise.resolve({ data: [] as { tag: string }[] }),
    ]);
    setCounts(Object.fromEntries((totals ?? []).map((row) => [row.tag, row.vote_percentage])));
    setSelected(new Set((votes ?? []).map((row) => row.tag)));
  }

  useEffect(() => { void load(); }, [bookId]);

  async function toggle(tag: string) {
    if (!canVote) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = selected.has(tag)
      ? await supabase.from("book_content_tag_votes").delete().eq("book_id", bookId).eq("tag", tag)
      : await supabase.from("book_content_tag_votes").insert({ book_id: bookId, user_id: auth.user.id, tag });
    if (!error) void load();
  }

  return (
    <View className="rounded-2xl border border-brand-border bg-surface p-4">
      <Text className="text-base font-bold text-puce-red">Community content tags</Text>
      <Text className="mt-1 text-sm text-ink-muted">
        {canVote ? "Tap every tag that fits this book." : "Finish this book to add your votes."}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        {TAGS.map(([tag, label]) => (
          <Pressable key={tag} disabled={!canVote} onPress={() => void toggle(tag)}
            className={`rounded-full border px-3 py-1.5 ${selected.has(tag) ? "border-puce-red bg-puce-red" : "border-brand-border bg-background"} ${!canVote ? "opacity-60" : ""}`}>
            <Text className={`text-xs font-semibold ${selected.has(tag) ? "text-white" : "text-ink-muted"}`}>
              {label}{counts[tag] != null ? ` · ${counts[tag]}%` : ""}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
