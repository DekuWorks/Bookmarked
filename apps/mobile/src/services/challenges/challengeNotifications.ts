import { supabase } from "../supabase";
import { shouldCreateStandardNotification } from "../../../../../packages/utils/notifiableEvents";

export async function notifyChallengeEvent(input: {
  recipientId: string;
  actorId: string;
  title: string;
  body: string;
  kind:
    | "challenge_invitation"
    | "challenge_accepted"
    | "challenge_completed"
    | "challenge_community_milestone";
  challengeId: string;
}): Promise<void> {
  if (
    !shouldCreateStandardNotification({
      type: "challenge",
      notificationKind: input.kind,
    })
  ) {
    return;
  }
  await supabase.rpc("create_notification", {
    p_user_id: input.recipientId,
    p_type: "challenge",
    p_title: input.title,
    p_body: input.body,
    p_actor_id: input.actorId,
    p_link_url: `/challenges/challenge/?id=${input.challengeId}`,
    p_metadata: {
      notification_kind: input.kind,
      challenge_id: input.challengeId,
      dedup_key: `${input.kind}:${input.challengeId}:${input.recipientId}`,
    },
  });
}
