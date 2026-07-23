"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { PremiumFeatureLock } from "@/components/premium/PremiumFeatureLock";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { layout } from "@/lib/constants/layout";

const PREMIUM_FEATURES = [
  {
    title: "Advanced analytics",
    description:
      "Reading heatmaps, pace trends, monthly breakdowns, and deeper stats on your Progress tab.",
  },
  {
    title: "AI reading insights",
    description:
      "Personalized recommendations, reflection prompts, and pattern summaries from your trail.",
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

export default function UpgradePage() {
  const user = useAuthUser();
  const { isPremium, loading } = useSubscription(user?.id);

  if (user === undefined || (user && loading)) {
    return <LoadingState message="Loading plans…" />;
  }

  if (!user) return null;

  return (
    <div className={layout.pageStack}>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Bookmarked Premium</h1>
        <p className="mx-auto mt-2 max-w-xl text-pretty text-text-muted">
          Go deeper with your reading life — richer analytics, AI-powered insights, and early access
          to what we ship next. One subscription works across web and mobile.
        </p>
      </header>

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
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Coming soon</p>
            <p className="mt-2 text-3xl font-bold text-puce-red">$4.99 / month</p>
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
          <p className="mt-6 text-center text-sm leading-relaxed text-text-muted">
            Stripe checkout (web) and App Store / Google Play subscriptions (mobile) are not live
            yet. Premium gates are already wired so we can turn on billing without another release.
          </p>
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
