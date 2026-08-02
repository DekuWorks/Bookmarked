"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Input } from "@/components/ui/Input";
import { ClubCard } from "@/components/clubs/ClubCard";
import { CreateClubModal } from "@/components/clubs/CreateClubModal";
import { useToast } from "@/components/ui/Toast";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import {
  acceptInvitation,
  approveJoinRequest,
  declineInvitation,
  declineJoinRequest,
  discoverClubs,
  discoverClubsReadingYourBooks,
  discoverTrendingClubs,
  getMyClubs,
  listInvitations,
  listJoinRequests,
  searchClubs,
} from "@/lib/services/bookClubs";
import { formatEventDateTime, listUpcomingEvents } from "@/lib/services/clubEvents";
import { clubDetailPath, eventsPath } from "@/lib/routes/clubs";
import { canManageMembers, roleLabel, visibilityLabel } from "@bookmarked/utils/clubPermissions";
import type {
  BookClubEventWithClub,
  BookClubInvitationWithDetails,
  BookClubJoinRequestWithDetails,
  BookClubSummary,
} from "@/types";
import { profileDisplayName } from "@/lib/utils/messaging";
import { layout } from "@/lib/constants/layout";
import { cn } from "@/lib/utils/cn";

type ClubsSection = "mine" | "discover" | "invitations" | "requests";

type DiscoverFilter = "all" | "public" | "private" | "newest" | "most_members";

type JoinRequestRow = BookClubJoinRequestWithDetails & {
  clubName: string;
  clubImageUrl: string | null;
};

function ClubsPageContent() {
  const user = useAuthUser();
  const toast = useToast();
  const [section, setSection] = useState<ClubsSection>("mine");
  const [mine, setMine] = useState<BookClubSummary[] | null>(null);
  const [discover, setDiscover] = useState<BookClubSummary[] | null>(null);
  const [invitations, setInvitations] = useState<BookClubInvitationWithDetails[] | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequestRow[] | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<BookClubEventWithClub[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [discoverFilter, setDiscoverFilter] = useState<DiscoverFilter>("all");
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [trending, setTrending] = useState<BookClubSummary[] | null>(null);
  const [readingYours, setReadingYours] = useState<BookClubSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  async function loadHub(viewerId: string) {
    setLoadError(null);
    try {
      const [myClubs, discovered, invites, events, trendingClubs, yoursClubs] = await Promise.all([
        getMyClubs(viewerId),
        discoverClubs(viewerId),
        listInvitations(viewerId),
        listUpcomingEvents(5),
        discoverTrendingClubs(viewerId, 6),
        discoverClubsReadingYourBooks(viewerId, 6),
      ]);

      setMine(myClubs);
      setDiscover(discovered);
      setInvitations(invites);
      setUpcomingEvents(events);
      setTrending(trendingClubs);
      setReadingYours(yoursClubs);

      const managedClubs = myClubs.filter((club) => canManageMembers(club.viewer_role));
      if (!managedClubs.length) {
        setJoinRequests([]);
        return;
      }

      const requestBatches = await Promise.all(
        managedClubs.map(async (club) => {
          const rows = await listJoinRequests(club.id);
          return rows.map((row) => ({
            ...row,
            clubName: club.name,
            clubImageUrl: club.image_url,
            club: { id: club.id, name: club.name, image_url: club.image_url },
          }));
        })
      );
      setJoinRequests(requestBatches.flat().sort((a, b) => a.created_at.localeCompare(b.created_at)));
    } catch (err) {
      console.error("[clubs] load failed:", err);
      setLoadError(err instanceof Error ? err.message : "Could not load book clubs.");
      setMine((prev) => prev ?? []);
      setDiscover((prev) => prev ?? []);
      setInvitations((prev) => prev ?? []);
      setJoinRequests((prev) => prev ?? []);
      setUpcomingEvents((prev) => prev ?? []);
    }
  }

  useEffect(() => {
    if (!user) return;
    void loadHub(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      if (trimmed.length === 0) {
        void discoverClubs(user.id)
          .then(setDiscover)
          .catch(() => setDiscover([]));
      }
      return;
    }

    setDiscoverLoading(true);
    const handle = window.setTimeout(() => {
      void searchClubs(user.id, trimmed)
        .then(setDiscover)
        .catch(() => setDiscover([]))
        .finally(() => setDiscoverLoading(false));
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchQuery, user]);

  const filteredDiscover = useMemo(() => {
    if (!discover) return null;
    let rows = [...discover];

    if (discoverFilter === "public" || discoverFilter === "private") {
      rows = rows.filter((club) => club.visibility === discoverFilter);
    }

    if (discoverFilter === "most_members") {
      rows.sort((a, b) => b.member_count - a.member_count || b.created_at.localeCompare(a.created_at));
    } else if (discoverFilter === "newest" || discoverFilter === "all" || discoverFilter === "public" || discoverFilter === "private") {
      rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    return rows;
  }, [discover, discoverFilter]);

  async function handleAcceptInvite(invitationId: string) {
    setActionId(invitationId);
    const result = await acceptInvitation(invitationId);
    setActionId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Joined the club!");
    if (user) void loadHub(user.id);
  }

  async function handleDeclineInvite(invitationId: string) {
    setActionId(invitationId);
    const result = await declineInvitation(invitationId);
    setActionId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Invitation declined.");
    if (user) void loadHub(user.id);
  }

  async function handleApproveRequest(requestId: string) {
    setActionId(requestId);
    const result = await approveJoinRequest(requestId);
    setActionId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Request approved.");
    if (user) void loadHub(user.id);
  }

  async function handleDeclineRequest(requestId: string) {
    setActionId(requestId);
    const result = await declineJoinRequest(requestId);
    setActionId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Request declined.");
    if (user) void loadHub(user.id);
  }

  if (user === undefined) {
    return <LoadingState message="Loading book clubs…" />;
  }

  if (!user) return null;

  const sectionOptions: { id: ClubsSection; label: string; count?: number }[] = [
    { id: "mine", label: "My Clubs", count: mine?.length },
    { id: "discover", label: "Discover" },
    {
      id: "invitations",
      label: "Invitations",
      count: invitations?.length,
    },
    {
      id: "requests",
      label: "Join Requests",
      count: joinRequests?.length,
    },
  ];

  const discoverFilters: { id: DiscoverFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "public", label: "Public" },
    { id: "private", label: "Private" },
    { id: "newest", label: "Newest" },
    { id: "most_members", label: "Most Members" },
  ];

  const hubLoading =
    mine === null ||
    discover === null ||
    invitations === null ||
    joinRequests === null;

  return (
    <div className={layout.pageStack}>
      <div className="-mx-4 feed-header-gradient px-4 pb-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <header className={layout.pageHeader}>
          <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Book Clubs</h1>
          <p className="mx-auto mt-1 max-w-xl text-pretty text-text-muted">
            Find your people, read together, and dive into discussions around the books you love.
          </p>
        </header>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>
            Start a club
          </Button>
          <ButtonLink href={eventsPath()} variant="secondary">
            View events
          </ButtonLink>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-rust/40 bg-rust/5 px-4 py-3 text-sm text-rust">
          {loadError}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-3"
            onClick={() => void loadHub(user.id)}
          >
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-4 text-left shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold text-puce-red">Upcoming Events</h2>
              <p className="mt-0.5 text-xs text-text-muted">From clubs you can see</p>
            </div>
            <Link href={eventsPath()} className="text-sm font-medium text-primary hover:underline">
              All
            </Link>
          </div>
          {upcomingEvents === null ? (
            <p className="mt-3 text-sm text-text-muted">Loading events…</p>
          ) : upcomingEvents.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">No upcoming events yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcomingEvents.slice(0, 3).map((event) => (
                <li key={event.id}>
                  <Link
                    href={clubDetailPath(event.club.id)}
                    className="block rounded-lg px-2 py-1.5 transition hover:bg-background"
                  >
                    <p className="text-xs text-text-muted">
                      {formatEventDateTime(event.starts_at)}
                    </p>
                    <p className="truncate text-sm font-medium text-text">{event.title}</p>
                    <p className="truncate text-xs text-text-muted">{event.club.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-4 text-left shadow-sm">
          <h2 className="font-semibold text-puce-red">Discussions</h2>
          <p className="mt-0.5 text-xs text-text-muted">Jump into a club conversation</p>
          {!mine ? (
            <p className="mt-3 text-sm text-text-muted">Loading clubs…</p>
          ) : mine.length === 0 ? (
            <p className="mt-3 text-sm text-text-muted">
              Join a club to start discussing books with other readers.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {mine.slice(0, 3).map((club) => (
                <li key={club.id}>
                  <Link
                    href={clubDetailPath(club.id)}
                    className="block rounded-lg px-2 py-1.5 text-sm font-medium text-primary transition hover:bg-background hover:underline"
                  >
                    {club.name}
                    {club.viewer_role ? (
                      <span className="ml-2 text-xs font-normal text-text-muted">
                        {roleLabel(club.viewer_role)}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {mine && mine.length > 0 ? (
            <button
              type="button"
              className="mt-2 text-sm font-medium text-primary hover:underline"
              onClick={() => setSection("mine")}
            >
              Open My Clubs
            </button>
          ) : null}
        </section>
      </div>

      <div className="pill-tabs" role="tablist" aria-label="Book clubs sections">
        {sectionOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={section === option.id}
            data-active={section === option.id ? "true" : "false"}
            className={cn("pill-tab")}
            onClick={() => setSection(option.id)}
          >
            {option.label}
            {typeof option.count === "number" && option.count > 0 ? (
              <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-puce-red">
                {option.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {hubLoading ? (
        <LoadingState message="Loading book clubs…" />
      ) : null}

      {!hubLoading && section === "mine" ? (
        mine.length === 0 ? (
          <EmptyState
            title="You haven't joined any clubs"
            body="Browse Discover to find a club, or start your own."
            actions={
              <>
                <Button type="button" variant="primary" size="sm" onClick={() => setSection("discover")}>
                  Discover clubs
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                  Start a club
                </Button>
              </>
            }
          />
        ) : (
          <ul className="space-y-3">
            {mine.map((club) => (
              <li key={club.id}>
                <ClubCard club={club} showOpenCta />
              </li>
            ))}
          </ul>
        )
      ) : null}

      {!hubLoading && section === "discover" ? (
        <div className="space-y-4">
          <Input
            label="Search clubs"
            name="club-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search public clubs by name…"
            className="mb-0 text-left"
          />

          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Discover filters">
            {discoverFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setDiscoverFilter(filter.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  discoverFilter === filter.id
                    ? "bg-puce-red text-white"
                    : "bg-surface text-text-muted ring-1 ring-border hover:text-text"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {!searchQuery.trim() && trending && trending.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-puce-red">Trending Clubs</h2>
              <ul className="space-y-3">
                {trending.map((club) => (
                  <li key={`trending-${club.id}`}>
                    <ClubCard club={club} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!searchQuery.trim() && readingYours && readingYours.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-puce-red">Clubs Reading Your Books</h2>
              <ul className="space-y-3">
                {readingYours.map((club) => (
                  <li key={`yours-${club.id}`}>
                    <ClubCard club={club} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <h2 className="text-sm font-semibold text-puce-red">All public clubs</h2>

          {discoverLoading || filteredDiscover === null ? (
            <LoadingState message="Searching clubs…" />
          ) : filteredDiscover.length === 0 ? (
            <EmptyState
              title={searchQuery.trim().length >= 2 ? "No clubs match your search" : "No public clubs yet"}
              body={
                searchQuery.trim().length >= 2
                  ? "Try a different name, or clear search to browse all public clubs."
                  : "Be the first to start a book club and invite readers to join the conversation."
              }
              actions={
                <Button type="button" variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                  Start a club
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {filteredDiscover.map((club) => (
                <li key={club.id}>
                  <ClubCard club={club} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {!hubLoading && section === "invitations" ? (
        invitations.length === 0 ? (
          <EmptyState
            title="No pending invitations"
            body="When someone invites you to a club, it will show up here."
          />
        ) : (
          <ul className="space-y-3">
            {invitations.map((invite) => (
              <li
                key={invite.id}
                className="rounded-xl border border-border bg-surface p-4 text-left shadow-sm"
              >
                <div className="flex gap-3">
                  <ClubThumb imageUrl={invite.club.image_url} name={invite.club.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-puce-red">{invite.club.name}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Invited by {profileDisplayName(invite.inviter)} ·{" "}
                      {visibilityLabel(invite.club.visibility)}
                    </p>
                    {invite.message ? (
                      <p className="mt-2 text-sm text-text">{invite.message}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        loading={actionId === invite.id}
                        onClick={() => void handleAcceptInvite(invite.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={actionId === invite.id}
                        onClick={() => void handleDeclineInvite(invite.id)}
                      >
                        Decline
                      </Button>
                      <ButtonLink
                        href={clubDetailPath(invite.club.id)}
                        variant="ghost"
                        size="sm"
                      >
                        View club
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {!hubLoading && section === "requests" ? (
        joinRequests.length === 0 ? (
          <EmptyState
            title="No pending join requests"
            body="Requests for clubs you own or host will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {joinRequests.map((request) => (
              <li
                key={request.id}
                className="rounded-xl border border-border bg-surface p-4 text-left shadow-sm"
              >
                <div className="flex gap-3">
                  <ClubThumb imageUrl={request.clubImageUrl} name={request.clubName} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-puce-red">
                      {profileDisplayName(request.requester)}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Wants to join {request.clubName}
                    </p>
                    {request.message ? (
                      <p className="mt-2 text-sm text-text">{request.message}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        loading={actionId === request.id}
                        onClick={() => void handleApproveRequest(request.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={actionId === request.id}
                        onClick={() => void handleDeclineRequest(request.id)}
                      >
                        Decline
                      </Button>
                      <ButtonLink
                        href={clubDetailPath(request.club_id)}
                        variant="ghost"
                        size="sm"
                      >
                        Open club
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}

      <CreateClubModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          void loadHub(user.id);
        }}
        currentUserId={user.id}
      />
    </div>
  );
}

function EmptyState({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-center">
      <p className="font-medium text-puce-red">{title}</p>
      <p className="mt-2 text-sm text-text-muted">{body}</p>
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  );
}

function ClubThumb({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary/30 via-puce-red/10 to-royal-orange/25">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={48}
          height={48}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-puce-red">
          {name.trim().slice(0, 1).toUpperCase() || "B"}
        </span>
      )}
    </div>
  );
}

export default function ClubsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading book clubs…" />}>
      <ClubsPageContent />
    </Suspense>
  );
}
