import { supabase } from "./supabase";
import type {
  BookClub,
  BookClubBook,
  BookClubMemberRole,
  BookClubMemberWithProfile,
  BookClubPostWithAuthor,
  BookClubSummary,
  BookClubWithDetails,
  MessageProfile,
  PostAuthor,
} from "../types";

/**
 * Mobile Book Clubs service. Mirrors the web service
 * (apps/web/src/lib/services/bookClubs.ts) against the same Supabase tables
 * (`book_clubs`, `book_club_members`, `book_club_posts`) and RLS. Uses batched
 * `.in(...)` hydration instead of deep joins to avoid RLS recursion.
 *
 * Scope for the mobile foundation: read (discover / my clubs / detail / members
 * / discussions) + join / leave / post discussion. Owner management (create,
 * edit, set current book, remove member, delete) stays on the web app for now.
 */

const PROFILE_SELECT = "id, username, display_name, avatar_url";
const BOOK_SELECT = "id, title, author, cover_url";

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be signed in.");
  return user;
}

type ClubRow = BookClub;

async function summarizeClubs(
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
  const { data, error } = await supabase
    .from("book_clubs")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return summarizeClubs((data ?? []) as ClubRow[], viewerId);
}

/** Clubs the viewer belongs to (owned or joined). */
export async function getMyClubs(viewerId: string): Promise<BookClubSummary[]> {
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
  return summarizeClubs((data ?? []) as ClubRow[], viewerId);
}

export async function getClub(
  clubId: string,
  viewerId: string
): Promise<BookClubWithDetails | null> {
  const { data: club, error } = await supabase
    .from("book_clubs")
    .select("*")
    .eq("id", clubId)
    .maybeSingle();

  if (error) throw error;
  if (!club) return null;

  const [summaries, members] = await Promise.all([
    summarizeClubs([club as ClubRow], viewerId),
    listMembers(clubId),
  ]);

  const summary = summaries[0];
  if (!summary) return null;

  return { ...summary, members };
}

export async function listMembers(clubId: string): Promise<BookClubMemberWithProfile[]> {
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

export async function joinClub(clubId: string): Promise<{ error?: string }> {
  try {
    const user = await requireUser();

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
    const user = await requireUser();

    const { data: club } = await supabase
      .from("book_clubs")
      .select("owner_id")
      .eq("id", clubId)
      .maybeSingle();

    if (club?.owner_id === user.id) {
      return { error: "Owners can't leave their own club. Manage it on the web app." };
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

export async function createDiscussion(
  clubId: string,
  body: string,
  bookId?: string | null
): Promise<{ error?: string }> {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Write something to start a discussion." };

  try {
    const user = await requireUser();

    const { error } = await supabase.from("book_club_posts").insert({
      club_id: clubId,
      user_id: user.id,
      body: trimmed,
      book_id: bookId ?? null,
    });

    if (error) return { error: error.message };

    await supabase
      .from("book_clubs")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", clubId);

    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not post discussion." };
  }
}

export function clubDisplayName(club: Pick<BookClub, "name">): string {
  return club.name?.trim() || "Book club";
}
