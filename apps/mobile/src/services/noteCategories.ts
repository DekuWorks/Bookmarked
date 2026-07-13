import { supabase } from "./supabase";
import { READING_NOTE_CATEGORIES } from "./readingNotes";
import type { ReadingNoteCategory, UserReadingNoteCategory } from "../types";

/**
 * Custom reading-note categories + category metadata. Mirrors
 * apps/web/src/lib/services/noteCategories.ts and
 * apps/web/src/lib/readingNotes/categories.ts against
 * `user_reading_note_categories` + RLS.
 */

export const MAX_CUSTOM_NOTE_CATEGORIES = 20;
export const MIN_CUSTOM_CATEGORY_LABEL_LENGTH = 2;
export const MAX_CUSTOM_CATEGORY_LABEL_LENGTH = 40;
export const CUSTOM_READING_NOTE_CATEGORY_PREFIX = "custom:";
export const CUSTOM_READING_NOTE_DEFAULT_EMOJI = "🏷️";

export type ReadingNoteCategoryMeta = {
  value: ReadingNoteCategory;
  label: string;
  emoji: string;
};

export function isCustomReadingNoteCategory(
  category: string
): category is `custom:${string}` {
  return category.startsWith(CUSTOM_READING_NOTE_CATEGORY_PREFIX);
}

export function customCategoryValue(id: string): ReadingNoteCategory {
  return `${CUSTOM_READING_NOTE_CATEGORY_PREFIX}${id}`;
}

export function parseCustomCategoryId(category: ReadingNoteCategory): string | null {
  if (!isCustomReadingNoteCategory(category)) return null;
  return category.slice(CUSTOM_READING_NOTE_CATEGORY_PREFIX.length);
}

export function mergeReadingNoteCategories(
  customCategories: UserReadingNoteCategory[]
): ReadingNoteCategoryMeta[] {
  return [
    ...READING_NOTE_CATEGORIES.map((c) => ({ value: c.value, label: c.label, emoji: c.emoji })),
    ...customCategories.map((item) => ({
      value: customCategoryValue(item.id),
      label: item.label,
      emoji: item.emoji ?? CUSTOM_READING_NOTE_DEFAULT_EMOJI,
    })),
  ];
}

export function getReadingNoteCategoryMeta(
  category: ReadingNoteCategory,
  merged: ReadingNoteCategoryMeta[]
): ReadingNoteCategoryMeta {
  return (
    merged.find((c) => c.value === category) ?? {
      value: category,
      label: isCustomReadingNoteCategory(category) ? "Custom" : "Note",
      emoji: CUSTOM_READING_NOTE_DEFAULT_EMOJI,
    }
  );
}

export async function listCustomNoteCategories(
  userId: string
): Promise<UserReadingNoteCategory[]> {
  const { data, error } = await supabase
    .from("user_reading_note_categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as UserReadingNoteCategory[];
}

export async function listNoteCategories(
  userId: string
): Promise<ReadingNoteCategoryMeta[]> {
  const custom = await listCustomNoteCategories(userId);
  return mergeReadingNoteCategories(custom);
}

export async function createCustomNoteCategory(
  userId: string,
  label: string,
  emoji?: string | null
): Promise<{ error?: string; category?: UserReadingNoteCategory }> {
  const trimmed = label.trim();
  if (trimmed.length < MIN_CUSTOM_CATEGORY_LABEL_LENGTH) {
    return { error: `Category name must be at least ${MIN_CUSTOM_CATEGORY_LABEL_LENGTH} characters.` };
  }
  if (trimmed.length > MAX_CUSTOM_CATEGORY_LABEL_LENGTH) {
    return { error: `Category name must be ${MAX_CUSTOM_CATEGORY_LABEL_LENGTH} characters or fewer.` };
  }

  const existing = await listCustomNoteCategories(userId);
  if (existing.length >= MAX_CUSTOM_NOTE_CATEGORIES) {
    return { error: `You can create up to ${MAX_CUSTOM_NOTE_CATEGORIES} custom categories.` };
  }
  if (existing.some((item) => item.label.toLowerCase() === trimmed.toLowerCase())) {
    return { error: "You already have a category with this name." };
  }

  const { data, error } = await supabase
    .from("user_reading_note_categories")
    .insert({ user_id: userId, label: trimmed, emoji: emoji?.trim() || null })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "You already have a category with this name." };
    return { error: error.message };
  }
  return { category: data as UserReadingNoteCategory };
}

export async function deleteCustomNoteCategory(
  userId: string,
  categoryId: string
): Promise<{ error?: string }> {
  const categoryValue = customCategoryValue(categoryId);
  const { count, error: countError } = await supabase
    .from("reading_notes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("category", categoryValue);
  if (countError) return { error: countError.message };
  if ((count ?? 0) > 0) {
    return { error: "Remove or reassign notes using this category before deleting it." };
  }

  const { error } = await supabase
    .from("user_reading_note_categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  return {};
}
