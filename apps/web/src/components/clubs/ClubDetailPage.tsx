"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { CircleAvatarUpload } from "@/components/ui/CircleAvatarUpload";
import { FeatureLimitModal } from "@/components/premium/FeatureLimitModal";
import { ClubOverviewPanel } from "@/components/clubs/ClubOverviewPanel";
import { ClubDiscussionsPanel } from "@/components/clubs/ClubDiscussionsPanel";
import { ClubSchedulePanel } from "@/components/clubs/ClubSchedulePanel";
import { ClubBookshelfPanel } from "@/components/clubs/ClubBookshelfPanel";
import { ClubMembersPanel } from "@/components/clubs/ClubMembersPanel";
import { ClubStatsPanel } from "@/components/clubs/ClubStatsPanel";
import { ClubInviteModal } from "@/components/clubs/ClubInviteModal";
import { ClubSettingsModal } from "@/components/clubs/ClubSettingsModal";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { isEntitlementLimitError } from "@/lib/utils/subscription";
import {
  deleteClub,
  ensureClubGroupConversation,
  getClub,
  joinClub,
  leaveClub,
  requestToJoin,
  shareClubToFeed,
} from "@/lib/services/bookClubs";
import { removeClubAvatar, uploadClubAvatar } from "@/lib/services/entityAvatar";
import { clubDetailPath, clubsPath } from "@/lib/routes/clubs";
import { messageThreadPath } from "@/lib/routes/messages";
import { absoluteAppUrl, copyTextToClipboard } from "@/lib/utils/copyLink";
import {
  canEditClub,
  canManageMembers,
  canSelfJoin,
  canShareClubToFeed,
  requiresJoinRequest,
  roleLabel,
  visibilityLabel,
} from "@bookmarked/utils/clubPermissions";
import type { BookClubWithDetails } from "@/types";
import { cn } from "@/lib/utils/cn";

const TABS = [
  ["overview", "Overview"],
  ["discussions", "Discussions"],
  ["schedule", "Schedule"],
  ["bookshelf", "Bookshelf"],
  ["members", "Members"],
  ["stats", "Stats"],
] as const;

type ClubTab = (typeof TABS)[number][0];

function parseTab(value: string | null): ClubTab {
  if (
    value === "overview" ||
    value === "discussions" ||
    value === "schedule" ||
    value === "bookshelf" ||
    value === "members" ||
    value === "stats"
  ) {
    return value;
  }
  return "overview";
}

function ClubDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const clubId = searchParams.get("id")?.trim() ?? "";
  const discussionParam = searchParams.get("discussion")?.trim() ?? null;
  const user = useAuthUser();

  const [club, setClub] = useState<BookClubWithDetails | null | undefined>(undefined);
  const [actionPending, setActionPending] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ClubTab>(() => parseTab(searchParams.get("tab")));

  const loadClub = useCallback(async () => {
    if (!clubId || !user) return;
    const detail = await getClub(clubId, user.id);
    setClub(detail);
  }, [clubId, user]);

  useEffect(() => {
    if (!clubId) {
      setClub(null);
      return;
    }
    if (!user) return;
    void loadClub().catch((err) => {
      console.error("[club] load failed:", err);
      setClub(null);
    });
  }, [clubId, user, loadClub]);

  useEffect(() => {
    setActiveTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  function setTab(tab: ClubTab) {
    setActiveTab(tab);
    setOverflowOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    if (tab !== "discussions") params.delete("discussion");
    router.replace(`/clubs/club/?${params.toString()}`, { scroll: false });
  }

  async function handleJoin() {
    setActionPending(true);
    const result = await joinClub(clubId);
    setActionPending(false);
    if (result.error) {
      if (isEntitlementLimitError(result.error)) {
        setLimitOpen(true);
        return;
      }
      toast.error(result.error);
      return;
    }
    toast.success("You joined the club!");
    void loadClub();
  }

  async function handleRequestJoin() {
    setActionPending(true);
    const result = await requestToJoin(clubId);
    setActionPending(false);
    if (result.error) {
      if (isEntitlementLimitError(result.error)) {
        setLimitOpen(true);
        return;
      }
      toast.error(result.error);
      return;
    }
    toast.success("Join request sent.");
    void loadClub();
  }

  async function handleLeave() {
    if (!window.confirm("Leave this club?")) return;
    setActionPending(true);
    const result = await leaveClub(clubId);
    setActionPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("You left the club.");
    void loadClub();
  }

  async function handleDeleteClub() {
    if (!window.confirm("Delete this club? This can't be undone.")) return;
    setActionPending(true);
    const result = await deleteClub(clubId);
    setActionPending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Club deleted.");
    router.push(clubsPath());
  }

  async function handleMessageClub() {
    setActionPending(true);
    const result = await ensureClubGroupConversation(clubId);
    setActionPending(false);
    if (result.error || !result.conversationId) {
      toast.error(result.error ?? "Could not open club messages.");
      return;
    }
    router.push(messageThreadPath(result.conversationId));
  }

  async function handleShare() {
    if (!club) return;
    const path = clubDetailPath(club.id);
    const url = absoluteAppUrl(path);
    const copied = await copyTextToClipboard(url);
    if (copied) toast.success("Link copied.");
    else toast.error("Could not copy link.");

    if (canShareClubToFeed(club.visibility) && club.viewer_is_member) {
      const result = await shareClubToFeed(club.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Shared to your feed.");
    }
  }

  const memberIds = useMemo(
    () => (club?.members ?? []).map((member) => member.user_id),
    [club?.members]
  );

  if (!clubId) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-text-muted">No club selected.</p>
        <ButtonLink href={clubsPath()} variant="primary">
          Browse book clubs
        </ButtonLink>
      </div>
    );
  }

  if (user === undefined || club === undefined) {
    return <LoadingState message="Loading club…" />;
  }

  if (!user) return null;

  if (!club) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <h1 className="text-2xl font-bold text-puce-red">Club not found</h1>
        <p className="text-text-muted">This club may be private or no longer exists.</p>
        <ButtonLink href={clubsPath()} variant="primary">
          Browse book clubs
        </ButtonLink>
      </div>
    );
  }

  const isOwner = club.viewer_role === "owner";
  const isMember = club.viewer_is_member;
  const canEdit = canEditClub(club.viewer_role);
  const canInvite = canManageMembers(club.viewer_role);
  const memberLabel = `${club.member_count} member${club.member_count === 1 ? "" : "s"}`;
  const selfJoin = canSelfJoin({
    visibility: club.visibility,
    joinPolicy: club.join_policy,
  });
  const needsRequest = requiresJoinRequest({ joinPolicy: club.join_policy });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Book clubs"
        limitMessage="Free members can join 3 book clubs. Upgrade to Bookmarked Plus for unlimited clubs."
      />

      <ClubInviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        clubId={club.id}
        viewerId={user.id}
        existingMemberIds={memberIds}
        onInvited={() => void loadClub()}
      />

      {club.viewer_is_member ? (
        <ClubSettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          club={club}
          canEditClub={isOwner}
          onSaved={() => void loadClub()}
        />
      ) : null}

      <p>
        <Link href={clubsPath()} className="text-sm font-medium text-primary hover:underline">
          ← Back to book clubs
        </Link>
      </p>

      <header className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        {club.banner_url ? (
          <div className="relative h-36 w-full bg-background sm:h-44">
            <Image
              src={club.banner_url}
              alt=""
              fill
              className="object-cover"
              unoptimized
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        ) : (
          <div
            className="h-24 w-full bg-gradient-to-r from-primary/25 via-royal-orange/20 to-puce-red/20 sm:h-28"
            aria-hidden
          />
        )}

        <div className="px-5 pb-5 pt-0 sm:px-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4 sm:-mt-12">
            {club.image_url ? (
              <Image
                src={club.image_url}
                alt=""
                width={96}
                height={96}
                className="h-20 w-20 shrink-0 rounded-full border-4 border-surface object-cover sm:h-24 sm:w-24"
                unoptimized
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-surface bg-royal-orange/20 text-xl font-bold text-puce-red sm:h-24 sm:w-24">
                {club.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-puce-red sm:text-3xl">{club.name}</h1>
                <span className="rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  {visibilityLabel(club.visibility)}
                </span>
                {club.viewer_role ? (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-puce-red">
                    {roleLabel(club.viewer_role)}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-text-muted">{memberLabel}</p>
            </div>
          </div>

          {club.description ? (
            <p className="mt-4 leading-relaxed text-text">{club.description}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!isMember ? (
              selfJoin ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={actionPending}
                  onClick={() => void handleJoin()}
                >
                  Join club
                </Button>
              ) : needsRequest ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={actionPending}
                  onClick={() => void handleRequestJoin()}
                >
                  Request to join
                </Button>
              ) : (
                <span className="text-sm text-text-muted">Invite only</span>
              )
            ) : !isOwner ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={actionPending}
                onClick={() => void handleLeave()}
              >
                Leave
              </Button>
            ) : null}

            {canInvite ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setInviteOpen(true)}
              >
                Invite Members
              </Button>
            ) : null}

            {isMember ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
              >
                Settings
              </Button>
            ) : null}

            {isMember ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={actionPending}
                onClick={() => void handleMessageClub()}
              >
                Message the Club
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleShare()}
            >
              Share
            </Button>

            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-haspopup="menu"
                aria-expanded={overflowOpen}
                onClick={() => setOverflowOpen((open) => !open)}
              >
                More
              </Button>
              {overflowOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-lg border border-border bg-surface py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-background"
                    onClick={() => {
                      setOverflowOpen(false);
                      void handleShare();
                    }}
                  >
                    Copy link
                  </button>
                  {isOwner ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full px-3 py-2 text-left text-sm text-rust hover:bg-background"
                      onClick={() => {
                        setOverflowOpen(false);
                        void handleDeleteClub();
                      }}
                    >
                      Delete club
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {canEdit ? (
            <div className="mt-5 border-t border-border pt-5">
              <CircleAvatarUpload
                imageUrl={club.image_url}
                fallbackLabel={club.name}
                disabled={actionPending}
                size="md"
                onFileSelect={async (file) => {
                  const result = await uploadClubAvatar(clubId, file);
                  if (result.error) throw new Error(result.error);
                  toast.success("Club photo updated.");
                  void loadClub();
                }}
                onRemove={async () => {
                  const result = await removeClubAvatar(clubId);
                  if (result.error) throw new Error(result.error);
                  toast.success("Club photo removed.");
                  void loadClub();
                }}
              />
            </div>
          ) : null}
        </div>
      </header>

      <nav
        aria-label="Club sections"
        className="flex gap-2 overflow-x-auto border-b border-border pb-3"
        role="tablist"
      >
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`club-panel-${id}`}
            id={`club-tab-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-2 text-sm font-medium",
              activeTab === id
                ? "bg-puce-red text-white"
                : "bg-surface text-text-muted hover:text-primary"
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <div
        id={`club-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`club-tab-${activeTab}`}
      >
        {activeTab === "overview" ? (
          <ClubOverviewPanel
            club={club}
            viewerId={user.id}
            onInvite={() => setInviteOpen(true)}
            onOpenDiscussions={() => setTab("discussions")}
            onOpenSchedule={() => setTab("schedule")}
            onOpenBookshelf={() => setTab("bookshelf")}
            onChanged={() => void loadClub()}
          />
        ) : null}

        {activeTab === "discussions" ? (
          <ClubDiscussionsPanel
            clubId={club.id}
            viewerId={user.id}
            isMember={isMember}
            viewerRole={club.viewer_role}
            initialDiscussionId={discussionParam}
          />
        ) : null}

        {activeTab === "schedule" ? (
          <ClubSchedulePanel
            clubId={club.id}
            isMember={isMember}
            viewerId={user.id}
            viewerRole={club.viewer_role}
          />
        ) : null}

        {activeTab === "bookshelf" ? (
          <ClubBookshelfPanel
            clubId={club.id}
            viewerId={user.id}
            viewerRole={club.viewer_role}
            onChanged={() => void loadClub()}
          />
        ) : null}

        {activeTab === "members" ? (
          <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <ClubMembersPanel
              clubId={club.id}
              members={club.members}
              viewerId={user.id}
              viewerRole={club.viewer_role}
              onInvite={() => setInviteOpen(true)}
              onChanged={() => void loadClub()}
            />
          </section>
        ) : null}

        {activeTab === "stats" ? (
          <ClubStatsPanel
            clubId={club.id}
            viewerRole={club.viewer_role}
            memberCount={club.member_count}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function ClubDetailPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading club…" />}>
      <ClubDetailContent />
    </Suspense>
  );
}
