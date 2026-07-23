import { useCallback, useEffect, useState } from "react";
import type { ProductSubscription } from "expo-iap";
import { finishTransaction } from "expo-iap";
import {
  attachIapListeners,
  connectIapStore,
  disconnectIapStore,
  isNativeIapSupported,
  loadPremiumSubscriptionProduct,
  purchasePremiumSubscription,
  restorePremiumPurchases,
  verifyApplePurchaseOnServer,
} from "../services/appleIap";
import { useAuthStore } from "../store/authStore";
import { useSubscription } from "./useSubscription";

export function useAppleIap() {
  const userId = useAuthStore((s) => s.user?.id);
  const { refetch } = useSubscription();
  const [product, setProduct] = useState<ProductSubscription | null>(null);
  const [loading, setLoading] = useState(isNativeIapSupported());
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const loadProduct = useCallback(async () => {
    if (!isNativeIapSupported()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await connectIapStore();
      const loaded = await loadPremiumSubscriptionProduct();
      setProduct(loaded);
      setUnavailable(!loaded);
    } catch (err) {
      setUnavailable(true);
      setError(err instanceof Error ? err.message : "Could not load App Store products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProduct();
    return () => {
      void disconnectIapStore();
    };
  }, [loadProduct]);

  useEffect(() => {
    if (!isNativeIapSupported()) return;

    return attachIapListeners({
      onError: (message) => {
        setPurchasing(false);
        setError(message);
      },
      onSuccess: async (purchase) => {
        setPurchasing(true);
        setError(null);
        try {
          const result = await verifyApplePurchaseOnServer(purchase);
          if (!result.ok) {
            if (result.unavailable) setUnavailable(true);
            setError(result.error);
            return;
          }
          await finishTransaction({ purchase, isConsumable: false });
          await refetch();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not complete purchase.");
        } finally {
          setPurchasing(false);
        }
      },
    });
  }, [refetch]);

  const subscribe = useCallback(async () => {
    setError(null);
    setPurchasing(true);
    try {
      await purchasePremiumSubscription(userId);
    } catch (err) {
      setPurchasing(false);
      setError(err instanceof Error ? err.message : "Could not start purchase.");
    }
  }, [userId]);

  const restore = useCallback(async () => {
    setError(null);
    setRestoring(true);
    try {
      const result = await restorePremiumPurchases();
      if (!result.ok) {
        if (result.unavailable) setUnavailable(true);
        setError(result.error);
        return;
      }
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore purchases.");
    } finally {
      setRestoring(false);
    }
  }, [refetch]);

  return {
    supported: isNativeIapSupported(),
    product,
    loading,
    purchasing,
    restoring,
    error,
    unavailable,
    subscribe,
    restore,
    reload: loadProduct,
  };
}
