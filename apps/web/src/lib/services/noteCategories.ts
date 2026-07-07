import { createClient } from "@/lib/supabase/client";
import {
  customCategoryValue,
  mergeReadingNoteCategories,
  type ReadingNoteCategoryMeta,
} from "@/lib/readingNotes/categories";
import type { UserReadingNoteCategory } from "@/types";

export const MAX_CUSTOM_NOTE_CATEGORIES = 20;
export const MIN_CUSTOM_CATEGORY_LABEL_LENGTH = 2;
export const MAX_CUSTOM_CATEGORY_LABEL_LENGTH = 40;

function normalizeLabel(label: string): string {
  return label.trim();
}

function validateLabel(label: string): string | null {
  const trimmed = normalizeLabel(label);
  if (trimmed.length < MIN_CUSTOM_CATEGORY_LABEL_LENGTH) {
    return `Category name must be at least ${MIN_CUSTOM_CATEGORY_LABEL_LENGTH} characters.`;
  }
  if (trimmed.length > MAX_CUSTOM_CATEGORY_LABEL_LENGTH) {
    return `Category name must be ${MAX_CUSTOM_CATEGORY_LABEL_LENGTH} characters or fewer.`;
  }
  return null;
}

export async function listCustomNoteCategories(
  userId: string
): Promise<UserReadingNoteCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_reading_note_categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[noteCategories] list custom failed:", error);
    return [];
  }

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
  const validationError = validateLabel(label);
  if (validationError) return { error: validationError };

  const supabase = createClient();
  const existing = await listCustomNoteCategories(userId);
  if (existing.length >= MAX_CUSTOM_NOTE_CATEGORIES) {
    return {
      error: `You can create up to ${MAX_CUSTOM_NOTE_CATEGORIES} custom categories.`,
    };
  }

  const normalizedLabel = normalizeLabel(label);
  const duplicate = existing.some(
    (item) => item.label.toLowerCase() === normalizedLabel.toLowerCase()
  );
  if (duplicate) {
    return { error: "You already have a category with this name." };
  }

  const { data, error } = await supabase
    .from("user_reading_note_categories")
    .insert({
      user_id: userId,
      label: normalizedLabel,
      emoji: emoji?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "You already have a category with this name." };
    }
    return { error: error.message };
  }

  return { category: data as UserReadingNoteCategory };
}

export async function deleteCustomNoteCategory(
  userId: string,
  categoryId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const categoryValue = customCategoryValue(categoryId);

  const { count, error: countError } = await supabase
    .from("reading_notes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("category", categoryValue);

  if (countError) {
    return { error: countError.message };
  }

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
