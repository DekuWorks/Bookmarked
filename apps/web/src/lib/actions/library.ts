import { createClient } from "@/lib/supabase/client";
import type { LibraryViewMode } from "@/types";

export async function updatePreferredLibraryView(view: LibraryViewMode): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("profiles")
    .update({ preferred_library_view: view, updated_at: new Date().toISOString() })
    .eq("id", user.id);
}
