import type { SubscriptionAccess } from "./subscription";
import { resolveSubscriptionTier } from "./subscription";

export const CONCIERGE_COPY = {
  prioritySupportTag: "Priority Support",
  featureRequestBlurb:
    "Home members get elevated consideration for feature requests. This is not a build guarantee and does not come with a response-time SLA.",
  noSla: "No promised response time.",
} as const;

export type FeatureRequestCategory =
  | "reading"
  | "social"
  | "maps"
  | "clubs"
  | "billing"
  | "other";

export type FeatureRequestDraft = {
  title: string;
  description: string;
  category: FeatureRequestCategory;
  problem: string;
  screenshot_url?: string | null;
};

export type ConciergePriority = "standard" | "home_priority";

/** Clients cannot set priority — derive it from the server-read entitlement. */
export function priorityFromEntitlement(
  access: SubscriptionAccess | null | undefined
): ConciergePriority {
  return resolveSubscriptionTier(access) === "home" ? "home_priority" : "standard";
}

export function sanitizeFeatureRequestInput(draft: FeatureRequestDraft): FeatureRequestDraft {
  return {
    title: draft.title.trim().slice(0, 120),
    description: draft.description.trim().slice(0, 4000),
    category: draft.category,
    problem: draft.problem.trim().slice(0, 2000),
    screenshot_url: draft.screenshot_url?.trim() || null,
  };
}

export function isValidFeatureRequest(draft: FeatureRequestDraft): boolean {
  const clean = sanitizeFeatureRequestInput(draft);
  return Boolean(clean.title && clean.description && clean.problem);
}
