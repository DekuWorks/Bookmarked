import { ActionSheetIOS, Alert, Platform } from "react-native";
import { getClubDiscussionActionPermissions } from "../../../../packages/utils/clubDiscussionUi";
import { showContentActions } from "./ContentActions";
import type { BookClubMemberRole } from "../types";

type Input = {
  discussionId: string;
  creatorId: string;
  creatorName?: string;
  viewerId: string;
  viewerRole: BookClubMemberRole | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onBlocked?: () => void;
  onReported?: () => void;
};

/** Discussion ••• menu — only presents allowed actions. */
export function showDiscussionActionsMenu(input: Input): void {
  const perms = getClubDiscussionActionPermissions({
    viewerId: input.viewerId,
    creatorId: input.creatorId,
    viewerRole: input.viewerRole,
  });

  const labels: string[] = ["Cancel"];
  const actions: Array<() => void> = [];

  if (perms.canEdit && input.onEdit) {
    labels.push("Edit Discussion");
    actions.push(input.onEdit);
  }
  if (perms.canDelete && input.onDelete) {
    labels.push("Delete");
    actions.push(() => {
      Alert.alert("Delete discussion?", "This cannot be undone.", [
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
        contentType: "club_discussion",
        contentId: input.discussionId,
        reportedUserId: input.creatorId,
        reportedUserName: input.creatorName,
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
    "Discussion options",
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
