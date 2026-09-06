"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { IosSubscribePanel } from "@/components/challenges/IosSubscribePanel";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { PlusBadge } from "@/components/premium/PlusBadge";
import { PremiumFeatureList } from "@/components/premium/PremiumFeatureList";
import { PremiumFeatureLock } from "@/components/premium/PremiumFeatureLock";
import { SubscriptionComparison } from "@/components/premium/SubscriptionComparison";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useSubscriptionActivationPoll } from "@/lib/hooks/useSubscriptionActivationPoll";
import { layout } from "@/lib/constants/layout";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
import { createBillingPortalSession } from "@/lib/services/stripePortal";

function clearCheckoutQueryParam(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("checkout");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export default function UpgradePage() {
  const user = useAuthUser();
  const toast = useToast();
  const searchParams = useSearchParams();
  const { subscription, isPremium, loading, refresh } = useSubscription(user?.id);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const checkoutStatus = searchParams.get("checkout");
  const checkoutSucceeded = checkoutStatus === "success";

  const { activating, timedOut } = useSubscriptionActivationPoll({
    enabled: checkoutSucceeded && Boolean(user),
    isPremium,
    refresh,
    onActivated: () => {
      toast.success("Bookmarked Plus is active — enjoy your new features!");
      clearCheckoutQueryParam();
    },
  });

  const optimisticSubscribed = checkoutSucceeded && timedOut && !isPremium;
  const showSubscribedUI = isPremium || optimisticSubscribed;
  const awaitingActivation = checkoutSucceeded && !showSubscribedUI;

  useEffect(() => {
    if (user === null) {
      staticRedirect("/login/?redirect=%2Fupgrade%2F");
    }
  }, [user]);

  useEffect(() => {
    if (checkoutStatus === "success" && isPremium) {
      clearCheckoutQueryParam();
    }
  }, [checkoutStatus, isPremium]);

  const handleManageSubscription = useCallback(async () => {
    setPortalError(null);
    setPortalLoading(true);

    try {
      const result = await createBillingPortalSession("/upgrade/");
      if (result.ok) {
        window.location.href = result.url;
        return;
      }

      setPortalError(result.error);
      toast.error(result.error);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not open billing portal. Please try again.";
      setPortalError(message);
      toast.error(message);
    } finally {
      setPortalLoading(false);
    }
  }, [toast]);

  if (user === undefined || (user && loading && !awaitingActivation)) {
    return <LoadingState message="Loading plans…" />;
  }

  if (!user) {
    return <LoadingState message="Redirecting to sign in…" />;
  }

  const showStripeManage =
    subscription?.subscription_provider === "stripe" && Boolean(subscription.stripe_customer_id);
  const showPricing = !showSubscribedUI && !awaitingActivation;

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Bookmarked Membership</h1>
        <p className="mx-auto mt-2 max-w-xl text-pretty text-text-muted">
          Free keeps the essentials. Bookmarked Plus is reading intelligence. Bookmarked Home is
          real-world community, local discovery, experiences, identity, and concierge — not more
          analytics. Subscribe in the iOS app; web unlocks automatically.
        </p>
      </header>

      {awaitingActivation && activating ? (
        <section className="surface-card border-primary/30 bg-primary/10 p-4 text-center text-sm text-text-muted">
          <p className="font-medium text-puce-red">Activating Bookmarked Plus…</p>
          <p className="mt-1">
            Thanks for subscribing! We&apos;re unlocking your benefits now — this usually takes just
            a few seconds.
          </p>
        </section>
      ) : null}

      {showSubscribedUI ? (
        <section className="surface-card overflow-hidden border-primary/30 bg-primary/10 p-4 sm:p-6">
          <div className="text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Bookmarked Plus
              </p>
              <PlusBadge compact />
            </div>
            <p className="mt-3 text-lg font-semibold text-puce-red">You&apos;re subscribed</p>
            <p className="mt-2 text-sm text-text-muted">
              {optimisticSubscribed
                ? "Payment received — your Premium benefits are unlocking and will sync across web and mobile shortly."
                : "Thanks for supporting Bookmarked. Your paid membership features are unlocked on web and mobile."}
            </p>
          </div>

          <PremiumFeatureList />

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <ButtonLink href="/reading-room/?tab=progress" variant="outline" size="sm">
              Open Reading Room
            </ButtonLink>
            {showStripeManage ? (
              <Button
                variant="secondary"
                size="sm"
                loading={portalLoading}
                onClick={() => void handleManageSubscription()}
              >
                Manage subscription
              </Button>
            ) : null}
          </div>
          {portalError ? <p className="mt-3 text-center text-sm text-red-600">{portalError}</p> : null}
          {!showStripeManage && subscription?.subscription_provider === "apple" ? (
            <p className="mt-3 text-center text-xs text-text-muted">
              Manage or cancel in iOS Settings → Subscriptions.
            </p>
          ) : null}
        </section>
      ) : showPricing ? (
        <section className="surface-card overflow-hidden p-4 sm:p-6">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">
              Bookmarked Plus
            </p>
            <p className="mt-2 text-lg font-semibold text-puce-red">Subscribe in the iOS app</p>
            <p className="mt-2 text-sm text-text-muted">
              Plus: $5.99/month or $59.99/year. Home: $9.99/month or $99.99/year (about $8.33/month;
              save $19.89, ~16.6%). Membership then unlocks here on the same account — no second
              purchase and no web checkout.
            </p>
          </div>

          <div className="mt-6">
            <SubscriptionComparison />
          </div>

          <PremiumFeatureList />

          <div className="mt-6">
            <IosSubscribePanel title="How to get Plus" />
          </div>
        </section>
      ) : null}

      {!showSubscribedUI && !awaitingActivation ? (
        <PremiumFeatureLock
          title="Preview membership benefits"
          description="Plus unlocks reading intelligence and a full Reading DNA dashboard; Home adds maps and reader matching. Subscribe in the iOS app — web unlocks automatically."
          compact
          showCta={false}
        />
      ) : null}
    </div>
  );
}
