import { supabase } from "./supabase";
import { SHELF_CONFIG } from "../constants/shelves";
import type { ShelfVisibility, UserShelf } from "../types";

/**
 * Mobile custom shelves service. Mirrors apps/web/src/lib/services/customShelves.ts
 * against `user_shelves` + `user_shelf_books` (+ RLS).
 */

export type CustomShelfBookItem = {
  id: string;
  book_id: string;
  created_at: string;
  books: {
    id: string;
    title: string;
    author: string | null;
    cover_url: string | null;
    page_count: number | null;
    published_date: string | null;
  } | null;
};

export type CustomShelfGroup = {
  id: string;
  name: string;
  slug: string;
  genre: string | null;
  visibility: ShelfVisibility;
  items: CustomShelfBookItem[];
};

const RESERVED_SLUGS = new Set([...SHELF_CONFIG.map((s) => s.slug), "custom"]);
const BOOK_SELECT =
  "id, shelf_id, book_id, created_at, books(id, title, author, cover_url, page_count, published_date)";

export function slugifyShelfName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "shelf";
}

function isReservedShelfSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

async function uniqueSlugForUser(userId: string, baseSlug: string): Promise<string> {
  let candidate = baseSlug;
  let suffix = 2;
  while (true) {
    if (isReservedShelfSlug(candidate)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
      continue;
    }
    const { data } = await supabase
      .from("user_shelves")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function getCustomShelfGroupsWithBooks(
  userId: string
): Promise<CustomShelfGroup[]> {
  const { data: shelves, error } = await supabase
    .from("user_shelves")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  const typedShelves = (shelves ?? []) as UserShelf[];
  if (!typedShelves.length) return [];

  const shelfIds = typedShelves.map((s) => s.id);
  const { data: memberships, error: membershipError } = await supabase
    .from("user_shelf_books")
    .select(BOOK_SELECT)
    .in("shelf_id", shelfIds)
    .order("created_at", { ascending: false });

  if (membershipError) throw membershipError;

  const byShelf = new Map<string, CustomShelfBookItem[]>();
  for (const row of memberships ?? []) {
    const item = row as unknown as CustomShelfBookItem & { shelf_id: string };
    const list = byShelf.get(item.shelf_id) ?? [];
    list.push(item);
    byShelf.set(item.shelf_id, list);
  }

  return typedShelves.map((shelf) => ({
    id: shelf.id,
    name: shelf.name,
    slug: shelf.slug,
    genre: shelf.genre,
    visibility: shelf.visibility,
    items: byShelf.get(shelf.id) ?? [],
  }));
}

export async function createCustomShelf(
  userId: string,
  input: { name: string; genre?: string | null; visibility?: ShelfVisibility }
): Promise<{ shelf?: UserShelf; error?: string }> {
  const trimmedName = input.name.trim();
  if (!trimmedName) return { error: "Shelf name is required." };
  if (trimmedName.length > 80) return { error: "Shelf name must be 80 characters or fewer." };

  const visibility = input.visibility ?? "public";
  if (!["public", "followers", "private"].includes(visibility)) {
    return { error: "Invalid shelf visibility." };
  }

  const baseSlug = slugifyShelfName(trimmedName);
  if (isReservedShelfSlug(baseSlug)) {
    return { error: "That name matches a built-in shelf. Choose a different name." };
  }

  const slug = await uniqueSlugForUser(userId, baseSlug);
  const { data, error } = await supabase
    .from("user_shelves")
    .insert({
      user_id: userId,
      name: trimmedName,
      slug,
      genre: input.genre?.trim() || null,
      visibility,
    })
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { shelf: data as UserShelf };
}

export async function updateCustomShelfVisibility(
  shelfId: string,
  visibility: ShelfVisibility
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("user_shelves")
    .update({ visibility, updated_at: new Date().toISOString() })
    .eq("id", shelfId);
  if (error) return { error: error.message };
  return {};
}

export async function listUserCustomShelves(userId: string): Promise<UserShelf[]> {
  const { data, error } = await supabase
    .from("user_shelves")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as UserShelf[];
}

export async function addBookToCustomShelf(
  shelfId: string,
  userId: string,
  bookId: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("user_shelf_books")
    .insert({ shelf_id: shelfId, user_id: userId, book_id: bookId });

  if (error) {
    if (error.code === "23505") return { error: "This book is already on that shelf." };
    return { error: error.message };
  }
  return {};
}

export async function removeBookFromCustomShelf(
  shelfId: string,
  bookId: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("user_shelf_books")
    .delete()
    .eq("shelf_id", shelfId)
    .eq("book_id", bookId);
  if (error) return { error: error.message };
  return {};
}

export async function deleteCustomShelf(shelfId: string): Promise<{ error?: string }> {
  const { error } = await supabase.from("user_shelves").delete().eq("id", shelfId);
  if (error) return { error: error.message };
  return {};
}

export async function listCustomShelfIdsForBook(
  userId: string,
  bookId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_shelf_books")
    .select("shelf_id")
    .eq("user_id", userId)
    .eq("book_id", bookId);
  if (error) throw error;
  return (data ?? []).map((row) => row.shelf_id as string);
}
