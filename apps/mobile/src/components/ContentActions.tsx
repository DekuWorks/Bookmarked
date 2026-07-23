import { Alert, ActionSheetIOS, Platform } from "react-native";
import type { ContentReportReason, ReportableContentType } from "../../../../packages/types";
import { blockUser, reportContent } from "../services/moderation";

const REPORT_REASONS: { label: string; value: ContentReportReason }[] = [
  { label: "Harassment or bullying", value: "harassment" },
  { label: "Spam", value: "spam" },
  { label: "Inappropriate content", value: "inappropriate" },
  { label: "Hate speech", value: "hate_speech" },
  { label: "Other", value: "other" },
];

type ContentActionInput = {
  contentType: ReportableContentType;
  contentId: string;
  reportedUserId: string;
  reportedUserName?: string;
  onBlocked?: () => void;
  onReported?: () => void;
};

async function submitReport(
  input: ContentActionInput,
  reason: ContentReportReason
): Promise<void> {
  const result = await reportContent({
    contentType: input.contentType,
    contentId: input.contentId,
    reportedUserId: input.reportedUserId,
    reason,
  });
  if (result.error) {
    Alert.alert("Couldn't submit report", result.error);
    return;
  }
  input.onReported?.();
  Alert.alert(
    "Report submitted",
    "Thanks for helping keep Bookmarked safe. We review reports within 24 hours."
  );
}

async function confirmBlock(input: ContentActionInput): Promise<void> {
  const name = input.reportedUserName?.trim() || "this user";
  Alert.alert(
    `Block ${name}?`,
    "Their content will be removed from your feed immediately. We'll be notified to review this account.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          const result = await blockUser(input.reportedUserId, {
            reason: "harassment",
            details: `Blocked from ${input.contentType} ${input.contentId}`,
          });
          if (result.error) {
            Alert.alert("Couldn't block user", result.error);
            return;
          }
          input.onBlocked?.();
          Alert.alert("User blocked", "You will no longer see their content.");
        },
      },
    ]
  );
}

export function showContentActions(input: ContentActionInput): void {
  const name = input.reportedUserName?.trim() || "User";

  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Cancel", "Report content", `Block ${name}`],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 2,
      },
      (index) => {
        if (index === 1) showReportReasonPicker(input);
        if (index === 2) void confirmBlock(input);
      }
    );
    return;
  }

  Alert.alert("Content options", undefined, [
    { text: "Cancel", style: "cancel" },
    { text: "Report content", onPress: () => showReportReasonPicker(input) },
    { text: `Block ${name}`, style: "destructive", onPress: () => void confirmBlock(input) },
  ]);
}

function showReportReasonPicker(input: ContentActionInput): void {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Why are you reporting this?",
        options: ["Cancel", ...REPORT_REASONS.map((r) => r.label)],
        cancelButtonIndex: 0,
      },
      (index) => {
        if (index <= 0) return;
        const reason = REPORT_REASONS[index - 1]?.value;
        if (reason) void submitReport(input, reason);
      }
    );
    return;
  }

  Alert.alert("Why are you reporting this?", undefined, [
    { text: "Cancel", style: "cancel" },
    ...REPORT_REASONS.map((r) => ({
      text: r.label,
      onPress: () => void submitReport(input, r.value),
    })),
  ]);
}

export function showProfileActions(input: {
  userId: string;
  userName?: string;
  onBlocked?: () => void;
}): void {
  showContentActions({
    contentType: "profile",
    contentId: input.userId,
    reportedUserId: input.userId,
    reportedUserName: input.userName,
    onBlocked: input.onBlocked,
  });
}
