import { createClient } from "@/lib/supabase/client";
import type { UserSubscription } from "@/types";

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  user_id: "",
  subscription_tier: "free",
  subscription_status: "inactive",
  subscription_provider: null,
  subscription_expires_at: null,
  created_at: "",
  updated_at: "",
};

function defaultSubscriptionForUser(userId: string): UserSubscription {
  return {
    ...DEFAULT_SUBSCRIPTION,
    user_id: userId,
  };
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return defaultSubscriptionForUser(userId);
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
