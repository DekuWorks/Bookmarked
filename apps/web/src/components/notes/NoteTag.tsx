"use client";

import { cn } from "@/lib/utils/cn";
import { resolveNoteTagTone } from "@bookmarked/utils/noteTag";
import { readingNoteCategoryPill } from "@/lib/readingNotes/styles";

type Props = {
  label: string;
  color?: string | null;
  category?: string | null;
  isCustom?: boolean;
  emoji?: string | null;
  className?: string;
};

/**
 * Unified note tag pill for builtin, custom, mood, vibe, emotion, imported, and legacy tags.
 * Color priority: stored custom → category default → Bookmarked purple.
 */
export function NoteTag({
  label,
  color,
  category,
  isCustom,
  emoji,
  className,
}: Props) {
  const tone = resolveNoteTagTone({ label, color, category, isCustom });

  return (
    <span
      className={cn(readingNoteCategoryPill, "max-w-full shrink-0", className)}
      style={{
        backgroundColor: tone.background,
        borderColor: tone.border,
        color: tone.text,
      }}
    >
      {emoji ? <span aria-hidden>{emoji}</span> : null}
      <span className="truncate">{label}</span>
    </span>
  );
}
