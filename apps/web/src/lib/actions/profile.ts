import { createClient } from "@/lib/supabase/client";

export type ProfileActionState = {
  error?: string;
  success?: string;
  /** Saved target after a successful set; null after clear. */
  goal?: number | null;
};

export async function updateYearlyReadingGoal(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const action = String(formData.get("action") ?? "set");

  if (action === "clear") {
    const { error } = await supabase
      .from("profiles")
      .update({ yearly_reading_goal: null })
      .eq("id", user.id);

    if (error) return { error: "Could not clear your reading goal." };

    return { success: "Reading goal cleared.", goal: null };
  }

  const raw = formData.get("goal");
  const goal = Number(raw);

  if (!Number.isFinite(goal) || goal < 1 || goal > 500) {
    return { error: "Enter a whole number between 1 and 500 books." };
  }

  const rounded = Math.round(goal);
  if (Math.abs(goal - rounded) > 1e-9) {
    return { error: "Enter a whole number between 1 and 500 books." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ yearly_reading_goal: rounded })
    .eq("id", user.id);

  if (error) return { error: "Could not save your reading goal." };

  return {
    success: `Goal set: ${rounded} books in ${new Date().getFullYear()}.`,
    goal: rounded,
  };
}
