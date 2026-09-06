import { Alert, ActionSheetIOS, Platform } from "react-native";
import type { ContentReportReason, ReportableContentType } from "../../../../packages/types";
import { CONTENT_REPORT_REASON_LABELS } from "../../../../packages/utils/contentReports";
import { blockUser, reportContent } from "../services/moderation";

const REPORT_REASONS: { label: string; value: ContentReportReason }[] = (
  Object.entries(CONTENT_REPORT_REASON_LABELS) as Array<[ContentReportReason, string]>
).map(([value, label]) => ({ value, label }));

type ContentActionInput = {
  contentType: ReportableContentType;
  contentId: string;
  reportedUserId: string;
  reportedUserName?: string;
  onBlocked?: () => void;
  onReported?: () => void;
  hideBlock?: boolean;
};

async function submitReport(
  input: ContentActionInput,
  reason: ContentReportReason,
  details?: string
): Promise<void> {
  const result = await reportContent({
    contentType: input.contentType,
    contentId: input.contentId,
    reportedUserId: input.reportedUserId,
    reason,
    details,
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

function promptOtherDetails(input: ContentActionInput): void {
  Alert.prompt?.(
    "Anything else?",
    "Optional short details for reviewers.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit",
        onPress: (value?: string) => void submitReport(input, "other", value?.trim() || undefined),
      },
    ],
    "plain-text"
  ) ??
    Alert.alert("Other", "We’ll send this as Other.", [
      { text: "Cancel", style: "cancel" },
      { text: "Submit", onPress: () => void submitReport(input, "other") },
    ]);
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
            reason: "harassment_bullying",
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
  const options = input.hideBlock
    ? ["Cancel", "Report"]
    : ["Cancel", "Report", `Block ${name}`];

  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 0,
        destructiveButtonIndex: input.hideBlock ? undefined : 2,
      },
      (index) => {
        if (index === 1) showReportReasonPicker(input);
        if (!input.hideBlock && index === 2) void confirmBlock(input);
      }
    );
    return;
  }

  Alert.alert("Content options", undefined, [
    { text: "Cancel", style: "cancel" },
    { text: "Report", onPress: () => showReportReasonPicker(input) },
    ...(!input.hideBlock
      ? [{ text: `Block ${name}`, style: "destructive" as const, onPress: () => void confirmBlock(input) }]
      : []),
  ]);
}

function showReportReasonPicker(input: ContentActionInput): void {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Why are you reporting this?",
        options: ["Cancel", ...REPORT_REASONS.map((item) => item.label)],
        cancelButtonIndex: 0,
      },
      (index) => {
        if (index <= 0) return;
        const reason = REPORT_REASONS[index - 1]?.value;
        if (reason === "other") {
          promptOtherDetails(input);
          return;
        }
        if (reason) void submitReport(input, reason);
      }
    );
    return;
  }

  Alert.alert("Why are you reporting this?", undefined, [
    { text: "Cancel", style: "cancel" },
    ...REPORT_REASONS.map((item) => ({
      text: item.label,
      onPress: () =>
        item.value === "other" ? promptOtherDetails(input) : void submitReport(input, item.value),
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
