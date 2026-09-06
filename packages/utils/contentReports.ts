export const REPORTABLE_CONTENT_TYPES = [
  "post",
  "comment",
  "message",
  "review",
  "club_post",
  "club_discussion",
  "club_reply",
  "club",
  "profile",
  "book_map_place",
  "home_meetup",
  "home_experience",
] as const;

export type ReportableContentType = (typeof REPORTABLE_CONTENT_TYPES)[number];

export const CONTENT_REPORT_REASONS = [
  "hate_discrimination",
  "harassment_bullying",
  "threats_violence",
  "sexual_inappropriate",
  "spam",
  "impersonation",
  "other",
  "closed",
  "wrong_info",
  "duplicate",
  "incorrect",
  "inappropriate_place",
] as const;

export type ContentReportReason = (typeof CONTENT_REPORT_REASONS)[number];

export const CONTENT_REPORT_STATUSES = [
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
] as const;

export type ContentReportStatus = (typeof CONTENT_REPORT_STATUSES)[number];

export const CONTENT_REPORT_REASON_LABELS: Record<ContentReportReason, string> = {
  hate_discrimination: "Hate or discrimination",
  harassment_bullying: "Harassment or bullying",
  threats_violence: "Threats or violence",
  sexual_inappropriate: "Sexual or inappropriate content",
  spam: "Spam",
  impersonation: "Impersonation",
  other: "Other",
  closed: "Closed or moved",
  wrong_info: "Wrong details",
  duplicate: "Duplicate listing",
  incorrect: "Incorrect place",
  inappropriate_place: "Inappropriate place",
};

export type ContentReportRow = {
  reporter_id: string;
  target_type: string;
  target_id: string;
  status: ContentReportStatus;
};

/** Users can create a report only as themselves. */
export function canInsertContentReport(
  row: Pick<ContentReportRow, "reporter_id">,
  viewerId: string | null
): boolean {
  return Boolean(viewerId) && row.reporter_id === viewerId;
}

/** Users may read their own reports. Staff may read all. Nobody else. */
export function canSelectContentReport(
  row: Pick<ContentReportRow, "reporter_id">,
  viewerId: string | null,
  isStaff = false
): boolean {
  if (isStaff) return true;
  return Boolean(viewerId) && row.reporter_id === viewerId;
}

/** Users cannot change status/resolution. Staff only. */
export function canUpdateContentReport(
  _row: ContentReportRow,
  _viewerId: string | null,
  isStaff = false
): boolean {
  return isStaff;
}

export function isDuplicateReport(
  existing: Array<Pick<ContentReportRow, "reporter_id" | "target_type" | "target_id">>,
  next: Pick<ContentReportRow, "reporter_id" | "target_type" | "target_id">
): boolean {
  return existing.some(
    (row) =>
      row.reporter_id === next.reporter_id &&
      row.target_type === next.target_type &&
      row.target_id === next.target_id
  );
}

export function isReportableContentType(value: unknown): value is ReportableContentType {
  return (
    typeof value === "string" &&
    (REPORTABLE_CONTENT_TYPES as readonly string[]).includes(value)
  );
}

export function isContentReportReason(value: unknown): value is ContentReportReason {
  return (
    typeof value === "string" &&
    (CONTENT_REPORT_REASONS as readonly string[]).includes(value)
  );
}
