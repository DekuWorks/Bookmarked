"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserSubscription, toSubscriptionAccess } from "@/lib/services/subscription";
import { canAccessFeature, isPremiumSubscriber } from "@/lib/utils/subscription";
import type { PremiumFeature, UserSubscription } from "@/types";

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  const refresh = useCallback(async () => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const row = await getUserSubscription(userId);
      setSubscription(row);
    } catch (error) {
      console.error("[subscription] refresh failed:", error);
      setSubscription(null);
    } finally {
      setLoading(false);
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
    canAccess: (feature: PremiumFeature) => canAccessFeature(feature, access),
    refresh,
  };
}
