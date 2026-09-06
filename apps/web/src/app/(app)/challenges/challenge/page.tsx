"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FeatureLimitModal } from "@/components/premium/FeatureLimitModal";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { layout } from "@/lib/constants/layout";
import { challengesPath } from "@/lib/routes/challenges";
import {
  getChallengeDetail,
  inviteToChallenge,
  joinChallenge,
  leaveChallenge,
  respondToChallengeInvite,
  type ChallengeDetailModel,
} from "@/lib/services/challenges/ChallengeService";
import { searchReaders } from "@/lib/services/feedSearch";
import { formatChallengeAmount, formatChallengeListeningTime } from "@bookmarked/utils/challengeDisplay";
import { checklistItemAnnouncement, challengeProgressAnnouncement } from "@bookmarked/utils/challengeDisplay";
import { visibilityLabel as challengeVisibilityLabel } from "@bookmarked/utils/challengeDisplay";
import { originBackLink } from "@bookmarked/utils/navigationOrigin";
import { ENTITLEMENT_LIMIT_MESSAGES, isEntitlementLimitError } from "@bookmarked/utils/subscription";

export default function ChallengeDetailPage() {
  const user = useAuthUser();
  const toast = useToast();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const back = originBackLink(searchParams.get("origin"), "web", {
    href: challengesPath(),
    label: "← Back to Challenges",
  });
  const [detail, setDetail] = useState<ChallengeDetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteBusy, setInviteBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setDetail(await getChallengeDetail(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void getChallengeDetail(id).then((row) => {
      if (cancelled) return;
      setDetail(row);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const progressLabel = detail?.progress
    ? challengeProgressAnnouncement({
        title: detail.challenge.title,
        current: detail.progress.current,
        target: detail.progress.target,
        unit: detail.progress.unit,
        percent: detail.progress.percent,
      })
    : "";

  if (loading) return <LoadingState message="Loading challenge…" />;
  if (!detail) {
    return (
      <div className={layout.pageStack}>
        <p className="text-text-muted">This challenge is not available.</p>
        <Link href={back.href} className="text-sm font-medium text-primary hover:underline">
          {back.label}
        </Link>
      </div>
    );
  }

  const { challenge, progress, membershipStatus, completed } = detail;
  const canLeave = membershipStatus === "active";
  const canJoin = !membershipStatus || membershipStatus === "left";

  async function onJoin() {
    setBusy(true);
    const result = await joinChallenge(challenge.id);
    setBusy(false);
    if (result.error) {
      if (isEntitlementLimitError(result.error)) {
        setLimitOpen(true);
        return;
      }
      toast.error(result.error);
      return;
    }
    toast.success("Joined challenge.");
    void load();
  }

  async function onLeave() {
    setBusy(true);
    const result = await leaveChallenge(challenge.id);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Left challenge.");
    void load();
  }

  async function onInvite() {
    if (!user || !inviteQuery.trim()) return;
    setInviteBusy("search");
    try {
      const readers = await searchReaders(inviteQuery.trim(), user.id, 5);
      const target = readers.find((row) => !row.isSelf);
      if (!target) {
        toast.error("No matching reader in Search People.");
        setInviteBusy(null);
        return;
      }
      const result = await inviteToChallenge(challenge.id, target.id);
      setInviteBusy(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Invitation sent.");
      setInviteQuery("");
      void load();
    } catch (error) {
      setInviteBusy(null);
      toast.error(error instanceof Error ? error.message : "Invite failed.");
    }
  }

  return (
    <div className={`${layout.pageStack} text-left`}>
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Reading challenges"
        limitMessage={ENTITLEMENT_LIMIT_MESSAGES.reading_challenges}
      />

      <Link href={back.href} className="text-sm font-medium text-primary hover:underline">
        {back.label}
      </Link>

      <header>
        <p className="text-xs uppercase tracking-wide text-text-muted">
          {challenge.category ?? "Challenge"} · {challengeVisibilityLabel(challenge.visibility)}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-puce-red">{challenge.title}</h1>
        {challenge.description ? (
          <p className="mt-2 text-text-muted">{challenge.description}</p>
        ) : null}
        <p className="mt-2 text-sm text-text-muted">
          {challenge.starts_at ? new Date(challenge.starts_at).toLocaleDateString() : "Open"}
          {" — "}
          {challenge.ends_at ? new Date(challenge.ends_at).toLocaleDateString() : "No end date"}
        </p>
      </header>

      {progress ? (
        <section>
          <div
            className="h-3 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress.percent)}
            aria-label={progressLabel}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="mt-2 text-sm text-text-muted">
            {formatChallengeAmount(progress.current, progress.unit)} of{" "}
            {formatChallengeAmount(progress.target, progress.unit)} · {progress.percent}%
          </p>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canJoin ? (
          <Button loading={busy} onClick={() => void onJoin()}>
            Join
          </Button>
        ) : null}
        {canLeave ? (
          <Button variant="outline" loading={busy} onClick={() => void onLeave()}>
            Leave
          </Button>
        ) : null}
        {completed ? <p className="self-center text-sm font-medium text-puce-red">Completed</p> : null}
      </div>

      {detail.objectives.length ? (
        <section>
          <h2 className="font-semibold text-puce-red">Checklist</h2>
          <ul className="mt-2 space-y-2">
            {detail.objectives.map((item) => (
              <li
                key={item.objectiveId}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                aria-label={checklistItemAnnouncement(item.title, item.completed)}
              >
                {item.completed ? "Complete" : "Incomplete"} — {item.title}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="font-semibold text-puce-red">Books that counted</h2>
        {detail.contributions.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No qualifying books yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {detail.contributions.map((row) => (
              <li key={`${row.userBookId}-${row.qualifyingDate}`} className="rounded-xl border border-border bg-surface p-3">
                <p className="font-medium">{row.bookTitle}</p>
                <p className="text-sm text-text-muted">{row.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {detail.participants.length ? (
        <section>
          <h2 className="font-semibold text-puce-red">Participants</h2>
          <p className="mt-1 text-xs text-text-muted">Progress only — no rankings.</p>
          <ul className="mt-2 space-y-2">
            {detail.participants.map((row) => (
              <li key={row.userId} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
                {row.displayName}: {row.books} books, {row.pages} pages,{" "}
                {formatChallengeListeningTime(row.listeningSeconds)} listening
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {membershipStatus === "active" || challenge.created_by === user?.id ? (
        <section>
          <h2 className="font-semibold text-puce-red">Invite a friend</h2>
          <p className="mt-1 text-sm text-text-muted">Search People you follow, then send an invite.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              className="min-w-[12rem] flex-1 rounded-xl border border-border bg-surface px-3 py-2"
              placeholder="Search People"
              value={inviteQuery}
              onChange={(event) => setInviteQuery(event.target.value)}
            />
            <Button loading={inviteBusy === "search"} onClick={() => void onInvite()}>
              Invite
            </Button>
          </div>
          {detail.invites.map((invite) => (
            <p key={invite.id} className="mt-2 text-xs text-text-muted">
              Invite {invite.status}
              {invite.status === "pending" && invite.inviteeId === user?.id ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => void respondToChallengeInvite(invite.id, true).then(() => load())}
                  >
                    Accept
                  </button>
                </>
              ) : null}
            </p>
          ))}
        </section>
      ) : null}
    </div>
  );
}
