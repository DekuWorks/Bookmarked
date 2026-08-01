"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserSubscription, toSubscriptionAccess } from "@/lib/services/subscription";
import { canAccessFeature, isPremiumSubscriber } from "@/lib/utils/subscription";
import type { FeatureKey, PremiumFeature, UserSubscription } from "@/types";

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const row = await getUserSubscription(userId);
      setSubscription(row);
    } catch (error) {
      console.error("[subscription] refresh failed:", error);
      setSubscription(null);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void getUserSubscription(userId)
      .then((row) => {
        if (!cancelled) setSubscription(row);
      })
      .catch((error) => {
        console.error("[subscription] load failed:", error);
        if (!cancelled) setSubscription(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const access = toSubscriptionAccess(subscription);

  return {
    subscription,
    loading,
    isPremium: isPremiumSubscriber(access),
    canAccess: (feature: FeatureKey | PremiumFeature) => canAccessFeature(feature, access),
    refresh,
  };
}
