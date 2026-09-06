import { validateReadingGoal } from "@/lib/utils/profileValidation";
import { createClient } from "@/lib/supabase/client";
import { upsertYearlyReadingGoal } from "@/lib/services/yearlyGoals";

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

  const year = new Date().getFullYear();

  if (action === "clear") {
    const result = await upsertYearlyReadingGoal(user.id, year, null);
    if (result.error) return { error: "Could not clear your reading goal." };
    return { success: "Reading goal cleared.", goal: null };
  }

  const goalResult = validateReadingGoal(formData.get("goal"));
  if (!goalResult.ok) return { error: goalResult.error };

  const result = await upsertYearlyReadingGoal(user.id, year, goalResult.value);
  if (result.error) return { error: "Could not save your reading goal." };

  return {
    success: `Goal set: ${goalResult.value} books in ${year}.`,
    goal: goalResult.value,
  };
}
