import { createClient } from "@/lib/supabase/client";
import {
  CLUB_POLL_MULTI_SELECT_DEFAULT,
  tallyClubPollVotes,
  validateClubPollDraft,
  validateClubPollVote,
  type ClubPollTally,
} from "@bookmarked/utils/clubPolls";

export type ClubPollRow = {
  id: string;
  question: string;
  allow_multiple: boolean;
  closes_at: string | null;
  created_at: string;
  choices: Array<{ id: string; label: string; sort_order: number }>;
  tallies: ClubPollTally[];
};

export async function listClubPolls(clubId: string, viewerId: string): Promise<ClubPollRow[]> {
  const supabase = createClient();
  const { data: polls, error } = await supabase
    .from("club_polls")
    .select("id, question, allow_multiple, closes_at, created_at")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows: ClubPollRow[] = [];
  for (const poll of polls ?? []) {
    const [{ data: choices }, { data: votes }] = await Promise.all([
      supabase
        .from("club_poll_choices")
        .select("id, label, sort_order")
        .eq("poll_id", poll.id)
        .order("sort_order"),
      supabase.from("club_poll_votes").select("choice_id, user_id").eq("poll_id", poll.id),
    ]);
    rows.push({
      ...poll,
      choices: choices ?? [],
      tallies: tallyClubPollVotes({
        choices: (choices ?? []).map((choice) => ({ id: choice.id, label: choice.label })),
        votes: (votes ?? []).map((vote) => ({ choiceId: vote.choice_id, userId: vote.user_id })),
        viewerId,
      }),
    });
  }
  return rows;
}

export async function createClubPoll(input: {
  clubId: string;
  question: string;
  choices: string[];
  closesAt?: string | null;
  allowMultiple?: boolean;
}) {
  const parsed = validateClubPollDraft({
    question: input.question,
    choices: input.choices.map((label, sortOrder) => ({ label, sortOrder })),
    closesAt: input.closesAt,
    allowMultiple: input.allowMultiple,
  });
  if (!parsed.ok) return { error: parsed.error };

  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_club_poll", {
    p_club_id: input.clubId,
    p_question: input.question,
    p_choices: input.choices,
    p_closes_at: input.closesAt ?? null,
    p_allow_multiple: input.allowMultiple ?? CLUB_POLL_MULTI_SELECT_DEFAULT,
  });
  if (error) return { error: error.message };
  return { id: data as string };
}

export async function voteClubPoll(
  pollId: string,
  choiceIds: string[],
  allowMultiple = CLUB_POLL_MULTI_SELECT_DEFAULT
) {
  const parsed = validateClubPollVote({ allowMultiple, choiceIds });
  if (!parsed.ok) return { error: parsed.error };
  const supabase = createClient();
  const { error } = await supabase.rpc("vote_club_poll", {
    p_poll_id: pollId,
    p_choice_ids: parsed.choiceIds,
  });
  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function loadClubAnalytics(clubId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("club_analytics_snapshot", { p_club_id: clubId });
  if (error) return { error: error.message };
  return { snapshot: data as Record<string, number> };
}
