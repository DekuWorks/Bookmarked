import { createClient } from "@/lib/supabase/client";
import type { UserSubscription } from "@/types";

const DEFAULT_SUBSCRIPTION = {
  subscription_tier: "free" as const,
  subscription_status: "inactive" as const,
  subscription_expires_at: null as string | null,
};

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
  if (!subscription) {
    return {
      subscription_tier: DEFAULT_SUBSCRIPTION.subscription_tier,
      subscription_status: DEFAULT_SUBSCRIPTION.subscription_status,
      subscription_expires_at: DEFAULT_SUBSCRIPTION.subscription_expires_at,
    };
  }

  return {
    subscription_tier: subscription.subscription_tier,
    subscription_status: subscription.subscription_status,
    subscription_expires_at: subscription.subscription_expires_at,
  };
}
