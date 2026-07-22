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
    description: "Reading heatmaps, pace trends, and deeper stats in your Reading Room.",
  },
  {
    title: "AI reading insights",
    description: "Personalized recommendations and reflection prompts based on your journal.",
  },
  {
    title: "Early access",
    description: "Try new community and library features before they roll out to everyone.",
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
          Go deeper with your reading life — analytics, insights, and early access to what&apos;s
          next.
        </p>
      </header>

      {isPremium ? (
        <section className="rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-puce-red">You&apos;re on Premium</p>
          <p className="mt-2 text-sm text-text-muted">
            Thanks for supporting Bookmarked. Premium features are unlocked on your account.
          </p>
          <ButtonLink href="/reading-room/?tab=progress" variant="outline" size="sm" className="mt-4">
            Open Reading Room
          </ButtonLink>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Coming soon</p>
            <p className="mt-2 text-3xl font-bold text-puce-red">$4.99 / month</p>
            <p className="mt-1 text-sm text-text-muted">Billed monthly. Cancel anytime.</p>
          </div>
          <ul className="mt-6 space-y-4">
            {PREMIUM_FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-left"
              >
                <p className="font-semibold text-puce-red">{feature.title}</p>
                <p className="mt-1 text-sm text-text-muted">{feature.description}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-sm text-text-muted">
            Payment integration is not live yet. Premium gates are in place so we can launch billing
            without another app release.
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
