import { createClient } from "@/lib/supabase/client";
import { requireModeration } from "@/lib/services/moderateUgc";
import { notifyChallengeEvent } from "@/lib/services/challenges/challengeNotifications";
import {
  USAGE_COUNTER_KEYS,
  periodKeyForCounter,
} from "@bookmarked/utils/usageCounters";
import {
  ENTITLEMENT_LIMIT_MESSAGES,
  canCreateReadingChallenge,
  canJoinReadingChallenge,
  challengeRecordConsumesYearlySlot,
  getEntitlements,
  toSubscriptionAccessFromRow,
} from "@/lib/utils/subscription";
import {
  calculateChallengeProgress,
  primaryProgressFromObjectives,
  summarizeObjectiveProgress,
  unitForGoalType,
} from "@bookmarked/utils/challengeProgress";
import { timeRemainingLabel } from "@bookmarked/utils/challengeDisplay";
import {
  isChallengeGoalType,
  isChallengeVisibility,
  type ChallengeGoalType,
  type ChallengeInviteStatus,
  type ChallengeMemberStatus,
  type ChallengeObjective,
  type ChallengeObjectiveParams,
  type ChallengeRecord,
  type ChallengeVisibility,
} from "@bookmarked/utils/challengeTypes";

const CHALLENGE_SELECT =
  "id, slug, title, description, cover_url, category, year, starts_at, ends_at, is_active, featured, visibility, owner_kind, created_by, goal_type, goal_amount, allow_same_book_for_multiple_objectives, allow_historical, community_total, community_unit, created_at";

type ChallengeRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category: string | null;
  year: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  featured: boolean | null;
  visibility: string | null;
  owner_kind: string | null;
  created_by: string | null;
  goal_type: string | null;
  goal_amount: number | string | null;
  allow_same_book_for_multiple_objectives: boolean | null;
  allow_historical: boolean | null;
  community_total: number | string | null;
  community_unit: string | null;
  created_at: string;
};

type ObjectiveRow = {
  id: string;
  challenge_id: string;
  rule_type: string;
  title: string;
  sort_order: number;
  target_amount: number | string;
  params: ChallengeObjectiveParams | null;
};

type MemberRow = {
  challenge_id: string;
  user_id: string;
  status: string;
  joined_at: string;
  completed_at: string | null;
  books_completed: number;
  pages_completed: number;
  listening_seconds_completed: number;
};

export type ChallengeCardModel = {
  challenge: ChallengeRecord;
  membershipStatus: ChallengeMemberStatus | null;
  progress: ReturnType<typeof calculateChallengeProgress> | null;
  timeRemaining: string | null;
  objectivePreview: string[];
  completed: boolean;
};

export type ChallengeDetailModel = ChallengeCardModel & {
  objectives: ReturnType<typeof summarizeObjectiveProgress>;
  contributions: Array<{
    userBookId: string;
    bookTitle: string;
    coverUrl: string | null;
    reason: string;
    qualifyingDate: string;
  }>;
  participants: Array<{
    userId: string;
    displayName: string;
    books: number;
    pages: number;
    listeningSeconds: number;
    status: ChallengeMemberStatus;
  }>;
  invites: Array<{
    id: string;
    inviteeId: string;
    status: ChallengeInviteStatus;
  }>;
};

function mapChallenge(row: ChallengeRow): ChallengeRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    cover_url: row.cover_url,
    category: row.category,
    year: row.year,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    is_active: row.is_active,
    featured: Boolean(row.featured),
    visibility: isChallengeVisibility(row.visibility) ? row.visibility : "public",
    owner_kind: row.owner_kind === "user" ? "user" : "official",
    created_by: row.created_by,
    goal_type: isChallengeGoalType(row.goal_type) ? row.goal_type : "BOOK_COUNT",
    goal_amount: Number(row.goal_amount) || 0,
    allow_same_book_for_multiple_objectives: Boolean(row.allow_same_book_for_multiple_objectives),
    allow_historical: Boolean(row.allow_historical),
    community_total: Number(row.community_total) || 0,
    community_unit:
      row.community_unit === "pages" ||
      row.community_unit === "listening_seconds" ||
      row.community_unit === "objectives"
        ? row.community_unit
        : "books",
    created_at: row.created_at,
  };
}

function mapObjective(row: ObjectiveRow): ChallengeObjective {
  return {
    id: row.id,
    challenge_id: row.challenge_id,
    rule_type: row.rule_type as ChallengeObjective["rule_type"],
    title: row.title,
    sort_order: row.sort_order,
    target_amount: Number(row.target_amount) || 0,
    params: row.params ?? {},
  };
}

function cardFrom(
  challenge: ChallengeRecord,
  member: MemberRow | null,
  preview: string[]
): ChallengeCardModel {
  const completed = member?.status === "completed";
  const progress = member
    ? calculateChallengeProgress({
        current:
          challenge.goal_type === "PAGE_COUNT"
            ? member.pages_completed
            : challenge.goal_type === "LISTENING_TIME"
              ? member.listening_seconds_completed
              : member.books_completed,
        target: challenge.goal_amount,
        unit: unitForGoalType(challenge.goal_type),
      })
    : null;
  return {
    challenge,
    membershipStatus: (member?.status as ChallengeMemberStatus | undefined) ?? null,
    progress,
    timeRemaining: completed ? null : timeRemainingLabel(challenge.ends_at),
    objectivePreview: preview.slice(0, 3),
    completed: Boolean(completed),
  };
}

export async function listChallengeCatalog(): Promise<{
  featured: ChallengeCardModel[];
  yours: ChallengeCardModel[];
  completed: ChallengeCardModel[];
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: challengeRows, error } = await supabase
    .from("reading_challenges")
    .select(CHALLENGE_SELECT)
    .order("featured", { ascending: false })
    .order("year", { ascending: false });

  if (error) {
    console.warn("[ChallengeService] list failed:", error.message);
    return { featured: [], yours: [], completed: [] };
  }

  const challenges = ((challengeRows ?? []) as ChallengeRow[]).map(mapChallenge);
  const ids = challenges.map((row) => row.id);

  const [{ data: objectiveRows }, { data: memberRows }] = await Promise.all([
    ids.length
      ? supabase
          .from("reading_challenge_objectives")
          .select("id, challenge_id, rule_type, title, sort_order, target_amount, params")
          .in("challenge_id", ids)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] }),
    user
      ? supabase
          .from("reading_challenge_members")
          .select(
            "challenge_id, user_id, status, joined_at, completed_at, books_completed, pages_completed, listening_seconds_completed"
          )
          .eq("user_id", user.id)
          .in("challenge_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
      : Promise.resolve({ data: [] }),
  ]);

  const previewByChallenge = new Map<string, string[]>();
  for (const row of (objectiveRows ?? []) as ObjectiveRow[]) {
    const list = previewByChallenge.get(row.challenge_id) ?? [];
    if (list.length < 3) list.push(row.title);
    previewByChallenge.set(row.challenge_id, list);
  }

  const memberByChallenge = new Map<string, MemberRow>();
  for (const row of (memberRows ?? []) as MemberRow[]) {
    memberByChallenge.set(row.challenge_id, row);
  }

  const featured: ChallengeCardModel[] = [];
  const yours: ChallengeCardModel[] = [];
  const completed: ChallengeCardModel[] = [];

  for (const challenge of challenges) {
    const member = memberByChallenge.get(challenge.id) ?? null;
    const card = cardFrom(challenge, member, previewByChallenge.get(challenge.id) ?? []);
    if (member?.status === "completed") completed.push(card);
    else if (member && member.status !== "left") yours.push(card);
    if (challenge.featured && challenge.visibility === "public") featured.push(card);
  }

  return { featured, yours, completed };
}

export async function getChallengeDetail(challengeId: string): Promise<ChallengeDetailModel | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: challengeRow, error } = await supabase
    .from("reading_challenges")
    .select(CHALLENGE_SELECT)
    .eq("id", challengeId)
    .maybeSingle();

  if (error || !challengeRow) return null;
  const challenge = mapChallenge(challengeRow as ChallengeRow);

  const [{ data: objectiveRows }, { data: memberRows }, { data: contributionRows }, { data: inviteRows }] =
    await Promise.all([
      supabase
        .from("reading_challenge_objectives")
        .select("id, challenge_id, rule_type, title, sort_order, target_amount, params")
        .eq("challenge_id", challengeId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("reading_challenge_members")
        .select(
          "challenge_id, user_id, status, joined_at, completed_at, books_completed, pages_completed, listening_seconds_completed"
        )
        .eq("challenge_id", challengeId),
      user
        ? supabase
            .from("reading_challenge_contributions")
            .select("user_book_id, reason, qualifying_date")
            .eq("challenge_id", challengeId)
            .eq("user_id", user.id)
            .order("qualifying_date", { ascending: false })
        : Promise.resolve({ data: [] }),
      user
        ? supabase
            .from("reading_challenge_invites")
            .select("id, invitee_id, status")
            .eq("challenge_id", challengeId)
            .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`)
        : Promise.resolve({ data: [] }),
    ]);

  const objectives = ((objectiveRows ?? []) as ObjectiveRow[]).map(mapObjective);
  const members = (memberRows ?? []) as MemberRow[];
  const own = members.find((row) => row.user_id === user?.id) ?? null;

  const { data: progressRows } = user
    ? await supabase
        .from("reading_challenge_progress")
        .select("objective_id, current_amount")
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id)
    : { data: [] };

  const amounts: Record<string, number> = {};
  for (const row of progressRows ?? []) {
    amounts[row.objective_id as string] = Number(row.current_amount) || 0;
  }
  const objectiveProgress = summarizeObjectiveProgress(objectives, amounts);
  const progress = own
    ? primaryProgressFromObjectives({
        goalType: challenge.goal_type,
        goalAmount: challenge.goal_amount,
        books: own.books_completed,
        pages: own.pages_completed,
        listeningSeconds: own.listening_seconds_completed,
        objectives: objectiveProgress,
      })
    : null;

  const userBookIds = [...new Set(((contributionRows ?? []) as Array<{ user_book_id: string }>).map((row) => row.user_book_id))];
  const bookTitles = new Map<string, { title: string; cover: string | null }>();
  if (userBookIds.length) {
    const { data: books } = await supabase
      .from("user_books")
      .select("id, books(title, cover_url)")
      .in("id", userBookIds);
    for (const row of books ?? []) {
      const book = row.books as { title?: string; cover_url?: string | null } | { title?: string; cover_url?: string | null }[] | null;
      const info = Array.isArray(book) ? book[0] : book;
      bookTitles.set(row.id as string, {
        title: info?.title ?? "Book",
        cover: info?.cover_url ?? null,
      });
    }
  }

  const participantIds = members.map((row) => row.user_id);
  const { data: profiles } = participantIds.length
    ? await supabase.from("profiles").select("id, display_name, username").in("id", participantIds)
    : { data: [] };
  const nameById = new Map(
    (profiles ?? []).map((row) => [
      row.id as string,
      (row.display_name as string | null) || (row.username as string | null) || "Reader",
    ])
  );

  return {
    ...cardFrom(
      challenge,
      own,
      objectives.map((item) => item.title)
    ),
    progress,
    objectives: objectiveProgress,
    contributions: ((contributionRows ?? []) as Array<{
      user_book_id: string;
      reason: string;
      qualifying_date: string;
    }>).map((row) => ({
      userBookId: row.user_book_id,
      bookTitle: bookTitles.get(row.user_book_id)?.title ?? "Book",
      coverUrl: bookTitles.get(row.user_book_id)?.cover ?? null,
      reason: row.reason,
      qualifyingDate: row.qualifying_date,
    })),
    participants: members
      .filter((row) => row.status !== "left")
      .map((row) => ({
        userId: row.user_id,
        displayName: nameById.get(row.user_id) ?? "Reader",
        books: row.books_completed,
        pages: row.pages_completed,
        listeningSeconds: row.listening_seconds_completed,
        status: row.status as ChallengeMemberStatus,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    invites: ((inviteRows ?? []) as Array<{ id: string; invitee_id: string; status: string }>).map((row) => ({
      id: row.id,
      inviteeId: row.invitee_id,
      status: row.status as ChallengeInviteStatus,
    })),
  };
}

export async function joinChallenge(challengeId: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: existing } = await supabase
    .from("reading_challenge_members")
    .select("challenge_id, status")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing && existing.status !== "left") return {};

  const year = new Date().getUTCFullYear();
  const [{ data: challengeRow }, { count, error: countError }, { data: subscription }] = await Promise.all([
    supabase
      .from("reading_challenges")
      .select("owner_kind, featured, visibility")
      .eq("id", challengeId)
      .maybeSingle(),
    supabase
      .from("reading_challenge_members")
      .select("challenge_id, reading_challenges!inner(year, owner_kind, featured)", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .eq("reading_challenges.year", year)
      .neq("reading_challenges.owner_kind", "official")
      .eq("reading_challenges.featured", false),
    supabase
      .from("user_subscriptions")
      .select("subscription_tier, subscription_status, subscription_expires_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const consumesSlot = challengeRecordConsumesYearlySlot({
    ownerKind: challengeRow?.owner_kind,
    featured: Boolean(challengeRow?.featured),
    visibility: challengeRow?.visibility,
    isRejoin: Boolean(existing),
  });

  if (consumesSlot) {
    if (countError) {
      console.warn("[ChallengeService] count query:", countError.message);
    }

    const access = toSubscriptionAccessFromRow(subscription);
    if (!canJoinReadingChallenge(count ?? 0, access)) {
      return { error: ENTITLEMENT_LIMIT_MESSAGES.reading_challenges };
    }

    const entitlements = getEntitlements(access);
    const limit = entitlements.readingChallengesPerYear;
    const periodKey = periodKeyForCounter(USAGE_COUNTER_KEYS.readingChallenges);
    const rpcLimit = Number.isFinite(limit) ? limit : 1_000_000;

    const { data: usageResult, error: usageError } = await supabase.rpc("try_increment_usage_counter", {
      p_counter_key: USAGE_COUNTER_KEYS.readingChallenges,
      p_period_key: periodKey,
      p_limit: rpcLimit,
    });

    if (usageError) return { error: usageError.message };
    if (!(usageResult as { ok?: boolean } | null)?.ok) {
      return { error: ENTITLEMENT_LIMIT_MESSAGES.reading_challenges };
    }
  }

  if (existing) {
    const { error } = await supabase
      .from("reading_challenge_members")
      .update({ status: "active" })
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id);
    return error ? { error: error.message } : {};
  }

  const { error } = await supabase.from("reading_challenge_members").insert({
    challenge_id: challengeId,
    user_id: user.id,
  });
  if (error) {
    if (error.code === "23505") return {};
    return { error: error.message };
  }
  return {};
}

export async function leaveChallenge(challengeId: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: existing } = await supabase
    .from("reading_challenge_members")
    .select("status")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) return {};
  if (existing.status === "completed") {
    return { error: "Completed challenges stay on your list." };
  }

  const { error } = await supabase
    .from("reading_challenge_members")
    .update({ status: "left" })
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id);

  return error ? { error: error.message } : {};
}

export async function createChallenge(input: {
  title: string;
  description: string;
  coverUrl?: string | null;
  goalType: ChallengeGoalType;
  goalAmount: number;
  startsAt: string | null;
  endsAt: string | null;
  visibility: ChallengeVisibility;
  category?: string | null;
}): Promise<{ id?: string; error?: string; limitReached?: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("subscription_tier, subscription_status, subscription_expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!canCreateReadingChallenge(toSubscriptionAccessFromRow(subscription))) {
    return { error: ENTITLEMENT_LIMIT_MESSAGES.create_reading_challenge, limitReached: true };
  }

  const titleModeration = await requireModeration({
    text: input.title,
    contentType: "BOOK_CLUB_NAME",
    title: input.title,
  });
  if (titleModeration.error) {
    return { error: titleModeration.error };
  }

  if (input.description.trim()) {
    const bodyModeration = await requireModeration({
      text: input.description,
      contentType: "FEED_POST",
      title: input.title,
    });
    if (bodyModeration.error) {
      return { error: bodyModeration.error };
    }
  }

  const { data, error } = await supabase.rpc("create_user_reading_challenge", {
    p_title: input.title.trim(),
    p_description: input.description.trim(),
    p_cover_url: input.coverUrl ?? null,
    p_goal_type: input.goalType,
    p_goal_amount: input.goalAmount,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_visibility: input.visibility,
    p_category: input.category ?? null,
  });

  if (error) {
    if (/Bookmarked Plus/i.test(error.message)) {
      return { error: ENTITLEMENT_LIMIT_MESSAGES.create_reading_challenge, limitReached: true };
    }
    return { error: error.message };
  }

  return { id: data as string };
}

export async function inviteToChallenge(
  challengeId: string,
  inviteeId: string
): Promise<{ error?: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  if (inviteeId === user.id) return { error: "You are already in this challenge." };

  const { error } = await supabase.from("reading_challenge_invites").insert({
    challenge_id: challengeId,
    inviter_id: user.id,
    invitee_id: inviteeId,
    status: "pending",
  });
  if (error) {
    if (error.code === "23505") return {};
    return { error: error.message };
  }

  await notifyChallengeEvent({
    recipientId: inviteeId,
    actorId: user.id,
    title: "Challenge invitation",
    body: "You have been invited to a reading challenge.",
    kind: "challenge_invitation",
    challengeId,
  });
  return {};
}

export async function respondToChallengeInvite(
  inviteId: string,
  accept: boolean
): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.rpc("respond_challenge_invite", {
    p_invite_id: inviteId,
    p_accept: accept,
  });
  return error ? { error: error.message } : {};
}
