import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateBookForChallenges } from "@bookmarked/utils/challengeRuleEngine";
import { filterNewContributions } from "@bookmarked/utils/challengeContributions";
import { mapSubjectsToGenreIds } from "@bookmarked/utils/challengeGenres";
import {
  emptyChallengeEvaluationSummary,
  isChallengeGoalType,
  isChallengeVisibility,
  type ChallengeEvaluationSummary,
  type ChallengeFinishItem,
  type ChallengeObjective,
  type ChallengeObjectiveParams,
  type ChallengeRecord,
} from "@bookmarked/utils/challengeTypes";
import { challengeCanShareToFeed } from "@bookmarked/utils/challengeVisibility";
import { formatCommunityMilestone } from "@bookmarked/utils/challengeDisplay";
import { evaluateAndAwardBadges } from "@/lib/services/challenges/ChallengeBadgeService";
import { notifyChallengeEvent } from "@/lib/services/challenges/challengeNotifications";

type TrustedMetadata = {
  author_id?: string | null;
  representation_tags?: string[] | null;
};

type BookRow = {
  id: string;
  subjects: string[] | null;
  format?: string | null;
  trusted_metadata?: TrustedMetadata | null;
};

type UserBookRow = {
  id: string;
  book_id: string;
  tracking_format?: string | null;
  user_id: string;
};

function asRecord(row: {
  id: string;
  starts_at: string | null;
  ends_at: string | null;
  allow_historical: boolean | null;
  allow_same_book_for_multiple_objectives: boolean | null;
  title: string;
  visibility: string | null;
  goal_type: string | null;
  goal_amount: number | string | null;
}): Pick<
  ChallengeRecord,
  | "id"
  | "starts_at"
  | "ends_at"
  | "allow_historical"
  | "allow_same_book_for_multiple_objectives"
  | "title"
  | "visibility"
  | "goal_type"
  | "goal_amount"
> {
  return {
    id: row.id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    allow_historical: Boolean(row.allow_historical),
    allow_same_book_for_multiple_objectives: Boolean(row.allow_same_book_for_multiple_objectives),
    title: row.title,
    visibility: isChallengeVisibility(row.visibility) ? row.visibility : "public",
    goal_type: isChallengeGoalType(row.goal_type) ? row.goal_type : "BOOK_COUNT",
    goal_amount: Number(row.goal_amount) || 0,
  };
}

async function loadClubSelectionBookIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data: memberships } = await supabase
    .from("book_club_members")
    .select("club_id")
    .eq("user_id", userId);
  const clubIds = (memberships ?? []).map((row) => row.club_id as string);
  if (!clubIds.length) return [];

  const [{ data: current }, { data: shelf }] = await Promise.all([
    supabase.from("book_club_current_reads").select("book_id").in("club_id", clubIds),
    supabase.from("book_club_books").select("book_id").in("club_id", clubIds),
  ]);

  return [
    ...new Set([
      ...((current ?? []).map((row) => row.book_id as string)),
      ...((shelf ?? []).map((row) => row.book_id as string)),
    ]),
  ];
}

export async function evaluateQualifyingEventForChallenges(input: {
  supabase: SupabaseClient;
  userId: string;
  userBookId: string;
  qualifyingEventId: string;
  qualifyingDate: string;
  eventKind: "completion" | "progress";
  pagesInEvent: number;
  listeningSecondsInEvent: number;
}): Promise<ChallengeEvaluationSummary> {
  const summary = emptyChallengeEvaluationSummary();

  const { data: userBook } = await input.supabase
    .from("user_books")
    .select("id, book_id, tracking_format, user_id")
    .eq("id", input.userBookId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!userBook) return summary;

  const bookRow = userBook as UserBookRow;
  const { data: book } = await input.supabase
    .from("books")
    .select("id, subjects, format, trusted_metadata")
    .eq("id", bookRow.book_id)
    .maybeSingle();
  if (!book) return summary;
  const catalog = book as BookRow;
  const trusted = catalog.trusted_metadata ?? {};

  const { data: memberships } = await input.supabase
    .from("reading_challenge_members")
    .select("challenge_id, status")
    .eq("user_id", input.userId)
    .neq("status", "left");
  const challengeIds = (memberships ?? []).map((row) => row.challenge_id as string);
  if (!challengeIds.length) return summary;

  const [{ data: challengeRows }, { data: objectiveRows }, { data: usedRows }] = await Promise.all([
    input.supabase
      .from("reading_challenges")
      .select(
        "id, title, starts_at, ends_at, allow_historical, allow_same_book_for_multiple_objectives, visibility, goal_type, goal_amount"
      )
      .in("id", challengeIds)
      .eq("is_active", true),
    input.supabase
      .from("reading_challenge_objectives")
      .select("id, challenge_id, rule_type, title, sort_order, target_amount, params")
      .in("challenge_id", challengeIds),
    input.supabase
      .from("reading_challenge_contributions")
      .select("challenge_id, objective_id, user_book_id, qualifying_event_id")
      .eq("user_id", input.userId)
      .in("challenge_id", challengeIds),
  ]);

  const clubSelectionBookIds = await loadClubSelectionBookIds(input.supabase, input.userId);

  const objectivesByChallenge = new Map<string, ChallengeObjective[]>();
  for (const row of objectiveRows ?? []) {
    const list = objectivesByChallenge.get(row.challenge_id as string) ?? [];
    list.push({
      id: row.id as string,
      challenge_id: row.challenge_id as string,
      rule_type: row.rule_type as ChallengeObjective["rule_type"],
      title: row.title as string,
      sort_order: Number(row.sort_order) || 0,
      target_amount: Number(row.target_amount) || 0,
      params: (row.params as ChallengeObjectiveParams | null) ?? {},
    });
    objectivesByChallenge.set(row.challenge_id as string, list);
  }

  const usedKeys = new Set<string>();
  const usedObjectiveByChallenge = new Map<string, string[]>();
  for (const row of usedRows ?? []) {
    usedKeys.add(
      `${row.challenge_id}:${input.userId}:${row.objective_id}:${row.user_book_id}:${row.qualifying_event_id}`
    );
    if (row.user_book_id === input.userBookId) {
      const list = usedObjectiveByChallenge.get(row.challenge_id as string) ?? [];
      list.push(row.objective_id as string);
      usedObjectiveByChallenge.set(row.challenge_id as string, list);
    }
  }

  const trackingFormat =
    bookRow.tracking_format === "audiobook" || catalog.format === "audiobook"
      ? bookRow.tracking_format === "book"
        ? "book"
        : "audiobook"
      : "book";

  const evaluations = evaluateBookForChallenges(
    ((challengeRows ?? []) as Array<{
      id: string;
      title: string;
      starts_at: string | null;
      ends_at: string | null;
      allow_historical: boolean | null;
      allow_same_book_for_multiple_objectives: boolean | null;
      visibility: string | null;
      goal_type: string | null;
      goal_amount: number | string | null;
    }>).map((row) => ({
      challenge: asRecord(row),
      objectives: objectivesByChallenge.get(row.id) ?? [],
      usedObjectiveIds: usedObjectiveByChallenge.get(row.id) ?? [],
    })),
    {
      userId: input.userId,
      userBookId: input.userBookId,
      bookId: catalog.id,
      qualifyingEventId: input.qualifyingEventId,
      qualifyingDate: input.qualifyingDate,
      eventKind: input.eventKind,
      pagesInEvent: input.pagesInEvent,
      listeningSecondsInEvent: input.listeningSecondsInEvent,
      trackingFormat,
      genreIds: mapSubjectsToGenreIds(catalog.subjects),
      trustedAuthorId: trusted.author_id ?? null,
      trustedRepresentationTags: trusted.representation_tags ?? [],
      curatedBookIds: [],
      clubSelectionBookIds,
    }
  );

  const challengeMeta = new Map(
    ((challengeRows ?? []) as Array<{ id: string; title: string; visibility: string | null }>).map((row) => [
      row.id,
      { title: row.title, visibility: isChallengeVisibility(row.visibility) ? row.visibility : "public" },
    ])
  );

  const itemMap = new Map<string, ChallengeFinishItem>();

  for (const evaluation of evaluations) {
    const fresh = filterNewContributions(evaluation.contributions, usedKeys, input.userId);
    for (const draft of fresh) {
      const { data } = await input.supabase.rpc("record_challenge_contribution", {
        p_challenge_id: draft.challengeId,
        p_objective_id: draft.objectiveId,
        p_user_book_id: draft.userBookId,
        p_qualifying_event_id: draft.qualifyingEventId,
        p_qualifying_date: draft.qualifyingDate,
        p_amount: draft.amount,
        p_unit: draft.unit,
        p_reason: draft.reason,
      });
      const recorded = data as {
        ok?: boolean;
        inserted?: boolean;
        completed?: boolean;
        milestones?: number[];
        visibility?: string;
      } | null;
      if (!recorded?.ok || !recorded.inserted) continue;

      const meta = challengeMeta.get(draft.challengeId);
      const visibility = meta?.visibility ?? "public";
      const existing = itemMap.get(draft.challengeId);
      if (existing) {
        existing.reasons.push(draft.reason);
        existing.completed = existing.completed || Boolean(recorded.completed);
      } else {
        itemMap.set(draft.challengeId, {
          challengeId: draft.challengeId,
          title: meta?.title ?? "Challenge",
          visibility,
          reasons: [draft.reason],
          percent: recorded.completed ? 100 : 0,
          completed: Boolean(recorded.completed),
          shareEligible: challengeCanShareToFeed(visibility) && Boolean(recorded.completed),
        });
      }

      for (const threshold of recorded.milestones ?? []) {
        if (!challengeCanShareToFeed(visibility)) continue;
        summary.communityMilestones.push({
          challengeId: draft.challengeId,
          title: meta?.title ?? "Challenge",
          threshold,
          shareEligible: true,
        });
        await notifyChallengeEvent({
          recipientId: input.userId,
          actorId: input.userId,
          title: "Community milestone",
          body: `${meta?.title ?? "A challenge"} reached ${formatCommunityMilestone(threshold)}.`,
          kind: "challenge_community_milestone",
          challengeId: draft.challengeId,
        });
      }
    }
  }

  summary.items = [...itemMap.values()];
  summary.updatedCount = summary.items.length;
  const badges = await evaluateAndAwardBadges(input.supabase, input.userId);
  summary.newBadges = badges;
  return summary;
}
