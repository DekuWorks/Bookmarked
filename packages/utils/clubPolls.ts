/**
 * Plus club polls. Default is one vote per member.
 * Creators may opt in to multi-select (`allow_multiple`). Voting enforces the mode.
 */

export const CLUB_POLL_MIN_CHOICES = 2;
export const CLUB_POLL_MAX_CHOICES = 8;
export const CLUB_POLL_MAX_QUESTION = 200;
export const CLUB_POLL_MAX_CHOICE = 80;

/** Default stays single-select unless the creator opts in. */
export const CLUB_POLL_MULTI_SELECT_DEFAULT = false;

export type ClubPollChoiceDraft = {
  id?: string;
  label: string;
  sortOrder: number;
};

export type ClubPollDraft = {
  question: string;
  choices: ClubPollChoiceDraft[];
  closesAt?: string | null;
  allowMultiple?: boolean;
};

export type ClubPollTally = {
  choiceId: string;
  label: string;
  votes: number;
  percent: number;
  selectedByViewer: boolean;
};

export function validateClubPollDraft(
  draft: ClubPollDraft
): { ok: true } | { ok: false; error: string } {
  const question = draft.question.trim();
  if (!question) return { ok: false, error: "Add a poll question." };
  if (question.length > CLUB_POLL_MAX_QUESTION) {
    return { ok: false, error: `Questions must be ${CLUB_POLL_MAX_QUESTION} characters or fewer.` };
  }
  const labels = draft.choices.map((choice) => choice.label.trim()).filter(Boolean);
  if (labels.length < CLUB_POLL_MIN_CHOICES) {
    return { ok: false, error: `Add at least ${CLUB_POLL_MIN_CHOICES} choices.` };
  }
  if (labels.length > CLUB_POLL_MAX_CHOICES) {
    return { ok: false, error: `Polls can have at most ${CLUB_POLL_MAX_CHOICES} choices.` };
  }
  if (new Set(labels.map((label) => label.toLowerCase())).size !== labels.length) {
    return { ok: false, error: "Choices must be unique." };
  }
  if (labels.some((label) => label.length > CLUB_POLL_MAX_CHOICE)) {
    return { ok: false, error: `Choices must be ${CLUB_POLL_MAX_CHOICE} characters or fewer.` };
  }
  if (draft.closesAt) {
    const close = new Date(draft.closesAt).getTime();
    if (!Number.isFinite(close)) return { ok: false, error: "Close time is not valid." };
  }
  return { ok: true };
}

export function validateClubPollVote(input: {
  allowMultiple: boolean;
  choiceIds: readonly string[];
}): { ok: true; choiceIds: string[] } | { ok: false; error: string } {
  const choiceIds = [...new Set(input.choiceIds.filter(Boolean))];
  if (choiceIds.length === 0) return { ok: false, error: "Choose an option." };
  if (!input.allowMultiple && choiceIds.length > 1) {
    return { ok: false, error: "This poll allows one vote." };
  }
  return { ok: true, choiceIds };
}

export function tallyClubPollVotes(input: {
  choices: Array<{ id: string; label: string }>;
  votes: Array<{ choiceId: string; userId: string }>;
  viewerId?: string | null;
}): ClubPollTally[] {
  const total = input.votes.length;
  return input.choices.map((choice) => {
    const votes = input.votes.filter((vote) => vote.choiceId === choice.id).length;
    return {
      choiceId: choice.id,
      label: choice.label,
      votes,
      percent: total === 0 ? 0 : Number(((votes / total) * 100).toFixed(1)),
      selectedByViewer: input.votes.some(
        (vote) => vote.choiceId === choice.id && vote.userId === input.viewerId
      ),
    };
  });
}

export function pollIsOpen(closesAt?: string | null, now = Date.now()): boolean {
  if (!closesAt) return true;
  const close = new Date(closesAt).getTime();
  return Number.isFinite(close) && close > now;
}
