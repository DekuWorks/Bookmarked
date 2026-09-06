import { createClient } from "@/lib/supabase/client";
import { SHELF_CONFIG } from "@/lib/constants/shelves";
import {
  DEFAULT_CUSTOM_SHELF_ICON_KEY,
  parseCustomShelfIconWrite,
  resolveCustomShelfIconKey,
} from "@bookmarked/utils/shelfIcons";
import {
  ENTITLEMENT_LIMIT_MESSAGES,
  canCreateCustomShelf,
  toSubscriptionAccessFromRow,
} from "@/lib/utils/subscription";
import type { ShelfVisibility, UserShelf } from "@/types";

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
  icon_key: string | null;
  items: CustomShelfBookItem[];
};

const RESERVED_SLUGS = new Set([
  ...SHELF_CONFIG.map((s) => s.slug),
  "custom",
]);

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

export function isReservedShelfSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

async function uniqueSlugForUser(userId: string, baseSlug: string): Promise<string> {
  const supabase = createClient();
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

export async function listUserCustomShelves(userId: string): Promise<UserShelf[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_shelves")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as UserShelf[];
}

export async function getCustomShelfGroupsWithBooks(
  userId: string
): Promise<CustomShelfGroup[]> {
  const shelves = await listUserCustomShelves(userId);
  if (shelves.length === 0) return [];

  const supabase = createClient();
  const shelfIds = shelves.map((s) => s.id);
  const { data: memberships, error } = await supabase
    .from("user_shelf_books")
    .select(BOOK_SELECT)
    .in("shelf_id", shelfIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const byShelf = new Map<string, CustomShelfBookItem[]>();
  for (const row of memberships ?? []) {
    const item = row as unknown as CustomShelfBookItem & { shelf_id: string };
    const list = byShelf.get(item.shelf_id) ?? [];
    list.push(item);
    byShelf.set(item.shelf_id, list);
  }

  return shelves.map((shelf) => ({
    id: shelf.id,
    name: shelf.name,
    slug: shelf.slug,
    genre: shelf.genre,
    visibility: shelf.visibility,
    icon_key: shelf.icon_key,
    items: byShelf.get(shelf.id) ?? [],
  }));
}

export async function getCustomShelfBySlug(
  userId: string,
  slug: string
): Promise<CustomShelfGroup | null> {
  const supabase = createClient();
  const { data: shelf, error } = await supabase
    .from("user_shelves")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!shelf) return null;

  const { data: items, error: itemsError } = await supabase
    .from("user_shelf_books")
    .select(BOOK_SELECT)
    .eq("shelf_id", shelf.id)
    .order("created_at", { ascending: false });

  if (itemsError) throw itemsError;

  const typedShelf = shelf as UserShelf;
  return {
    id: typedShelf.id,
    name: typedShelf.name,
    slug: typedShelf.slug,
    genre: typedShelf.genre,
    visibility: typedShelf.visibility,
    icon_key: typedShelf.icon_key,
    items: (items ?? []) as unknown as CustomShelfBookItem[],
  };
}

export type CustomShelfInput = {
  name: string;
  genre?: string | null;
  visibility?: ShelfVisibility;
  icon_key?: string | null;
};

export type ValidatedCustomShelfInput = {
  name: string;
  genre: string | null;
  visibility: ShelfVisibility;
  icon_key: string;
};

const VALID_VISIBILITIES = new Set<ShelfVisibility>(["public", "followers", "private"]);

export function validateCustomShelfInput(
  input: CustomShelfInput
): { ok: true; value: ValidatedCustomShelfInput } | { ok: false; error: string } {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return { ok: false, error: "Shelf name is required." };
  }
  if (trimmedName.length > 80) {
    return { ok: false, error: "Shelf name must be 80 characters or fewer." };
  }

  const genre = input.genre?.trim() || null;
  if (genre && genre.length > 80) {
    return { ok: false, error: "Genre must be 80 characters or fewer." };
  }

  const visibility = input.visibility ?? "public";
  if (!VALID_VISIBILITIES.has(visibility)) {
    return { ok: false, error: "Invalid shelf visibility." };
  }

  const iconParsed = parseCustomShelfIconWrite(
    input.icon_key === undefined ? DEFAULT_CUSTOM_SHELF_ICON_KEY : input.icon_key
  );
  if (!iconParsed.ok) {
    return { ok: false, error: iconParsed.error };
  }

  const baseSlug = slugifyShelfName(trimmedName);
  if (isReservedShelfSlug(baseSlug)) {
    return {
      ok: false,
      error: "That name matches a built-in shelf. Choose a different name.",
    };
  }

  return {
    ok: true,
    value: { name: trimmedName, genre, visibility, icon_key: iconParsed.value },
  };
}

export type CreateCustomShelfOptions = {
  bookIds?: string[];
};

export async function createCustomShelf(
  userId: string,
  input: CustomShelfInput,
  options?: CreateCustomShelfOptions
): Promise<{ shelf?: UserShelf; error?: string; booksAdded?: number }> {
  const validated = validateCustomShelfInput(input);
  if (!validated.ok) {
    return { error: validated.error };
  }

  const { name: trimmedName, genre, visibility, icon_key } = validated.value;

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to create a shelf." };
  }

  if (user.id !== userId) {
    return { error: "Session mismatch. Please refresh and try again." };
  }

  const [{ count: shelfCount, error: countError }, { data: subscription }] = await Promise.all([
    supabase
      .from("user_shelves")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("user_subscriptions")
      .select("subscription_tier, subscription_status, subscription_expires_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (countError) {
    return { error: countError.message };
  }

  if (!canCreateCustomShelf(shelfCount ?? 0, toSubscriptionAccessFromRow(subscription))) {
    return { error: ENTITLEMENT_LIMIT_MESSAGES.custom_shelves };
  }

  const baseSlug = slugifyShelfName(trimmedName);
  const slug = await uniqueSlugForUser(user.id, baseSlug);

  const { data, error } = await supabase
    .from("user_shelves")
    .insert({
      user_id: user.id,
      name: trimmedName,
      slug,
      genre,
      visibility,
      icon_key,
    })
    .select("*")
    .single();

  if (error) {
    return { error: error.message };
  }

  const shelf = data as UserShelf;
  const uniqueBookIds = [...new Set(options?.bookIds ?? [])];
  let booksAdded = 0;

  for (const bookId of uniqueBookIds) {
    const addResult = await addBookToCustomShelf(shelf.id, user.id, bookId);
    if (!addResult.error) {
      booksAdded += 1;
    }
  }

  return { shelf, booksAdded };
}

export async function updateCustomShelfVisibility(
  shelfId: string,
  visibility: ShelfVisibility
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_shelves")
    .update({ visibility, updated_at: new Date().toISOString() })
    .eq("id", shelfId);

  if (error) return { error: error.message };
  return {};
}

export async function updateCustomShelf(
  shelfId: string,
  input: CustomShelfInput
): Promise<{ shelf?: UserShelf; error?: string }> {
  const validated = validateCustomShelfInput(input);
  if (!validated.ok) {
    return { error: validated.error };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_shelves")
    .update({
      name: validated.value.name,
      genre: validated.value.genre,
      visibility: validated.value.visibility,
      icon_key: validated.value.icon_key,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shelfId)
    .select("*")
    .single();

  if (error) return { error: error.message };
  return { shelf: data as UserShelf };
}

export function customShelfIconKey(shelf: { icon_key?: string | null }): string {
  return resolveCustomShelfIconKey(shelf.icon_key);
}

export async function addBookToCustomShelf(
  shelfId: string,
  userId: string,
  bookId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("user_shelf_books").insert({
    shelf_id: shelfId,
    user_id: userId,
    book_id: bookId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This book is already on that shelf." };
    }
    return { error: error.message };
  }

  return {};
}

export async function removeBookFromCustomShelf(
  shelfId: string,
  bookId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_shelf_books")
    .delete()
    .eq("shelf_id", shelfId)
    .eq("book_id", bookId);

  if (error) return { error: error.message };
  return {};
}

/** Removes this shelf's associations only; books and other shelf memberships remain. */
export async function clearCustomShelf(shelfId: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("user_shelf_books").delete().eq("shelf_id", shelfId);

  if (error) return { error: error.message };
  return {};
}

export async function deleteCustomShelf(
  shelfId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("user_shelves").delete().eq("id", shelfId);

  if (error) return { error: error.message };
  return {};
}

export async function listCustomShelfIdsForBook(
  userId: string,
  bookId: string
): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_shelf_books")
    .select("shelf_id")
    .eq("user_id", userId)
    .eq("book_id", bookId);

  if (error) throw error;
  return (data ?? []).map((row) => row.shelf_id as string);
}
