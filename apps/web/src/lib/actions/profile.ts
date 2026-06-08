"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

export async function updateYearlyReadingGoal(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
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

    revalidateGoalPaths();
    return { success: "Reading goal cleared." };
  }

  const raw = formData.get("goal");
  const goal = Number(raw);

  if (!Number.isFinite(goal) || goal < 1 || goal > 500) {
    return { error: "Enter a goal between 1 and 500 books." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ yearly_reading_goal: Math.round(goal) })
    .eq("id", user.id);

  if (error) return { error: "Could not save your reading goal." };

  revalidateGoalPaths();
  return { success: `Goal set: ${Math.round(goal)} books in ${new Date().getFullYear()}.` };
}

function revalidateGoalPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/reading-room");
  revalidatePath("/profile");
}
