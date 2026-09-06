"use client";

import { useMemo, useState } from "react";
import { Z_CLASS } from "@/lib/constants/zIndex";
import { cn } from "@/lib/utils/cn";
import type { ChallengeEvaluationSummary } from "@bookmarked/utils/challengeTypes";
import { ShareToFeedModal, type ShareToFeedPreview } from "@/components/social/ShareToFeedModal";
import { buildChallengeSharePostBody } from "@bookmarked/utils/feedShare";
import { formatCommunityMilestone } from "@bookmarked/utils/challengeDisplay";

type Props = {
  open: boolean;
  bookTitle: string;
  onClose: () => void;
  challengeUpdates?: ChallengeEvaluationSummary | null;
};

const SPARKLES = ["✦", "✧", "✦", "✧", "✦", "✧", "✦"];

/** Full-screen acknowledgement shown immediately after a successful completion. */
export function CompletionCelebration({
  open,
  bookTitle,
  onClose,
  challengeUpdates,
}: Props) {
  const [cursor, setCursor] = useState(0);
  const [sharePreview, setSharePreview] = useState<ShareToFeedPreview | null>(null);

  const items = useMemo(() => challengeUpdates?.items ?? [], [challengeUpdates?.items]);
  const compact = items.length > 4;
  const visibleItems = compact ? items.slice(0, 3) : items;
  const current = items[cursor] ?? null;
  const shareable = useMemo(() => {
    const firstComplete = items.find((item) => item.shareEligible);
    if (firstComplete) {
      return {
        sourceType: "challenge_complete" as const,
        sourceId: `challenge-complete:${firstComplete.challengeId}`,
        body: buildChallengeSharePostBody({
          kind: "challenge_complete",
          challengeTitle: firstComplete.title,
        }),
      };
    }
    const milestone = challengeUpdates?.communityMilestones.find((row) => row.shareEligible);
    if (milestone) {
      return {
        sourceType: "challenge_community_milestone" as const,
        sourceId: `challenge-milestone:${milestone.challengeId}:${milestone.threshold}`,
        body: buildChallengeSharePostBody({
          kind: "challenge_community_milestone",
          challengeTitle: milestone.title,
          detail: formatCommunityMilestone(milestone.threshold),
        }),
      };
    }
    const badge = challengeUpdates?.newBadges[0];
    if (badge) {
      return {
        sourceType: "challenge_badge" as const,
        sourceId: `challenge-badge:${badge.badgeKey}`,
        body: buildChallengeSharePostBody({
          kind: "challenge_badge",
          challengeTitle: badge.title,
          detail: badge.title,
        }),
      };
    }
    return null;
  }, [challengeUpdates, items]);

  if (!open) return null;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Book completed"
        className={cn(
          "completion-celebration-overlay fixed inset-0 flex items-center justify-center p-6 text-center backdrop-blur-sm",
          Z_CLASS.sheet
        )}
        onClick={onClose}
      >
        <div className="max-w-md space-y-5" onClick={(event) => event.stopPropagation()}>
          <div className="flex justify-center gap-5 text-4xl" aria-hidden>
            {SPARKLES.map((sparkle, index) => (
              <span
                key={index}
                className={cn("completion-celebration-sparkle", index % 2 ? "translate-y-3" : "")}
              >
                {sparkle}
              </span>
            ))}
          </div>
          <p className="completion-celebration-kicker text-sm font-semibold uppercase tracking-[0.2em]">
            Book complete
          </p>
          <h2 className="text-3xl font-bold">{bookTitle}</h2>
          <p className="opacity-85">Another story saved to your reading life.</p>

          {items.length > 0 ? (
            <section
              className="rounded-2xl border border-white/20 bg-black/10 p-4 text-left"
              aria-label="Challenges updated"
            >
              <p className="text-sm font-semibold">
                {items.length} Challenge{items.length === 1 ? "" : "s"} Updated
              </p>
              {current ? (
                <button
                  type="button"
                  className="mt-2 w-full text-left text-sm opacity-90"
                  onClick={() => setCursor((value) => (value + 1) % items.length)}
                >
                  {current.title}
                  {current.reasons[0] ? ` — ${current.reasons[0]}` : ""}
                  {items.length > 1 ? " · Tap for next" : ""}
                </button>
              ) : null}
              {compact ? (
                <ul className="mt-2 space-y-1 text-xs opacity-80">
                  {visibleItems.map((item) => (
                    <li key={item.challengeId}>{item.title}</li>
                  ))}
                  <li>and {items.length - visibleItems.length} more</li>
                </ul>
              ) : null}
            </section>
          ) : null}

          {shareable ? (
            <button
              type="button"
              className="completion-celebration-button rounded-full px-5 py-2.5 font-semibold"
              onClick={() => setSharePreview(shareable)}
            >
              Share to Feed
            </button>
          ) : null}

          <button
            type="button"
            className="completion-celebration-button rounded-full px-5 py-2.5 font-semibold"
            onClick={onClose}
          >
            Celebrate
          </button>
        </div>
      </div>
      <ShareToFeedModal
        open={Boolean(sharePreview)}
        preview={sharePreview}
        onClose={() => setSharePreview(null)}
      />
    </>
  );
}
