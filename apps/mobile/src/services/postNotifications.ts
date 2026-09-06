import { supabase } from "./supabase";

export async function getPostNotificationPreference(
  subscriberId: string,
  creatorId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("post_notification_preferences")
    .select("enabled")
    .eq("subscriber_id", subscriberId)
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data?.enabled);
}

export async function setPostNotificationPreference(
  subscriberId: string,
  creatorId: string,
  enabled: boolean
): Promise<{ error?: string }> {
  const { error } = await supabase.from("post_notification_preferences").upsert(
    {
      subscriber_id: subscriberId,
      creator_id: creatorId,
      enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "subscriber_id,creator_id" }
  );
  if (error) return { error: error.message };
  return {};
}
