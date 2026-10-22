import { createClient } from "@/lib/supabase/client";
import { toSubscriptionAccessFromRow } from "@/lib/utils/subscription";
import type { UserSubscription } from "@/types";

/**
 * Reads subscription state. Clients cannot write tier/status (RLS);
 * rows are created by the profiles trigger / service role.
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      user_id: userId,
      subscription_tier: "free",
      subscription_status: "inactive",
      subscription_provider: null,
      subscription_expires_at: null,
      stripe_customer_id: null,
      apple_original_transaction_id: null,
      created_at: "",
      updated_at: "",
    };
  }

  return data as UserSubscription;
}

export function toSubscriptionAccess(
  subscription: UserSubscription | null | undefined
): Pick<
  UserSubscription,
  "subscription_tier" | "subscription_status" | "subscription_expires_at"
> {
  return toSubscriptionAccessFromRow(subscription);
}
