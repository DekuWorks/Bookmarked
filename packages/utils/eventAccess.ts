import type { SubscriptionTier } from "../types";

export type EventAccessKind =
  | "author_qa"
  | "virtual_event"
  | "reading_sprint"
  | "meetup"
  | "merch_window"
  | "partner_benefit";

export type EventAccessRow = {
  experience_id: string;
  required_tier: SubscriptionTier;
  price_cents: number | null;
  lower_tier_fee_cents: number | null;
  currency: string;
  included_for_home: boolean;
};

export function canAccessExperience(input: {
  viewerTier: SubscriptionTier;
  access: EventAccessRow;
  now?: number;
  windowStartsAt?: string | null;
  windowEndsAt?: string | null;
}): { allowed: boolean; requiresTicket: boolean; feeCents: number | null } {
  const now = input.now ?? Date.now();
  if (input.windowStartsAt && new Date(input.windowStartsAt).getTime() > now) {
    return { allowed: false, requiresTicket: false, feeCents: null };
  }
  if (input.windowEndsAt && new Date(input.windowEndsAt).getTime() < now) {
    return { allowed: false, requiresTicket: false, feeCents: null };
  }

  const rank: Record<SubscriptionTier, number> = { free: 0, plus: 1, home: 2 };
  const hasTier = rank[input.viewerTier] >= rank[input.access.required_tier];

  if (input.access.included_for_home && input.viewerTier === "home") {
    return { allowed: true, requiresTicket: false, feeCents: null };
  }

  if (hasTier && (input.access.price_cents == null || input.access.price_cents === 0)) {
    return { allowed: true, requiresTicket: false, feeCents: null };
  }

  const fee =
    hasTier
      ? input.access.price_cents
      : input.access.lower_tier_fee_cents ?? input.access.price_cents;

  if (fee != null && fee > 0) {
    return { allowed: false, requiresTicket: true, feeCents: fee };
  }

  return { allowed: hasTier, requiresTicket: false, feeCents: null };
}

export function sprintProgress(input: {
  startsAt: string;
  endsAt: string;
  now?: number;
}): { elapsedMs: number; remainingMs: number; ratio: number; ended: boolean } {
  const start = new Date(input.startsAt).getTime();
  const end = new Date(input.endsAt).getTime();
  const now = input.now ?? Date.now();
  const span = Math.max(end - start, 1);
  const elapsed = Math.max(0, Math.min(now - start, span));
  return {
    elapsedMs: elapsed,
    remainingMs: Math.max(0, end - now),
    ratio: elapsed / span,
    ended: now >= end,
  };
}

export const SPRINT_NO_STAY_ONLINE_COPY =
  "A 24-hour sprint does not require you to stay online the whole time. Join, log progress, and come back when you can.";

export const PARTNER_BENEFIT_NO_PUBLIC_CODE_COPY =
  "Partner benefits unlock from your Home membership. Bookmarked does not publish public discount codes.";
