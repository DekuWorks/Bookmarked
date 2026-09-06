"use client";

import Link from "next/link";
import {
  challengeProgressAnnouncement,
  formatChallengeAmount,
  timeRemainingLabel,
} from "@bookmarked/utils/challengeDisplay";
import { challengeDetailPath } from "@/lib/routes/challenges";
import type { ChallengeCardModel } from "@/lib/services/challenges/ChallengeService";

type Props = {
  card: ChallengeCardModel;
  origin?: string;
};

export function ChallengeCard({ card, origin = "challenges" }: Props) {
  const { challenge, progress, completed, objectivePreview } = card;
  const remaining = completed ? null : timeRemainingLabel(challenge.ends_at);
  const percent = progress?.percent ?? 0;
  const progressLabel = progress
    ? challengeProgressAnnouncement({
        title: challenge.title,
        current: progress.current,
        target: progress.target,
        unit: progress.unit,
        percent,
      })
    : `${challenge.title}, not joined yet`;

  return (
    <article className="surface-card flex h-full flex-col p-4 text-left">
      {challenge.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={challenge.cover_url}
          alt=""
          className="mb-3 h-28 w-full rounded-xl object-cover"
        />
      ) : (
        <div
          className="mb-3 flex h-28 items-center justify-center rounded-xl bg-primary/15 text-sm font-medium text-puce-red"
          aria-hidden
        >
          {challenge.category ?? "Challenge"}
        </div>
      )}
      <h3 className="font-semibold text-puce-red">{challenge.title}</h3>
      {progress ? (
        <div className="mt-2">
          <div
            className="h-2 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
            aria-label={progressLabel}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {formatChallengeAmount(progress.current, progress.unit)} of{" "}
            {formatChallengeAmount(progress.target, progress.unit)} · {percent}%
          </p>
        </div>
      ) : challenge.goal_amount > 0 ? (
        <p className="mt-2 text-xs text-text-muted">
          Goal: {formatChallengeAmount(challenge.goal_amount, challenge.community_unit)}
        </p>
      ) : null}
      {objectivePreview.length ? (
        <ul className="mt-2 space-y-0.5 text-xs text-text-muted">
          {objectivePreview.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {completed ? (
          <span className="text-xs font-medium text-puce-red">Completed</span>
        ) : remaining ? (
          <span className="text-xs text-text-muted">{remaining}</span>
        ) : (
          <span />
        )}
        <Link
          href={challengeDetailPath(challenge.id, { origin })}
          className="text-sm font-medium text-primary hover:underline"
        >
          View
        </Link>
      </div>
    </article>
  );
}
