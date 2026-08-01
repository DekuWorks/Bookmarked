import { useQuery } from "@tanstack/react-query";
import { getUserSubscription, toSubscriptionAccess } from "../services/subscription";
import { canAccessFeature, isPremiumSubscriber } from "../utils/subscription";
import { useAuthStore } from "../store/authStore";
import type { FeatureKey, PremiumFeature } from "../types";

export function useSubscription() {
  const userId = useAuthStore((s) => s.user?.id);

  const query = useQuery({
    queryKey: ["subscription", userId],
    queryFn: () => getUserSubscription(userId as string),
    enabled: Boolean(userId),
  });

  const access = toSubscriptionAccess(query.data ?? null);

  return {
    subscription: query.data ?? null,
    loading: query.isLoading,
    isPremium: isPremiumSubscriber(access),
    canAccess: (feature: FeatureKey | PremiumFeature) => canAccessFeature(feature, access),
    refetch: query.refetch,
  };
}
