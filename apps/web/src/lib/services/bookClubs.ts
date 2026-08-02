import { createClient } from "@/lib/supabase/client";
import {
  clubDiscussionMetadata,
  clubSharedMetadata,
  recordActivity,
} from "@/lib/services/activity";
import {
  ENTITLEMENT_LIMIT_MESSAGES,
  canJoinBookClub,
  toSubscriptionAccessFromRow,
} from "@/lib/utils/subscription";
import { canShareClubToFeed, canSelfJoin } from "@bookmarked/utils/clubPermissions";
import type {
  BookClub,
  BookClubAnnouncementWithAuthor,
  BookClubBook,
  BookClubBookCategory,
  BookClubCurrentRead,
  BookClubDiscussionReplyWithAuthor,
  BookClubDiscussionWithAuthor,
  BookClubInvitation,
  BookClubInvitationWithDetails,
  BookClubJoinPolicy,
  BookClubJoinRequestWithDetails,
  BookClubMemberRole,
  BookClubMemberWithProfile,
  BookClubPostWithAuthor,
  BookClubShelfBook,
  BookClubStats,
  BookClubSummary,
  BookClubVisibility,
  BookClubWithDetails,
  MessageProfile,
  PostAuthor,
} from "@/types";

const PROFILE_SELECT = "id, username, display_name, avatar_url";
const BOOK_SELECT = "id, title, author, cover_url";

/** Constraint name kept after book_club_posts → book_club_discussions rename. */
const DISCUSSION_PROFILE_FK = "book_club_posts_user_id_profiles_fkey";

const DISCUSSION_SELECT = [
  "id",
  "club_id",
  "user_id",
  "created_by",
  "title",
  "body",
  "book_id",
  "related_book_id",
  "chapter_reference",
  "page_reference",
  "contains_spoilers",
  "is_pinned",
  "is_locked",
  "reply_count",
  "latest_activity_at",
  "created_at",
  "updated_at",
  `profiles!${DISCUSSION_PROFILE_FK} (${PROFILE_SELECT})`,
].join(", ");

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be signed in.");
  return { supabase, user };
}

type ClubRow = BookClub;

type DiscussionRow = {
  id: string;
  club_id: string;
  user_id: string;
  created_by: string;
  title: string;
  body: string;
  book_id: string | null;
  related_book_id: string | null;
  chapter_reference: string | null;
  page_reference: string | null;
  contains_spoilers: boolean;
  is_pinned: boolean;
  is_locked: boolean;
  reply_count: number;
  latest_activity_at: string;
  created_at: string;
  updated_at: string;
  profiles: PostAuthor | null;
};

function fallbackProfile(userId: string): MessageProfile & PostAuthor {
  return {
    id: userId,
    username: null,
    display_name: null,
    avatar_url: null,
  };
}

function resolveDiscussionBookId(row: Pick<DiscussionRow, "book_id" | "related_book_id">): string | null {
  return row.related_book_id ?? row.book_id;
}

function mapDiscussion(
  row: DiscussionRow,
  bookById: Map<string, BookClubBook>
): BookClubDiscussionWithAuthor {
  const bookId = resolveDiscussionBookId(row);
  return {
    id: row.id,
    club_id: row.club_id,
    user_id: row.user_id,
    created_by: row.created_by,
    title: row.title,
    body: row.body,
    book_id: bookId,
    related_book_id: row.related_book_id ?? row.book_id,
    chapter_reference: row.chapter_reference,
    page_reference: row.page_reference,
    contains_spoilers: row.contains_spoilers,
    is_pinned: row.is_pinned,
    is_locked: row.is_locked,
    reply_count: row.reply_count,
    latest_activity_at: row.latest_activity_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.profiles ?? fallbackProfile(row.user_id),
    book: bookId ? bookById.get(bookId) ?? null : null,
  };
}

/** Narrow discussion → legacy post shape for UI that still types BookClubPostWithAuthor. */
export function toBookClubPostWithAuthor(
  discussion: BookClubDiscussionWithAuthor
): BookClubPostWithAuthor {
  return {
    id: discussion.id,
    club_id: discussion.club_id,
    user_id: discussion.user_id,
    body: discussion.body,
    book_id: discussion.book_id ?? discussion.related_book_id,
    created_at: discussion.created_at,
    updated_at: discussion.updated_at,
    author: discussion.author,
    book: discussion.book ?? null,
  };
}

async function hydrateBooks(
  supabase: ReturnType<typeof createClient>,
  bookIds: string[]
): Promise<Map<string, BookClubBook>> {
  const bookById = new Map<string, BookClubBook>();
  const unique = [...new Set(bookIds.filter(Boolean))];
  if (!unique.length) return bookById;

  const { data: books, error } = await supabase.from("books").select(BOOK_SELECT).in("id", unique);
  if (error) throw error;
  for (const book of (books ?? []) as BookClubBook[]) {
    bookById.set(book.id, book);
  }
  return bookById;
}

async function hydrateProfiles(
  supabase: ReturnType<typeof createClient>,
  userIds: string[]
): Promise<Map<string, MessageProfile>> {
  const byId = new Map<string, MessageProfile>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return byId;

  const { data, error } = await supabase.from("profiles").select(PROFILE_SELECT).in("id", unique);
  if (error) throw error;
  for (const profile of (data ?? []) as MessageProfile[]) {
    byId.set(profile.id, profile);
  }
  return byId;
}

/**
 * Annotate raw club rows with membership info and the current book.
 * Prefers denormalized `member_count` on the club row; viewer membership is
 * batched and filtered to active memberships only.
 */
async function summarizeClubs(
  supabase: ReturnType<typeof createClient>,
  clubs: ClubRow[],
  viewerId: string
): Promise<BookClubSummary[]> {
  if (!clubs.length) return [];

  const clubIds = clubs.map((club) => club.id);
  const bookIds = [
    ...new Set(clubs.map((c) => c.current_book_id).filter((id): id is string => Boolean(id))),
  ];

  const { data: viewerRows, error: viewerError } = await supabase
    .from("book_club_members")
    .select("club_id, role")
    .eq("user_id", viewerId)
    .eq("membership_status", "active")
    .in("club_id", clubIds);

  if (viewerError) throw viewerError;

  const viewerRoleByClub = new Map<string, BookClubMemberRole>();
  for (const row of viewerRows ?? []) {
    viewerRoleByClub.set(row.club_id, row.role as BookClubMemberRole);
  }

  const bookById = await hydrateBooks(supabase, bookIds);

  return clubs.map((club) => {
    const viewerRole = viewerRoleByClub.get(club.id) ?? null;
    return {
      ...club,
      member_count: typeof club.member_count === "number" ? club.member_count : 0,
      viewer_is_member: viewerRole !== null,
      viewer_role: viewerRole,
      current_book: club.current_book_id ? bookById.get(club.current_book_id) ?? null : null,
    };
  });
}

function defaultJoinPolicy(visibility: BookClubVisibility): BookClubJoinPolicy {
  if (visibility === "public") return "open";
  return "invitation_only";
}

/** Public clubs to browse (discover), most recent first. */
export async function discoverClubs(viewerId: string, limit = 50): Promise<BookClubSummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_clubs")
    .select("*")
    .eq("visibility", "public")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return summarizeClubs(supabase, (data ?? []) as ClubRow[], viewerId);
}

/** Trending public clubs by member_count (RPC with client fallback). */
export async function discoverTrendingClubs(
  viewerId: string,
  limit = 12
): Promise<BookClubSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("discover_trending_book_clubs", {
    p_limit: limit,
  });

  if (!error && data) {
    return summarizeClubs(supabase, data as ClubRow[], viewerId);
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from("book_clubs")
    .select("*")
    .eq("visibility", "public")
    .eq("status", "active")
    .order("member_count", { ascending: false })
    .limit(limit);

  if (fallbackError) throw fallbackError;
  return summarizeClubs(supabase, (fallback ?? []) as ClubRow[], viewerId);
}

/** Newest public clubs. */
export async function discoverNewClubs(
  viewerId: string,
  limit = 12
): Promise<BookClubSummary[]> {
  return discoverClubs(viewerId, limit);
}

/** Public clubs whose current read is on the viewer's shelves. */
export async function discoverClubsReadingYourBooks(
  viewerId: string,
  limit = 12
): Promise<BookClubSummary[]> {
  const supabase = createClient();
  const { data: shelf, error: shelfError } = await supabase
    .from("user_books")
    .select("book_id")
    .eq("user_id", viewerId)
    .limit(100);

  if (shelfError) throw shelfError;
  const bookIds = [...new Set((shelf ?? []).map((r) => r.book_id).filter(Boolean))];
  if (!bookIds.length) return [];

  const { data, error } = await supabase
    .from("book_clubs")
    .select("*")
    .eq("visibility", "public")
    .eq("status", "active")
    .in("current_book_id", bookIds)
    .order("member_count", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return summarizeClubs(supabase, (data ?? []) as ClubRow[], viewerId);
}

export async function getMemberNotificationLevel(
  clubId: string
): Promise<"all" | "important" | "mentions" | "off"> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("book_club_member_notification_prefs")
    .select("level")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return (data?.level as "all" | "important" | "mentions" | "off" | undefined) ?? "important";
}

export async function setMemberNotificationLevel(
  clubId: string,
  level: "all" | "important" | "mentions" | "off"
): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("book_club_member_notification_prefs").upsert(
      {
        club_id: clubId,
        user_id: user.id,
        level,
      },
      { onConflict: "club_id,user_id" }
    );
    if (error) throw error;
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save notification preference." };
  }
}

/** Search public clubs by name. */
export async function searchClubs(
  viewerId: string,
  query: string,
  limit = 30
): Promise<BookClubSummary[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("book_clubs")
    .select("*")
    .eq("visibility", "public")
    .eq("status", "active")
    .ilike("name", `%${term}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return summarizeClubs(supabase, (data ?? []) as ClubRow[], viewerId);
}

/** Clubs the viewer belongs to (owned or joined). */
export async function getMyClubs(viewerId: string): Promise<BookClubSummary[]> {
  const supabase = createClient();

  const { data: memberships, error: membershipError } = await supabase
    .from("book_club_members")
    .select("club_id")
    .eq("user_id", viewerId)
    .eq("membership_status", "active");

  if (membershipError) throw membershipError;

  const clubIds = (memberships ?? []).map((row) => row.club_id);
  if (!clubIds.length) return [];

  const { data, error } = await supabase
    .from("book_clubs")
    .select("*")
    .in("id", clubIds)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return summarizeClubs(supabase, (data ?? []) as ClubRow[], viewerId);
}

/**
 * Clubs a given user is a member of. RLS filters this to clubs the viewer is
 * allowed to see (public clubs, or private clubs they also belong to).
 */
export async function getUserClubs(
  targetUserId: string,
  viewerId: string
): Promise<BookClubSummary[]> {
  const supabase = createClient();

  const { data: memberships, error: membershipError } = await supabase
    .from("book_club_members")
    .select("club_id")
    .eq("user_id", targetUserId)
    .eq("membership_status", "active");

  if (membershipError) throw membershipError;

  const clubIds = (memberships ?? []).map((row) => row.club_id);
  if (!clubIds.length) return [];

  const { data, error } = await supabase
    .from("book_clubs")
    .select("*")
    .in("id", clubIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return summarizeClubs(supabase, (data ?? []) as ClubRow[], viewerId);
}

export async function getClub(
  clubId: string,
  viewerId: string
): Promise<BookClubWithDetails | null> {
  const supabase = createClient();

  const { data: club, error } = await supabase
    .from("book_clubs")
    .select("*")
    .eq("id", clubId)
    .maybeSingle();

  if (error) throw error;
  if (!club) return null;

  const [summaries, members] = await Promise.all([
    summarizeClubs(supabase, [club as ClubRow], viewerId),
    listMembers(clubId),
  ]);

  const summary = summaries[0];
  if (!summary) return null;

  return { ...summary, members };
}

export async function listMembers(clubId: string): Promise<BookClubMemberWithProfile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_members")
    .select(
      `id, club_id, user_id, role, membership_status, invited_by, joined_at, updated_at, profiles!book_club_members_user_id_profiles_fkey (${PROFILE_SELECT})`
    )
    .eq("club_id", clubId)
    .eq("membership_status", "active")
    .order("joined_at", { ascending: true });

  if (error) throw error;

  type MemberRow = {
    id: string;
    club_id: string;
    user_id: string;
    role: BookClubMemberRole;
    membership_status: BookClubMemberWithProfile["membership_status"];
    invited_by: string | null;
    joined_at: string;
    updated_at: string;
    profiles: MessageProfile | null;
  };

  return ((data ?? []) as unknown as MemberRow[]).map((row) => ({
    id: row.id,
    club_id: row.club_id,
    user_id: row.user_id,
    role: row.role,
    membership_status: row.membership_status,
    invited_by: row.invited_by,
    joined_at: row.joined_at,
    updated_at: row.updated_at,
    profile: row.profiles ?? fallbackProfile(row.user_id),
  }));
}

export async function listDiscussions(clubId: string): Promise<BookClubDiscussionWithAuthor[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_discussions")
    .select(DISCUSSION_SELECT)
    .eq("club_id", clubId)
    .order("is_pinned", { ascending: false })
    .order("latest_activity_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const rows = (data ?? []) as unknown as DiscussionRow[];
  const bookById = await hydrateBooks(
    supabase,
    rows.map((r) => resolveDiscussionBookId(r)).filter((id): id is string => Boolean(id))
  );

  return rows.map((row) => mapDiscussion(row, bookById));
}

/**
 * Fetch and hydrate a single discussion (author profile + optional book).
 * Used to hydrate posts arriving over Realtime so they can be prepended
 * without a full refetch.
 */
export async function getDiscussion(
  clubId: string,
  discussionId: string
): Promise<BookClubDiscussionWithAuthor | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_discussions")
    .select(DISCUSSION_SELECT)
    .eq("id", discussionId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as DiscussionRow;
  const bookId = resolveDiscussionBookId(row);
  const bookById = await hydrateBooks(supabase, bookId ? [bookId] : []);
  return mapDiscussion(row, bookById);
}

export type CreateClubInput = {
  name: string;
  description?: string | null;
  visibility?: BookClubVisibility;
  joinPolicy?: BookClubJoinPolicy;
  genreTags?: string[];
  imageUrl?: string | null;
  bannerUrl?: string | null;
  meetingFrequency?: string | null;
  currentBookId?: string | null;
};

export async function createClub(
  input: CreateClubInput
): Promise<{ clubId?: string; error?: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Club name is required." };

  try {
    const { supabase, user } = await requireUser();
    const visibility = input.visibility ?? "public";
    const joinPolicy = input.joinPolicy ?? defaultJoinPolicy(visibility);

    const { data: club, error: clubError } = await supabase
      .from("book_clubs")
      .insert({
        owner_id: user.id,
        name,
        description: input.description?.trim() || null,
        visibility,
        join_policy: joinPolicy,
        genre_tags: input.genreTags ?? [],
        image_url: input.imageUrl?.trim() || null,
        banner_url: input.bannerUrl?.trim() || null,
        meeting_frequency: input.meetingFrequency?.trim() || null,
        current_book_id: input.currentBookId ?? null,
        member_count: 1,
      })
      .select("id")
      .single();

    if (clubError || !club) {
      return { error: clubError?.message ?? "Could not create club." };
    }

    const { error: memberError } = await supabase.from("book_club_members").insert({
      club_id: club.id,
      user_id: user.id,
      role: "owner",
      membership_status: "active",
    });

    if (memberError) return { error: memberError.message };

    const { error: settingsError } = await supabase.from("book_club_settings").insert({
      club_id: club.id,
    });
    if (settingsError) {
      console.warn("[book-clubs] settings seed failed:", settingsError.message);
    }

    if (input.currentBookId) {
      const { error: readError } = await supabase.rpc("set_book_club_current_read", {
        p_club_id: club.id,
        p_book_id: input.currentBookId,
      });
      if (readError) {
        console.warn("[book-clubs] current read seed failed:", readError.message);
      }
    }

    return { clubId: club.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create club." };
  }
}

export async function joinClub(clubId: string): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();

    const { data: existing } = await supabase
      .from("book_club_members")
      .select("club_id, membership_status")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.membership_status === "active") return {};
    if (existing?.membership_status === "banned") {
      return { error: "You are banned from this club." };
    }

    const { data: club, error: clubError } = await supabase
      .from("book_clubs")
      .select("visibility, join_policy")
      .eq("id", clubId)
      .maybeSingle();

    if (clubError) return { error: clubError.message };
    if (!club) return { error: "Club not found." };

    if (
      !canSelfJoin({
        visibility: club.visibility as BookClubVisibility,
        joinPolicy: club.join_policy,
      })
    ) {
      if (club.join_policy === "request_approval") {
        return { error: "This club requires approval to join. Submit a join request instead." };
      }
      return { error: "This club is invite-only." };
    }

    const [{ count, error: countError }, { data: subscription }] = await Promise.all([
      supabase
        .from("book_club_members")
        .select("club_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("membership_status", "active"),
      supabase
        .from("user_subscriptions")
        .select("subscription_tier, subscription_status, subscription_expires_at")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (countError) return { error: countError.message };

    if (!canJoinBookClub(count ?? 0, toSubscriptionAccessFromRow(subscription))) {
      return { error: ENTITLEMENT_LIMIT_MESSAGES.joined_book_clubs };
    }

    if (existing) {
      const { error } = await supabase
        .from("book_club_members")
        .update({ membership_status: "active", role: "member", updated_at: new Date().toISOString() })
        .eq("club_id", clubId)
        .eq("user_id", user.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("book_club_members").insert({
        club_id: clubId,
        user_id: user.id,
        role: "member",
        membership_status: "active",
      });
      if (error) {
        if (error.code === "23505") return {};
        return { error: error.message };
      }
    }

    await supabase.rpc("sync_book_club_conversation_participant", {
      p_club_id: clubId,
      p_user_id: user.id,
      p_add: true,
    });

    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not join club." };
  }
}

export async function leaveClub(clubId: string): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();

    const { data: club } = await supabase
      .from("book_clubs")
      .select("owner_id")
      .eq("id", clubId)
      .maybeSingle();

    if (club?.owner_id === user.id) {
      return { error: "Owners can't leave their own club. Delete it instead." };
    }

    const { error } = await supabase
      .from("book_club_members")
      .update({ membership_status: "left", updated_at: new Date().toISOString() })
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("membership_status", "active");

    if (error) return { error: error.message };

    await supabase.rpc("sync_book_club_conversation_participant", {
      p_club_id: clubId,
      p_user_id: user.id,
      p_add: false,
    });

    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not leave club." };
  }
}

export async function removeMember(
  clubId: string,
  memberUserId: string
): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();

    if (memberUserId === user.id) {
      return leaveClub(clubId);
    }

    const { error } = await supabase
      .from("book_club_members")
      .update({ membership_status: "removed", updated_at: new Date().toISOString() })
      .eq("club_id", clubId)
      .eq("user_id", memberUserId)
      .eq("membership_status", "active");

    if (error) return { error: error.message };

    await supabase.rpc("sync_book_club_conversation_participant", {
      p_club_id: clubId,
      p_user_id: memberUserId,
      p_add: false,
    });

    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not remove member." };
  }
}

export async function banMember(
  clubId: string,
  memberUserId: string
): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();

    if (memberUserId === user.id) {
      return { error: "You can't ban yourself." };
    }

    const { error } = await supabase
      .from("book_club_members")
      .update({ membership_status: "banned", updated_at: new Date().toISOString() })
      .eq("club_id", clubId)
      .eq("user_id", memberUserId);

    if (error) return { error: error.message };

    await supabase.rpc("sync_book_club_conversation_participant", {
      p_club_id: clubId,
      p_user_id: memberUserId,
      p_add: false,
    });

    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not ban member." };
  }
}

export async function updateMemberRole(
  clubId: string,
  memberUserId: string,
  role: Exclude<BookClubMemberRole, "owner">
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("book_club_members")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("club_id", clubId)
      .eq("user_id", memberUserId)
      .eq("membership_status", "active");

    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update role." };
  }
}

export async function transferOwnership(
  clubId: string,
  newOwnerId: string
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("transfer_book_club_ownership", {
      p_club_id: clubId,
      p_new_owner_id: newOwnerId,
    });
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not transfer ownership." };
  }
}

export type UpdateClubInput = {
  name?: string;
  description?: string | null;
  visibility?: BookClubVisibility;
  joinPolicy?: BookClubJoinPolicy;
  genreTags?: string[];
  imageUrl?: string | null;
  bannerUrl?: string | null;
  meetingFrequency?: string | null;
};

export async function updateClub(
  clubId: string,
  input: UpdateClubInput
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) return { error: "Club name is required." };
      patch.name = name;
    }
    if (input.description !== undefined) patch.description = input.description?.trim() || null;
    if (input.visibility !== undefined) patch.visibility = input.visibility;
    if (input.joinPolicy !== undefined) patch.join_policy = input.joinPolicy;
    if (input.genreTags !== undefined) patch.genre_tags = input.genreTags;
    if (input.imageUrl !== undefined) patch.image_url = input.imageUrl?.trim() || null;
    if (input.bannerUrl !== undefined) patch.banner_url = input.bannerUrl?.trim() || null;
    if (input.meetingFrequency !== undefined) {
      patch.meeting_frequency = input.meetingFrequency?.trim() || null;
    }

    const { error } = await supabase.from("book_clubs").update(patch).eq("id", clubId);
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update club." };
  }
}

/** @deprecated Prefer setCurrentRead — kept for ClubDetailPage. */
export async function setCurrentBook(
  clubId: string,
  bookId: string | null
): Promise<{ error?: string }> {
  if (bookId) {
    return setCurrentRead(clubId, { bookId });
  }

  try {
    const { supabase } = await requireUser();

    await supabase
      .from("book_club_current_reads")
      .update({ is_current: false, archived_at: new Date().toISOString() })
      .eq("club_id", clubId)
      .eq("is_current", true);

    await supabase
      .from("book_club_books")
      .update({ category: "previous", updated_at: new Date().toISOString() })
      .eq("club_id", clubId)
      .eq("category", "current_read");

    const { error } = await supabase
      .from("book_clubs")
      .update({ current_book_id: null, updated_at: new Date().toISOString() })
      .eq("id", clubId);

    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not set current book." };
  }
}

export type SetCurrentReadInput = {
  bookId: string;
  startedAt?: string | null;
  targetFinishAt?: string | null;
  chapters?: string | null;
  pages?: string | null;
};

export async function setCurrentRead(
  clubId: string,
  input: SetCurrentReadInput
): Promise<{ error?: string; currentReadId?: string }> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("set_book_club_current_read", {
      p_club_id: clubId,
      p_book_id: input.bookId,
      p_started_at: input.startedAt ?? new Date().toISOString(),
      p_target_finish_at: input.targetFinishAt ?? null,
      p_chapters: input.chapters ?? null,
      p_pages: input.pages ?? null,
    });
    if (error) return { error: error.message };
    return { currentReadId: typeof data === "string" ? data : undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not set current read." };
  }
}

/** Active + recent current-read history for a club (deadline / assignment UI). */
export async function listCurrentReads(clubId: string): Promise<BookClubCurrentRead[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_current_reads")
    .select(
      "id, club_id, book_id, started_at, target_finish_at, chapters_assigned, pages_assigned, is_current, archived_at, created_by, created_at, updated_at"
    )
    .eq("club_id", clubId)
    .order("is_current", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  const rows = (data ?? []) as BookClubCurrentRead[];
  const bookById = await hydrateBooks(
    supabase,
    rows.map((row) => row.book_id)
  );

  return rows.map((row) => ({
    ...row,
    book: bookById.get(row.book_id) ?? null,
  }));
}

export type BookClubPendingInvitation = BookClubInvitation & {
  invitee: MessageProfile;
  inviter: MessageProfile;
};

/** Pending invitations sent for a specific club (hosts/members management). */
export async function listClubPendingInvitations(
  clubId: string
): Promise<BookClubPendingInvitation[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_invitations")
    .select(
      "id, club_id, inviter_id, invitee_id, message, status, created_at, updated_at, responded_at"
    )
    .eq("club_id", clubId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as BookClubInvitation[];
  const profiles = await hydrateProfiles(
    supabase,
    rows.flatMap((row) => [row.invitee_id, row.inviter_id])
  );

  return rows.map((row) => ({
    ...row,
    invitee: profiles.get(row.invitee_id) ?? fallbackProfile(row.invitee_id),
    inviter: profiles.get(row.inviter_id) ?? fallbackProfile(row.inviter_id),
  }));
}

export type CreateDiscussionInput = {
  title?: string;
  body: string;
  bookId?: string | null;
  chapterReference?: string | null;
  pageReference?: string | null;
  containsSpoilers?: boolean;
};

/**
 * Create a discussion. Supports:
 * - `createDiscussion(clubId, { title, body, bookId, ... })`
 * - `createDiscussion(clubId, title, body, bookId?)` (4th arg may be null)
 * - legacy `createDiscussion(clubId, body, bookId?)` (title derived from body)
 */
export async function createDiscussion(
  clubId: string,
  titleOrInput: string | CreateDiscussionInput,
  bodyOrBookId?: string | null,
  bookId?: string | null
): Promise<{ error?: string; discussionId?: string }> {
  let input: CreateDiscussionInput;
  if (typeof titleOrInput === "object") {
    input = titleOrInput;
  } else if (arguments.length >= 4 && typeof bodyOrBookId === "string") {
    // createDiscussion(clubId, title, body, bookId?)
    input = { title: titleOrInput, body: bodyOrBookId, bookId: bookId ?? null };
  } else {
    // legacy createDiscussion(clubId, body, bookId?)
    input = {
      body: titleOrInput,
      bookId: bodyOrBookId ?? null,
    };
  }

  const trimmedBody = input.body.trim();
  if (!trimmedBody) return { error: "Write something to start a discussion." };

  const title =
    input.title?.trim() ||
    (trimmedBody.length > 80 ? `${trimmedBody.slice(0, 80)}…` : trimmedBody);

  try {
    const { supabase, user } = await requireUser();
    const relatedBookId = input.bookId ?? null;

    const { data: inserted, error } = await supabase
      .from("book_club_discussions")
      .insert({
        club_id: clubId,
        user_id: user.id,
        created_by: user.id,
        title,
        body: trimmedBody,
        book_id: relatedBookId,
        related_book_id: relatedBookId,
        chapter_reference: input.chapterReference?.trim() || null,
        page_reference: input.pageReference?.trim() || null,
        contains_spoilers: input.containsSpoilers ?? false,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    await supabase
      .from("book_clubs")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", clubId);

    try {
      const { data: club } = await supabase
        .from("book_clubs")
        .select("name, visibility")
        .eq("id", clubId)
        .maybeSingle();

      if (club && club.visibility === "public" && inserted) {
        let book: BookClubBook | null = null;
        if (relatedBookId) {
          const bookById = await hydrateBooks(supabase, [relatedBookId]);
          book = bookById.get(relatedBookId) ?? null;
        }

        await recordActivity(supabase, {
          user_id: user.id,
          event_type: "club_discussion_created",
          entity_type: "book_club",
          entity_id: clubId,
          visibility: "public",
          metadata_json: clubDiscussionMetadata({
            clubId,
            clubName: club.name,
            bodySnippet: trimmedBody.length > 140 ? `${trimmedBody.slice(0, 140)}…` : trimmedBody,
            book,
          }),
        });
      }
    } catch (activityError) {
      console.warn("[book-clubs] activity record failed:", activityError);
    }

    return { discussionId: inserted?.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not post discussion." };
  }
}

export type UpdateDiscussionInput = {
  title?: string;
  body?: string;
  bookId?: string | null;
  chapterReference?: string | null;
  pageReference?: string | null;
  containsSpoilers?: boolean;
};

export async function updateDiscussion(
  discussionId: string,
  input: UpdateDiscussionInput
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (!title) return { error: "Title is required." };
      patch.title = title;
    }
    if (input.body !== undefined) {
      const body = input.body.trim();
      if (!body) return { error: "Body is required." };
      patch.body = body;
    }
    if (input.bookId !== undefined) {
      patch.book_id = input.bookId;
      patch.related_book_id = input.bookId;
    }
    if (input.chapterReference !== undefined) {
      patch.chapter_reference = input.chapterReference?.trim() || null;
    }
    if (input.pageReference !== undefined) {
      patch.page_reference = input.pageReference?.trim() || null;
    }
    if (input.containsSpoilers !== undefined) {
      patch.contains_spoilers = input.containsSpoilers;
    }

    const { error } = await supabase
      .from("book_club_discussions")
      .update(patch)
      .eq("id", discussionId);

    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update discussion." };
  }
}

export async function deleteDiscussion(discussionId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("book_club_discussions")
      .delete()
      .eq("id", discussionId);

    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete discussion." };
  }
}

export async function setDiscussionPinned(
  discussionId: string,
  isPinned: boolean
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("book_club_discussions")
      .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
      .eq("id", discussionId);
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update pin." };
  }
}

export async function setDiscussionLocked(
  discussionId: string,
  isLocked: boolean
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("book_club_discussions")
      .update({ is_locked: isLocked, updated_at: new Date().toISOString() })
      .eq("id", discussionId);
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update lock." };
  }
}

export async function listReplies(
  discussionId: string
): Promise<BookClubDiscussionReplyWithAuthor[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_discussion_replies")
    .select(
      `id, discussion_id, club_id, user_id, body, contains_spoilers, created_at, updated_at, profiles!book_club_discussion_replies_user_id_profiles_fkey (${PROFILE_SELECT})`
    )
    .eq("discussion_id", discussionId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  type ReplyRow = {
    id: string;
    discussion_id: string;
    club_id: string;
    user_id: string;
    body: string;
    contains_spoilers: boolean;
    created_at: string;
    updated_at: string;
    profiles: PostAuthor | null;
  };

  return ((data ?? []) as unknown as ReplyRow[]).map((row) => ({
    id: row.id,
    discussion_id: row.discussion_id,
    club_id: row.club_id,
    user_id: row.user_id,
    body: row.body,
    contains_spoilers: row.contains_spoilers,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.profiles ?? fallbackProfile(row.user_id),
  }));
}

export async function createReply(
  discussionId: string,
  body: string,
  options?: { containsSpoilers?: boolean }
): Promise<{ error?: string; replyId?: string }> {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Write a reply." };

  try {
    const { supabase, user } = await requireUser();

    const { data: discussion, error: discussionError } = await supabase
      .from("book_club_discussions")
      .select("id, club_id, is_locked")
      .eq("id", discussionId)
      .maybeSingle();

    if (discussionError) return { error: discussionError.message };
    if (!discussion) return { error: "Discussion not found." };
    if (discussion.is_locked) return { error: "This discussion is locked." };

    const { data: inserted, error } = await supabase
      .from("book_club_discussion_replies")
      .insert({
        discussion_id: discussionId,
        club_id: discussion.club_id,
        user_id: user.id,
        body: trimmed,
        contains_spoilers: options?.containsSpoilers ?? false,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    return { replyId: inserted?.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not post reply." };
  }
}

export async function deleteReply(replyId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("book_club_discussion_replies")
      .delete()
      .eq("id", replyId);
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete reply." };
  }
}

export type ToggleReactionTarget =
  | { discussionId: string; replyId?: never }
  | { replyId: string; discussionId?: never };

export async function toggleReaction(
  target: ToggleReactionTarget,
  emoji: string
): Promise<{ error?: string; active?: boolean }> {
  const trimmed = emoji.trim();
  if (!trimmed) return { error: "Emoji is required." };

  try {
    const { supabase, user } = await requireUser();

    let query = supabase
      .from("book_club_discussion_reactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("emoji", trimmed);

    if (target.discussionId) {
      query = query.eq("discussion_id", target.discussionId).is("reply_id", null);
    } else {
      query = query.eq("reply_id", target.replyId).is("discussion_id", null);
    }

    const { data: existing, error: existingError } = await query.maybeSingle();
    if (existingError) return { error: existingError.message };

    if (existing) {
      const { error } = await supabase
        .from("book_club_discussion_reactions")
        .delete()
        .eq("id", existing.id);
      if (error) return { error: error.message };
      return { active: false };
    }

    const { error } = await supabase.from("book_club_discussion_reactions").insert({
      user_id: user.id,
      emoji: trimmed,
      discussion_id: target.discussionId ?? null,
      reply_id: target.replyId ?? null,
    });
    if (error) return { error: error.message };
    return { active: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not toggle reaction." };
  }
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export async function listInvitations(
  viewerId: string
): Promise<BookClubInvitationWithDetails[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_invitations")
    .select(
      `id, club_id, inviter_id, invitee_id, message, status, created_at, updated_at, responded_at,
       club:book_clubs!book_club_invitations_club_id_fkey (id, name, image_url, visibility, description),
       inviter:profiles!book_club_invitations_inviter_profiles_fkey (${PROFILE_SELECT})`
    )
    .eq("invitee_id", viewerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  type InvitationRow = {
    id: string;
    club_id: string;
    inviter_id: string;
    invitee_id: string;
    message: string | null;
    status: BookClubInvitationWithDetails["status"];
    created_at: string;
    updated_at: string;
    responded_at: string | null;
    club:
      | BookClubInvitationWithDetails["club"]
      | BookClubInvitationWithDetails["club"][]
      | null;
    inviter: MessageProfile | MessageProfile[] | null;
  };

  return ((data ?? []) as unknown as InvitationRow[]).flatMap((row) => {
    const club = Array.isArray(row.club) ? row.club[0] : row.club;
    const inviter = Array.isArray(row.inviter) ? row.inviter[0] : row.inviter;
    if (!club) return [];
    return [
      {
        id: row.id,
        club_id: row.club_id,
        inviter_id: row.inviter_id,
        invitee_id: row.invitee_id,
        message: row.message,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        responded_at: row.responded_at,
        club,
        inviter: inviter ?? fallbackProfile(row.inviter_id),
      },
    ];
  });
}

export async function sendInvitations(
  clubId: string,
  inviteeIds: string[],
  message?: string | null
): Promise<{ error?: string; invitationIds?: string[] }> {
  const uniqueIds = [...new Set(inviteeIds.map((id) => id.trim()).filter(Boolean))];
  if (!uniqueIds.length) return { error: "Select at least one person to invite." };

  try {
    const { supabase, user } = await requireUser();
    const trimmedMessage = message?.trim() || null;

    const rows = uniqueIds
      .filter((id) => id !== user.id)
      .map((inviteeId) => ({
        club_id: clubId,
        inviter_id: user.id,
        invitee_id: inviteeId,
        message: trimmedMessage,
        status: "pending" as const,
      }));

    if (!rows.length) return { error: "You can't invite yourself." };

    const { data, error } = await supabase
      .from("book_club_invitations")
      .insert(rows)
      .select("id");

    if (error) return { error: error.message };
    return { invitationIds: (data ?? []).map((row) => row.id) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not send invitations." };
  }
}

export async function cancelInvitation(invitationId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("book_club_invitations")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("id", invitationId)
      .eq("status", "pending");
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not cancel invitation." };
  }
}

export async function acceptInvitation(
  invitationId: string
): Promise<{ error?: string; memberId?: string }> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("accept_book_club_invitation", {
      p_invitation_id: invitationId,
    });
    if (error) return { error: error.message };
    return { memberId: typeof data === "string" ? data : undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not accept invitation." };
  }
}

export async function declineInvitation(invitationId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("decline_book_club_invitation", {
      p_invitation_id: invitationId,
    });
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not decline invitation." };
  }
}

// ---------------------------------------------------------------------------
// Join requests
// ---------------------------------------------------------------------------

export async function listJoinRequests(
  clubId: string
): Promise<BookClubJoinRequestWithDetails[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_join_requests")
    .select(
      `id, club_id, user_id, message, status, reviewed_by, created_at, updated_at, reviewed_at,
       requester:profiles!book_club_join_requests_user_profiles_fkey (${PROFILE_SELECT})`
    )
    .eq("club_id", clubId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;

  type RequestRow = {
    id: string;
    club_id: string;
    user_id: string;
    message: string | null;
    status: BookClubJoinRequestWithDetails["status"];
    reviewed_by: string | null;
    created_at: string;
    updated_at: string;
    reviewed_at: string | null;
    requester: MessageProfile | MessageProfile[] | null;
  };

  return ((data ?? []) as unknown as RequestRow[]).map((row) => {
    const requester = Array.isArray(row.requester) ? row.requester[0] : row.requester;
    return {
      id: row.id,
      club_id: row.club_id,
      user_id: row.user_id,
      message: row.message,
      status: row.status,
      reviewed_by: row.reviewed_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      reviewed_at: row.reviewed_at,
      requester: requester ?? fallbackProfile(row.user_id),
    };
  });
}

export async function requestToJoin(
  clubId: string,
  message?: string | null
): Promise<{ error?: string; requestId?: string }> {
  try {
    const { supabase, user } = await requireUser();

    const { data: existingMember } = await supabase
      .from("book_club_members")
      .select("membership_status")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember?.membership_status === "active") {
      return { error: "You're already a member." };
    }
    if (existingMember?.membership_status === "banned") {
      return { error: "You are banned from this club." };
    }

    const { data: inserted, error } = await supabase
      .from("book_club_join_requests")
      .insert({
        club_id: clubId,
        user_id: user.id,
        message: message?.trim() || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "You already have a pending request." };
      }
      return { error: error.message };
    }

    return { requestId: inserted?.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not request to join." };
  }
}

export async function approveJoinRequest(
  requestId: string
): Promise<{ error?: string; memberId?: string }> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("approve_book_club_join_request", {
      p_request_id: requestId,
    });
    if (error) return { error: error.message };
    return { memberId: typeof data === "string" ? data : undefined };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not approve request." };
  }
}

export async function declineJoinRequest(requestId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.rpc("decline_book_club_join_request", {
      p_request_id: requestId,
    });
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not decline request." };
  }
}

// ---------------------------------------------------------------------------
// Group conversation
// ---------------------------------------------------------------------------

export async function ensureClubGroupConversation(
  clubId: string
): Promise<{ conversationId?: string; error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("ensure_book_club_group_conversation", {
      p_club_id: clubId,
    });
    if (error) return { error: error.message };
    return { conversationId: typeof data === "string" ? data : undefined };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not open club conversation.",
    };
  }
}

export async function getClubConversationId(clubId: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("book_club_group_conversations")
    .select("conversation_id")
    .eq("club_id", clubId)
    .maybeSingle();

  if (error) throw error;
  return data?.conversation_id ?? null;
}

// ---------------------------------------------------------------------------
// Bookshelf
// ---------------------------------------------------------------------------

export async function listClubBooks(clubId: string): Promise<BookClubShelfBook[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_books")
    .select("id, club_id, book_id, category, added_by, sort_order, created_at, updated_at")
    .eq("club_id", clubId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as BookClubShelfBook[];
  const bookById = await hydrateBooks(
    supabase,
    rows.map((row) => row.book_id)
  );

  return rows.map((row) => ({
    ...row,
    category: row.category as BookClubBookCategory,
    book: bookById.get(row.book_id) ?? null,
  }));
}

export async function addClubBook(
  clubId: string,
  bookId: string,
  category: BookClubBookCategory = "suggested"
): Promise<{ error?: string; shelfBookId?: string }> {
  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("book_club_books")
      .insert({
        club_id: clubId,
        book_id: bookId,
        category,
        added_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "That book is already on the club shelf." };
      }
      return { error: error.message };
    }
    return { shelfBookId: data?.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not add book." };
  }
}

export async function removeClubBook(shelfBookId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("book_club_books").delete().eq("id", shelfBookId);
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not remove book." };
  }
}

export async function setClubBookCategory(
  shelfBookId: string,
  category: BookClubBookCategory
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("book_club_books")
      .update({ category, updated_at: new Date().toISOString() })
      .eq("id", shelfBookId);
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update category." };
  }
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export async function listAnnouncements(
  clubId: string
): Promise<BookClubAnnouncementWithAuthor[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_announcements")
    .select(
      "id, club_id, created_by, title, body, linked_event_id, related_book_id, is_pinned, published_at, created_at, updated_at"
    )
    .eq("club_id", clubId)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const rows = data ?? [];
  const profiles = await hydrateProfiles(
    supabase,
    rows.map((row) => row.created_by as string)
  );

  return rows.map((row) => ({
    id: row.id as string,
    club_id: row.club_id as string,
    created_by: row.created_by as string,
    title: row.title as string,
    body: row.body as string,
    linked_event_id: (row.linked_event_id as string | null) ?? null,
    related_book_id: (row.related_book_id as string | null) ?? null,
    is_pinned: Boolean(row.is_pinned),
    published_at: row.published_at as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author: profiles.get(row.created_by as string) ?? fallbackProfile(row.created_by as string),
  }));
}

export type CreateAnnouncementInput = {
  title: string;
  body: string;
  linkedEventId?: string | null;
  relatedBookId?: string | null;
  isPinned?: boolean;
};

export async function createAnnouncement(
  clubId: string,
  input: CreateAnnouncementInput
): Promise<{ error?: string; announcementId?: string }> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return { error: "Announcement title is required." };
  if (!body) return { error: "Announcement body is required." };

  try {
    const { supabase, user } = await requireUser();
    const { data, error } = await supabase
      .from("book_club_announcements")
      .insert({
        club_id: clubId,
        created_by: user.id,
        title,
        body,
        linked_event_id: input.linkedEventId ?? null,
        related_book_id: input.relatedBookId ?? null,
        is_pinned: input.isPinned ?? false,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    return { announcementId: data?.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create announcement." };
  }
}

export async function deleteAnnouncement(announcementId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("book_club_announcements")
      .delete()
      .eq("id", announcementId);
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete announcement." };
  }
}

// ---------------------------------------------------------------------------
// Stats + share
// ---------------------------------------------------------------------------

export async function getClubStats(clubId: string): Promise<BookClubStats> {
  const supabase = createClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [
    membersRes,
    discussionsRes,
    repliesRes,
    eventsRes,
    rsvpsRes,
    booksRes,
    growthRes,
  ] = await Promise.all([
    supabase
      .from("book_club_members")
      .select("id, membership_status", { count: "exact" })
      .eq("club_id", clubId),
    supabase
      .from("book_club_discussions")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId),
    supabase
      .from("book_club_discussion_replies")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId),
    supabase
      .from("book_club_events")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId),
    supabase
      .from("book_club_event_attendees")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("rsvp_status", "going"),
    supabase
      .from("book_club_books")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("category", "previous"),
    supabase
      .from("book_club_members")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("membership_status", "active")
      .gte("joined_at", sinceIso),
  ]);

  if (membersRes.error) throw membersRes.error;
  if (discussionsRes.error) throw discussionsRes.error;
  if (repliesRes.error) throw repliesRes.error;
  if (eventsRes.error) throw eventsRes.error;
  if (rsvpsRes.error) throw rsvpsRes.error;
  if (booksRes.error) throw booksRes.error;
  if (growthRes.error) throw growthRes.error;

  const members = membersRes.data ?? [];
  const activeMembers = members.filter((m) => m.membership_status === "active").length;

  return {
    total_members: members.length,
    active_members: activeMembers,
    discussions_created: discussionsRes.count ?? 0,
    replies_posted: repliesRes.count ?? 0,
    events_created: eventsRes.count ?? 0,
    rsvp_participation: rsvpsRes.count ?? 0,
    books_completed: booksRes.count ?? 0,
    member_growth_30d: growthRes.count ?? 0,
  };
}

export async function shareClubToFeed(clubId: string): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();

    const { data: club, error: clubError } = await supabase
      .from("book_clubs")
      .select("id, name, description, image_url, visibility, member_count")
      .eq("id", clubId)
      .maybeSingle();

    if (clubError) return { error: clubError.message };
    if (!club) return { error: "Club not found." };

    if (!canShareClubToFeed(club.visibility as BookClubVisibility)) {
      return { error: "Only public clubs can be shared to the feed." };
    }

    const { data: membership } = await supabase
      .from("book_club_members")
      .select("role")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("membership_status", "active")
      .maybeSingle();

    if (!membership) return { error: "Only members can share this club." };

    await recordActivity(supabase, {
      user_id: user.id,
      event_type: "club_shared",
      entity_type: "book_club",
      entity_id: clubId,
      visibility: "public",
      metadata_json: clubSharedMetadata({
        clubId: club.id,
        clubName: club.name,
        description: club.description,
        imageUrl: club.image_url,
        memberCount: club.member_count,
      }),
    });

    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not share club." };
  }
}

export async function deleteClub(clubId: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("book_clubs").delete().eq("id", clubId);
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete club." };
  }
}

export function clubDisplayName(club: Pick<BookClub, "name">): string {
  return club.name?.trim() || "Book club";
}
