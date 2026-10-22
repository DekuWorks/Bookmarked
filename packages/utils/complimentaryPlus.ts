/**
 * Complimentary Bookmarked Plus for named team accounts.
 *
 * Matched from public profiles (username + user id). This is not a
 * user_subscriptions row and it does not change Postgres
 * user_has_paid_entitlement. Edge functions and clients apply the same list
 * when they turn a subscription row into SubscriptionAccess.
 *
 * Left out on purpose:
 * - zmokeafterdark — no public profile with that username
 * - leighton and leighton.cook — two different profiles
 */

export type ComplimentaryIdentity = {
  userId?: string | null;
  username?: string | null;
};

export const COMPLIMENTARY_PLUS_GRANTS = [
  { userId: "8bd36e7e-dd38-4385-8afb-ab595fe712f6", username: "CaiteeD" },
  { userId: "e3243532-077e-4df6-929a-94733bfd0e14", username: "ellienoblin" },
  { userId: "89ed2bcf-a37d-4e2c-aa0e-6577af9979d1", username: "DekuWorks" },
] as const;

function normalizeIdentifier(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Exact user id or exact username. Display names and partial handles do not match. */
export function hasComplimentaryPlus(
  identity: ComplimentaryIdentity | null | undefined
): boolean {
  if (!identity) return false;
  const userId = normalizeIdentifier(identity.userId);
  const username = normalizeIdentifier(identity.username);
  if (!userId && !username) return false;

  return COMPLIMENTARY_PLUS_GRANTS.some((grant) => {
    if (userId && userId === grant.userId.toLowerCase()) return true;
    if (username && username === grant.username.toLowerCase()) return true;
    return false;
  });
}
