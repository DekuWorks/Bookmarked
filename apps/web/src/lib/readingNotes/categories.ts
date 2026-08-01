import type {
  BuiltinReadingNoteCategory,
  ReadingNoteCategory,
  UserReadingNoteCategory,
} from "@/types";

export type ReadingNoteCategoryMeta = {
  value: ReadingNoteCategory;
  label: string;
  emoji: string;
  tagClassName: string;
};

export const CUSTOM_READING_NOTE_CATEGORY_PREFIX = "custom:";
export const CUSTOM_READING_NOTE_DEFAULT_EMOJI = "🏷️";
/** Brand lilac for custom categories (always a colored background). */
export const CUSTOM_READING_NOTE_TAG_CLASS =
  "bg-primary/25 text-puce-red border-primary/40 dark:bg-primary/30 dark:text-primary dark:border-primary/50";

const CUSTOM_TAG_PALETTE = [
  "bg-primary/25 text-puce-red border-primary/40 dark:bg-primary/30 dark:text-primary dark:border-primary/50",
  "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-700",
  "bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-900/40 dark:text-pink-100 dark:border-pink-700",
  "bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-100 dark:border-cyan-700",
  "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700",
  "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-700",
  "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-700",
  "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700",
] as const;

function customTagClassForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return CUSTOM_TAG_PALETTE[hash % CUSTOM_TAG_PALETTE.length]!;
}

const BUILTIN_CATEGORY_VALUES = new Set<string>([
  "favorite_quote",
  "character_development",
  "important_plot_point",
  "theory",
  "favorite_scene",
  "emotional_moment",
  "general_note",
]);

const CUSTOM_CATEGORY_PATTERN =
  /^custom:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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
    tagClassName:
      "bg-primary/20 text-puce-red border-primary/35 dark:bg-primary/25 dark:text-primary dark:border-primary/45",
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

export function isBuiltinReadingNoteCategory(
  category: string
): category is BuiltinReadingNoteCategory {
  return BUILTIN_CATEGORY_VALUES.has(category);
}

export function isCustomReadingNoteCategory(
  category: string
): category is `custom:${string}` {
  return category.startsWith(CUSTOM_READING_NOTE_CATEGORY_PREFIX);
}

export function isReadingNoteCategoryValue(category: string): category is ReadingNoteCategory {
  return isBuiltinReadingNoteCategory(category) || CUSTOM_CATEGORY_PATTERN.test(category);
}

export function customCategoryValue(id: string): ReadingNoteCategory {
  return `${CUSTOM_READING_NOTE_CATEGORY_PREFIX}${id}`;
}

export function parseCustomCategoryId(category: ReadingNoteCategory): string | null {
  if (!isCustomReadingNoteCategory(category)) return null;
  return category.slice(CUSTOM_READING_NOTE_CATEGORY_PREFIX.length);
}

export function customCategoryMeta(
  category: ReadingNoteCategory,
  custom: UserReadingNoteCategory
): ReadingNoteCategoryMeta {
  return {
    value: category,
    label: custom.label,
    emoji: custom.emoji ?? CUSTOM_READING_NOTE_DEFAULT_EMOJI,
    tagClassName: customTagClassForId(custom.id),
  };
}

export function buildCustomCategoryLookup(
  customCategories: UserReadingNoteCategory[]
): Map<string, UserReadingNoteCategory> {
  return new Map(customCategories.map((item) => [item.id, item]));
}

export function mergeReadingNoteCategories(
  customCategories: UserReadingNoteCategory[]
): ReadingNoteCategoryMeta[] {
  return [
    ...READING_NOTE_CATEGORIES,
    ...customCategories.map((item) =>
      customCategoryMeta(customCategoryValue(item.id), item)
    ),
  ];
}

export function getReadingNoteCategoryMeta(
  category: ReadingNoteCategory,
  customLookup?: Map<string, UserReadingNoteCategory>
): ReadingNoteCategoryMeta {
  if (isCustomReadingNoteCategory(category)) {
    const id = parseCustomCategoryId(category);
    const custom = id ? customLookup?.get(id) : undefined;
    if (custom) {
      return customCategoryMeta(category, custom);
    }
    return {
      value: category,
      label: "Custom",
      emoji: CUSTOM_READING_NOTE_DEFAULT_EMOJI,
      tagClassName: id ? customTagClassForId(id) : CUSTOM_READING_NOTE_TAG_CLASS,
    };
  }

  return (
    READING_NOTE_CATEGORIES.find((item) => item.value === category) ??
    READING_NOTE_CATEGORIES[READING_NOTE_CATEGORIES.length - 1]
  );
}
