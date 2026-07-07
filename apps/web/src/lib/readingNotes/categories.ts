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
export const CUSTOM_READING_NOTE_TAG_CLASS =
  "bg-surface text-text-muted border-border";

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
    tagClassName: CUSTOM_READING_NOTE_TAG_CLASS,
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
      tagClassName: CUSTOM_READING_NOTE_TAG_CLASS,
    };
  }

  return (
    READING_NOTE_CATEGORIES.find((item) => item.value === category) ??
    READING_NOTE_CATEGORIES[READING_NOTE_CATEGORIES.length - 1]
  );
}
