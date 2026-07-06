import type { ReadingNoteCategory } from "@/types";

export type ReadingNoteCategoryMeta = {
  value: ReadingNoteCategory;
  label: string;
  emoji: string;
  tagClassName: string;
};

export const READING_NOTE_CATEGORIES: ReadingNoteCategoryMeta[] = [
  {
    value: "favorite_quote",
    label: "Favorite Quote",
    emoji: "🟨",
    tagClassName: "bg-yellow-100 text-yellow-900 border-yellow-300",
  },
  {
    value: "character_development",
    label: "Character Development",
    emoji: "🟦",
    tagClassName: "bg-blue-100 text-blue-900 border-blue-300",
  },
  {
    value: "important_plot_point",
    label: "Important Plot Point",
    emoji: "🟥",
    tagClassName: "bg-red-100 text-red-900 border-red-300",
  },
  {
    value: "theory",
    label: "Theory",
    emoji: "🟪",
    tagClassName: "bg-purple-100 text-purple-900 border-purple-300",
  },
  {
    value: "favorite_scene",
    label: "Favorite Scene",
    emoji: "🟩",
    tagClassName: "bg-green-100 text-green-900 border-green-300",
  },
  {
    value: "emotional_moment",
    label: "Emotional Moment",
    emoji: "🟧",
    tagClassName: "bg-orange-100 text-orange-900 border-orange-300",
  },
  {
    value: "general_note",
    label: "General Note",
    emoji: "⬜",
    tagClassName: "bg-surface text-text-muted border-border",
  },
];

export const READING_NOTE_VISIBILITY_OPTIONS: {
  value: import("@/types").ReadingNoteVisibility;
  label: string;
}[] = [
  { value: "private", label: "Private" },
  { value: "friends_only", label: "Friends only" },
  { value: "public", label: "Public" },
];

export function getReadingNoteCategoryMeta(
  category: ReadingNoteCategory
): ReadingNoteCategoryMeta {
  return (
    READING_NOTE_CATEGORIES.find((item) => item.value === category) ??
    READING_NOTE_CATEGORIES[READING_NOTE_CATEGORIES.length - 1]
  );
}
