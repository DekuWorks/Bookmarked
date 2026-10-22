/**
 * Server copy of the complimentary Plus decision.
 * The list lives in packages/utils so web, iOS, and these functions cannot drift.
 * No user_subscriptions row is written.
 */
export { hasComplimentaryPlus } from "../../../packages/utils/complimentaryPlus.ts";
export {
  applyComplimentaryPlus,
  subscriptionIsActive,
  toSubscriptionAccessFromRow,
} from "../../../packages/utils/subscription.ts";
