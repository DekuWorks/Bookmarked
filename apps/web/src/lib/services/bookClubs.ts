import { createClient } from "@/lib/supabase/client";
import { clubDiscussionMetadata, recordActivity } from "@/lib/services/activity";
import type {
  BookClub,
  BookClubBook,
  BookClubMemberRole,
  BookClubMemberWithProfile,
  BookClubPostWithAuthor,
  BookClubSummary,
  BookClubVisibility,
  BookClubWithDetails,
  MessageProfile,
  PostAuthor,
} from "@/types";

const PROFILE_SELECT = "id, username, display_name, avatar_url";
const BOOK_SELECT = "id, title, author, cover_url";

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

/**
 * Annotate raw club rows with member counts, the viewer's membership, and the
 * current book. Batched `.in(...)` lookups mirror the hydration approach used
 * across the posts/messages services (avoids deep joins + RLS recursion).
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

  const [{ data: memberRows, error: memberError }, { data: viewerRows, error: viewerError }] =
    await Promise.all([
      supabase.from("book_club_members").select("club_id").in("club_id", clubIds),
      supabase
        .from("book_club_members")
        .select("club_id, role")
        .eq("user_id", viewerId)
        .in("club_id", clubIds),
    ]);

  if (memberError) throw memberError;
  if (viewerError) throw viewerError;

  const countByClub = new Map<string, number>();
  for (const row of memberRows ?? []) {
    countByClub.set(row.club_id, (countByClub.get(row.club_id) ?? 0) + 1);
  }

  const viewerRoleByClub = new Map<string, BookClubMemberRole>();
  for (const row of viewerRows ?? []) {
    viewerRoleByClub.set(row.club_id, row.role as BookClubMemberRole);
  }

  const bookById = new Map<string, BookClubBook>();
  if (bookIds.length) {
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select(BOOK_SELECT)
      .in("id", bookIds);
    if (booksError) throw booksError;
    for (const book of (books ?? []) as BookClubBook[]) {
      bookById.set(book.id, book);
    }
  }

  return clubs.map((club) => {
    const viewerRole = viewerRoleByClub.get(club.id) ?? null;
    return {
      ...club,
      member_count: countByClub.get(club.id) ?? 0,
      viewer_is_member: viewerRole !== null,
      viewer_role: viewerRole,
      current_book: club.current_book_id ? bookById.get(club.current_book_id) ?? null : null,
    };
  });
}

/** Public clubs to browse (discover), most recent first. */
export async function discoverClubs(viewerId: string, limit = 50): Promise<BookClubSummary[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_clubs")
    .select("*")
    .eq("visibility", "public")
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
    .eq("user_id", viewerId);

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
 * allowed to see (public clubs, or private clubs they also belong to), which is
 * exactly the visibility we want on a public profile.
 */
export async function getUserClubs(
  targetUserId: string,
  viewerId: string
): Promise<BookClubSummary[]> {
  const supabase = createClient();

  const { data: memberships, error: membershipError } = await supabase
    .from("book_club_members")
    .select("club_id")
    .eq("user_id", targetUserId);

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
      `id, club_id, user_id, role, joined_at, profiles!book_club_members_user_id_profiles_fkey (${PROFILE_SELECT})`
    )
    .eq("club_id", clubId)
    .order("joined_at", { ascending: true });

  if (error) throw error;

  type MemberRow = {
    id: string;
    club_id: string;
    user_id: string;
    role: BookClubMemberRole;
    joined_at: string;
    profiles: MessageProfile | null;
  };

  return ((data ?? []) as unknown as MemberRow[]).map((row) => ({
    id: row.id,
    club_id: row.club_id,
    user_id: row.user_id,
    role: row.role,
    joined_at: row.joined_at,
    profile: row.profiles ?? {
      id: row.user_id,
      username: null,
      display_name: null,
      avatar_url: null,
    },
  }));
}

export async function listDiscussions(clubId: string): Promise<BookClubPostWithAuthor[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_posts")
    .select(
      `id, club_id, user_id, body, book_id, created_at, updated_at, profiles!book_club_posts_user_id_profiles_fkey (${PROFILE_SELECT})`
    )
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  type PostRow = {
    id: string;
    club_id: string;
    user_id: string;
    body: string;
    book_id: string | null;
    created_at: string;
    updated_at: string;
    profiles: PostAuthor | null;
  };

  const rows = (data ?? []) as unknown as PostRow[];

  const bookIds = [
    ...new Set(rows.map((r) => r.book_id).filter((id): id is string => Boolean(id))),
  ];
  const bookById = new Map<string, BookClubBook>();
  if (bookIds.length) {
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select(BOOK_SELECT)
      .in("id", bookIds);
    if (booksError) throw booksError;
    for (const book of (books ?? []) as BookClubBook[]) {
      bookById.set(book.id, book);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    club_id: row.club_id,
    user_id: row.user_id,
    body: row.body,
    book_id: row.book_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.profiles ?? {
      id: row.user_id,
      username: null,
      display_name: null,
      avatar_url: null,
    },
    book: row.book_id ? bookById.get(row.book_id) ?? null : null,
  }));
}

/**
 * Fetch and hydrate a single discussion (author profile + optional book),
 * mirroring `listDiscussions`. Used to hydrate posts arriving over Realtime so
 * they can be prepended without a full refetch. Returns null if the viewer
 * can't see the post (RLS) or it no longer exists.
 */
export async function getDiscussion(
  clubId: string,
  postId: string
): Promise<BookClubPostWithAuthor | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("book_club_posts")
    .select(
      `id, club_id, user_id, body, book_id, created_at, updated_at, profiles!book_club_posts_user_id_profiles_fkey (${PROFILE_SELECT})`
    )
    .eq("id", postId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  type PostRow = {
    id: string;
    club_id: string;
    user_id: string;
    body: string;
    book_id: string | null;
    created_at: string;
    updated_at: string;
    profiles: PostAuthor | null;
  };

  const row = data as unknown as PostRow;

  let book: BookClubBook | null = null;
  if (row.book_id) {
    const { data: bookRow } = await supabase
      .from("books")
      .select(BOOK_SELECT)
      .eq("id", row.book_id)
      .maybeSingle();
    book = (bookRow as BookClubBook | null) ?? null;
  }

  return {
    id: row.id,
    club_id: row.club_id,
    user_id: row.user_id,
    body: row.body,
    book_id: row.book_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: row.profiles ?? {
      id: row.user_id,
      username: null,
      display_name: null,
      avatar_url: null,
    },
    book,
  };
}

export type CreateClubInput = {
  name: string;
  description?: string | null;
  visibility?: BookClubVisibility;
  imageUrl?: string | null;
  currentBookId?: string | null;
};

export async function createClub(
  input: CreateClubInput
): Promise<{ clubId?: string; error?: string }> {
  const name = input.name.trim();
  if (!name) return { error: "Club name is required." };

  try {
    const { supabase, user } = await requireUser();

    const { data: club, error: clubError } = await supabase
      .from("book_clubs")
      .insert({
        owner_id: user.id,
        name,
        description: input.description?.trim() || null,
        visibility: input.visibility ?? "public",
        image_url: input.imageUrl?.trim() || null,
        current_book_id: input.currentBookId ?? null,
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
    });

    if (memberError) return { error: memberError.message };

    return { clubId: club.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create club." };
  }
}

export async function joinClub(clubId: string): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();

    const { error } = await supabase.from("book_club_members").insert({
      club_id: clubId,
      user_id: user.id,
      role: "member",
    });

    if (error) {
      // Unique violation → already a member; treat as success.
      if (error.code === "23505") return {};
      return { error: error.message };
    }
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
      .delete()
      .eq("club_id", clubId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
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
      .delete()
      .eq("club_id", clubId)
      .eq("user_id", memberUserId);

    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not remove member." };
  }
}

export type UpdateClubInput = {
  name?: string;
  description?: string | null;
  visibility?: BookClubVisibility;
  imageUrl?: string | null;
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
    if (input.imageUrl !== undefined) patch.image_url = input.imageUrl?.trim() || null;

    const { error } = await supabase.from("book_clubs").update(patch).eq("id", clubId);
    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update club." };
  }
}

export async function setCurrentBook(
  clubId: string,
  bookId: string | null
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireUser();

    const { error } = await supabase
      .from("book_clubs")
      .update({ current_book_id: bookId, updated_at: new Date().toISOString() })
      .eq("id", clubId);

    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not set current book." };
  }
}

export async function createDiscussion(
  clubId: string,
  body: string,
  bookId?: string | null
): Promise<{ error?: string }> {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Write something to start a discussion." };

  try {
    const { supabase, user } = await requireUser();

    const { data: inserted, error } = await supabase
      .from("book_club_posts")
      .insert({
        club_id: clubId,
        user_id: user.id,
        body: trimmed,
        book_id: bookId ?? null,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };

    await supabase
      .from("book_clubs")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", clubId);

    // Surface the new discussion in the activity feed. Only emit for PUBLIC
    // clubs: the feed query filters by visibility/follows, not club membership,
    // so a private club's name/discussion would otherwise leak to non-members.
    try {
      const { data: club } = await supabase
        .from("book_clubs")
        .select("name, visibility")
        .eq("id", clubId)
        .maybeSingle();

      if (club && club.visibility === "public" && inserted) {
        let book: BookClubBook | null = null;
        if (bookId) {
          const { data: bookRow } = await supabase
            .from("books")
            .select(BOOK_SELECT)
            .eq("id", bookId)
            .maybeSingle();
          book = (bookRow as BookClubBook | null) ?? null;
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
            bodySnippet: trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed,
            book,
          }),
        });
      }
    } catch (activityError) {
      // Activity is best-effort — never fail the discussion on feed errors.
      console.warn("[book-clubs] activity record failed:", activityError);
    }

    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not post discussion." };
  }
}

export async function deleteDiscussion(postId: string): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();

    const { error } = await supabase
      .from("book_club_posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete discussion." };
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
