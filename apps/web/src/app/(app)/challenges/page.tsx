"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FeatureLimitModal } from "@/components/premium/FeatureLimitModal";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { IosSubscribePanel } from "@/components/challenges/IosSubscribePanel";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { layout } from "@/lib/constants/layout";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
import { challengeCreatePath } from "@/lib/routes/challenges";
import {
  listChallengeCatalog,
  type ChallengeCardModel,
} from "@/lib/services/challenges/ChallengeService";
import { originBackLink } from "@bookmarked/utils/navigationOrigin";
import { useSearchParams } from "next/navigation";

export default function ChallengesPage() {
  const user = useAuthUser();
  const { isPremium } = useSubscription(user?.id);
  const searchParams = useSearchParams();
  const back = originBackLink(searchParams.get("origin"), "web", {
    href: "/profile/",
    label: "← Back to Profile",
  });
  const [catalog, setCatalog] = useState<{
    featured: ChallengeCardModel[];
    yours: ChallengeCardModel[];
    completed: ChallengeCardModel[];
  } | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);

  useEffect(() => {
    if (user === null) staticRedirect("/login/?redirect=%2Fchallenges%2F");
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void listChallengeCatalog().then((rows) => {
      if (!cancelled) setCatalog(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (user === undefined || (user && !catalog)) {
    return <LoadingState message="Loading challenges…" />;
  }
  if (!user || !catalog) return null;

  const canCreate = isPremium;

  return (
    <div className={layout.pageStack}>
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Create a challenge"
        limitMessage="Creating reading challenges is a Bookmarked Plus feature. Subscribe in the iOS app."
      />

      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Challenges</h1>
        <p className="mt-1 text-text-muted">
          Featured reads, the challenges you joined, and the ones you have finished.
        </p>
      </header>

      <p>
        <Link href={back.href} className="text-sm font-medium text-primary hover:underline">
          {back.label}
        </Link>
      </p>

      <div className="flex justify-center">
        {canCreate ? (
          <Link
            href={challengeCreatePath("challenges")}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
          >
            Create Challenge
          </Link>
        ) : (
          <button
            type="button"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
            onClick={() => setLimitOpen(true)}
          >
            Create Challenge
          </button>
        )}
      </div>

      {!canCreate ? <IosSubscribePanel title="Want to design your own?" /> : null}

      <ChallengeSection
        title="Featured"
        empty="No featured challenges right now."
        cards={catalog.featured}
      />
      <ChallengeSection
        title="Your Challenges"
        empty="You have not joined a challenge yet."
        cards={catalog.yours}
      />
      <ChallengeSection
        title="Completed"
        empty="Finished challenges will land here."
        cards={catalog.completed}
      />
    </div>
  );
}

function ChallengeSection({
  title,
  empty,
  cards,
}: {
  title: string;
  empty: string;
  cards: ChallengeCardModel[];
}) {
  return (
    <section className="text-left">
      <h2 className="text-xl font-semibold text-puce-red">{title}</h2>
      {cards.length === 0 ? (
        <p className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">
          {empty}
        </p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <li key={card.challenge.id}>
              <ChallengeCard card={card} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
