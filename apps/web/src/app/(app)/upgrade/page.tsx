"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { PremiumFeatureLock } from "@/components/premium/PremiumFeatureLock";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { layout } from "@/lib/constants/layout";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
import { createPremiumCheckoutSession } from "@/lib/services/stripeCheckout";

const PREMIUM_FEATURES = [
  {
    title: "Advanced analytics",
    description:
      "Reading heatmaps, pace trends, monthly breakdowns, and deeper stats on your Progress tab.",
  },
  {
    title: "AI reading insights",
    description:
      "Personalized highlights, reading patterns, and reflection prompts powered by OpenAI from your journal.",
  },
  {
    title: "Early access",
    description: "Try new community, library, and mobile features before they roll out to everyone.",
  },
  {
    title: "Support Bookmarked",
    description: "Help us build a reader-first platform without ads or data selling.",
  },
] as const;

const PREMIUM_PRICE = "$4.99 / month";

export default function UpgradePage() {
  const user = useAuthUser();
  const toast = useToast();
  const searchParams = useSearchParams();
  const { isPremium, loading, refresh } = useSubscription(user?.id);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutUnavailable, setCheckoutUnavailable] = useState(false);

  const checkoutStatus = searchParams.get("checkout");

  useEffect(() => {
    if (user === null) {
      staticRedirect("/login/?redirect=%2Fupgrade%2F");
    }
  }, [user]);

  // Poll subscription after Stripe redirect while webhook activates Premium.
  useEffect(() => {
    if (checkoutStatus !== "success" || !user) return;

    void refresh();

    const interval = window.setInterval(() => {
      void refresh();
    }, 2000);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
    }, 20000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [checkoutStatus, user, refresh]);

  const handleSubscribe = useCallback(async () => {
    if (!user) {
      const message = "Sign in to subscribe.";
      setCheckoutError(message);
      toast.error(message);
      staticRedirect("/login/?redirect=%2Fupgrade%2F");
      return;
    }

    setCheckoutError(null);
    setCheckoutLoading(true);

    try {
      const result = await createPremiumCheckoutSession();

      if (result.ok) {
        window.location.href = result.url;
        return;
      }

      if (!result.available) {
        setCheckoutUnavailable(true);
        toast.error(result.error);
        return;
      }

      setCheckoutError(result.error);
      toast.error(result.error);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start checkout. Please try again.";
      setCheckoutError(message);
      toast.error(message);
    } finally {
      setCheckoutLoading(false);
    }
  }, [toast, user]);

  if (user === undefined || (user && loading)) {
    return <LoadingState message="Loading plans…" />;
  }

  if (!user) {
    return <LoadingState message="Redirecting to sign in…" />;
  }

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Bookmarked Premium</h1>
        <p className="mx-auto mt-2 max-w-xl text-pretty text-text-muted">
          Go deeper with your reading life — richer analytics, AI-powered insights, and early access
          to what we ship next. One subscription works across web and mobile.
        </p>
      </header>

      {checkoutStatus === "success" ? (
        <section className="surface-card border-primary/30 bg-primary/10 p-4 text-center text-sm text-text-muted">
          <p className="font-medium text-puce-red">Thanks for subscribing!</p>
          <p className="mt-1">
            Your Premium access may take a moment to activate.{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => void refresh()}
            >
              Refresh status
            </button>
          </p>
        </section>
      ) : null}

      {checkoutStatus === "canceled" ? (
        <section className="surface-card p-4 text-center text-sm text-text-muted">
          Checkout was canceled. You can subscribe whenever you&apos;re ready.
        </section>
      ) : null}

      {isPremium ? (
        <section className="surface-card border-primary/30 bg-primary/10 p-6 text-center">
          <p className="text-lg font-semibold text-puce-red">You&apos;re on Premium</p>
          <p className="mt-2 text-sm text-text-muted">
            Thanks for supporting Bookmarked. Premium features are unlocked on web and mobile.
          </p>
          <ButtonLink href="/reading-room/?tab=progress" variant="outline" size="sm" className="mt-4">
            Open Reading Room
          </ButtonLink>
        </section>
      ) : (
        <section className="surface-card p-6">
          <div className="text-center">
            {checkoutUnavailable ? (
              <p className="text-sm font-medium uppercase tracking-wide text-primary">Coming soon</p>
            ) : (
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Bookmarked Premium
              </p>
            )}
            <p className="mt-2 text-3xl font-bold text-puce-red">{PREMIUM_PRICE}</p>
            <p className="mt-1 text-sm text-text-muted">Billed monthly. Cancel anytime.</p>
          </div>
          <ul className="mt-6 space-y-3">
            {PREMIUM_FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-left transition-shadow hover:shadow-sm"
              >
                <p className="font-semibold text-puce-red">{feature.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">{feature.description}</p>
              </li>
            ))}
          </ul>

          {checkoutUnavailable ? (
            <div className="mt-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-center text-sm leading-relaxed text-text-muted">
              <p className="font-medium text-puce-red">Billing is almost ready</p>
              <p className="mt-1">
                Stripe checkout (web) and App Store / Google Play subscriptions (mobile) will unlock
                Premium without another app release. Gates are already wired.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <Button
                size="lg"
                className="w-full"
                loading={checkoutLoading}
                onClick={() => void handleSubscribe()}
              >
                Subscribe with Stripe
              </Button>
              {checkoutError ? (
                <p className="text-center text-sm text-red-600">{checkoutError}</p>
              ) : (
                <p className="text-center text-xs text-text-muted">
                  Secure checkout via Stripe. Manage or cancel anytime from your Stripe customer
                  portal once billing is live.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {!isPremium ? (
        <PremiumFeatureLock
          title="Preview what Premium unlocks"
          description="Advanced analytics and AI insights are already wired behind Premium gates in your Reading Room."
          compact
        />
      ) : null}
    </div>
  );
}
