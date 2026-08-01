"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TAGS = [
  ["romance", "Romance"], ["smut", "Smut"], ["high_spice", "High Spice"],
  ["slow_burn", "Slow Burn"], ["dragons", "Dragons"], ["magic", "Magic"],
  ["cozy", "Cozy"], ["emotional", "Emotional"], ["found_family", "Found Family"],
] as const;

export function CommunityContentTags({ bookId, canVote }: { bookId: string; canVote: boolean }) {
  const [counts, setCounts] = useState<Record<string, { count: number; percent: number }>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const [{ data: totals }, { data: votes }] = await Promise.all([
      supabase.from("book_content_tag_summary").select("tag, vote_count, vote_percentage").eq("book_id", bookId),
      auth.user
        ? supabase.from("book_content_tag_votes").select("tag").eq("book_id", bookId).eq("user_id", auth.user.id)
        : Promise.resolve({ data: [] as { tag: string }[] }),
    ]);
    setCounts(Object.fromEntries((totals ?? []).map((row) => [row.tag, { count: row.vote_count, percent: row.vote_percentage }])));
    setSelected(new Set((votes ?? []).map((row) => row.tag)));
  }

  useEffect(() => { void load(); }, [bookId]);

  async function toggle(tag: string) {
    if (!canVote || saving) return;
    setSaving(true);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return setSaving(false);
    const hasVote = selected.has(tag);
    const { error } = hasVote
      ? await supabase.from("book_content_tag_votes").delete().eq("book_id", bookId).eq("tag", tag)
      : await supabase.from("book_content_tag_votes").insert({ book_id: bookId, user_id: auth.user.id, tag });
    setSaving(false);
    if (!error) void load();
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5 text-left">
      <h2 className="text-lg font-semibold text-puce-red">Community content tags</h2>
      <p className="mt-1 text-sm text-text-muted">
        {canVote ? "Finished readers can vote for every tag that fits." : "Finish this book to add your votes."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {TAGS.map(([tag, label]) => (
          <button key={tag} type="button" disabled={!canVote || saving} onClick={() => void toggle(tag)}
            className={`rounded-full border px-3 py-1.5 text-sm ${selected.has(tag) ? "border-puce-red bg-puce-red text-white" : "border-border text-text-muted"} disabled:cursor-not-allowed`}>
            {label}{counts[tag] ? ` · ${counts[tag].percent}%` : ""}
          </button>
        ))}
      </div>
    </section>
  );
}
