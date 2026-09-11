import { ActionSheetIOS, Alert, Platform } from "react-native";
import { getClubReplyActionPermissions } from "../../../../packages/utils/clubDiscussionUi";
import { showContentActions } from "./ContentActions";
import type { BookClubMemberRole } from "../types";

type Input = {
  replyId: string;
  replyAuthorId: string;
  replyAuthorName?: string;
  viewerId: string;
  viewerRole: BookClubMemberRole | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onBlocked?: () => void;
  onReported?: () => void;
};

/** Reply ••• menu — only presents allowed actions. */
export function showReplyActionsMenu(input: Input): void {
  const perms = getClubReplyActionPermissions({
    viewerId: input.viewerId,
    replyAuthorId: input.replyAuthorId,
    viewerRole: input.viewerRole,
  });

  const labels: string[] = ["Cancel"];
  const actions: Array<() => void> = [];

  if (perms.canEdit && input.onEdit) {
    labels.push("Edit");
    actions.push(input.onEdit);
  }
  if (perms.canDelete && input.onDelete) {
    labels.push("Delete");
    actions.push(() => {
      Alert.alert("Delete reply?", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => input.onDelete?.(),
        },
      ]);
    });
  }
  if (perms.canReport) {
    labels.push("Report / Block");
    actions.push(() =>
      showContentActions({
        contentType: "club_reply",
        contentId: input.replyId,
        reportedUserId: input.replyAuthorId,
        reportedUserName: input.replyAuthorName,
        onBlocked: input.onBlocked,
        onReported: input.onReported,
      })
    );
  }

  if (actions.length === 0) return;

  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: labels,
        cancelButtonIndex: 0,
        destructiveButtonIndex: labels.indexOf("Delete") > 0 ? labels.indexOf("Delete") : undefined,
      },
      (index) => {
        if (index <= 0) return;
        actions[index - 1]?.();
      }
    );
    return;
  }

  Alert.alert(
    "Reply options",
    undefined,
    [
      { text: "Cancel", style: "cancel" },
      ...actions.map((action, i) => ({
        text: labels[i + 1],
        style: labels[i + 1] === "Delete" ? ("destructive" as const) : ("default" as const),
        onPress: action,
      })),
    ]
  );
}
