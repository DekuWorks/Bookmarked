"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FeatureLimitModal } from "@/components/premium/FeatureLimitModal";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { layout } from "@/lib/constants/layout";
import { staticRedirect } from "@/lib/navigation/staticRedirect";
import {
  joinReadingChallenge,
  listActiveChallenges,
  type ReadingChallenge,
} from "@/lib/services/readingChallenges";
import { isEntitlementLimitError } from "@/lib/utils/subscription";

export default function ChallengesPage() {
  const user = useAuthUser();
  const toast = useToast();
  const [challenges, setChallenges] = useState<ReadingChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);

  useEffect(() => {
    if (user === null) {
      staticRedirect("/login/?redirect=%2Fchallenges%2F");
    }
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await listActiveChallenges();
    setChallenges(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  async function handleJoin(challengeId: string) {
    setJoiningId(challengeId);
    const result = await joinReadingChallenge(challengeId);
    setJoiningId(null);
    if (result.error) {
      if (isEntitlementLimitError(result.error)) {
        setLimitOpen(true);
        return;
      }
      toast.error(result.error);
      return;
    }
    toast.success("Joined challenge!");
  }

  if (user === undefined || (user && loading)) {
    return <LoadingState message="Loading challenges…" />;
  }

  if (!user) return null;

  return (
    <div className={layout.pageStack}>
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Reading challenges"
        limitMessage="Free members can join 3 reading challenges per year. Upgrade to Bookmarked Plus for unlimited challenges."
      />

      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Reading challenges</h1>
        <p className="mt-1 text-text-muted">
          Free members can join up to 3 challenges per calendar year. Existing joins stay if you
          downgrade.
        </p>
      </header>

      <p>
        <Link href="/profile/" className="text-sm font-medium text-primary hover:underline">
          ← Back to profile
        </Link>
      </p>

      {challenges.length === 0 ? (
        <div className="surface-card p-5 text-sm text-text-muted">
          No active challenges yet. When challenges are published they will appear here — join limits
          are already enforced.
        </div>
      ) : (
        <ul className="space-y-3">
          {challenges.map((challenge) => (
            <li key={challenge.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <h2 className="font-semibold text-puce-red">{challenge.title}</h2>
                {challenge.description ? (
                  <p className="mt-1 text-sm text-text-muted">{challenge.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-text-muted">{challenge.year}</p>
              </div>
              <Button
                size="sm"
                loading={joiningId === challenge.id}
                onClick={() => void handleJoin(challenge.id)}
              >
                Join
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
