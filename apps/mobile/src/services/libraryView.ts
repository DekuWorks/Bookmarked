import { supabase } from "./supabase";
import type { LibraryViewMode } from "../types";

export type DisplayLibraryView = "bookshelf" | "grid";

export function normalizeLibraryView(raw?: LibraryViewMode | null): DisplayLibraryView {
  return raw === "grid" ? "grid" : "bookshelf";
}

export async function updatePreferredLibraryView(view: DisplayLibraryView): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_library_view: view, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) throw error;
}
