"use client";

import { useEffect, useRef, useState } from "react";
import type { ContentReportReason, ReportableContentType } from "../../../../../packages/types";
import { CONTENT_REPORT_REASON_LABELS } from "../../../../../packages/utils/contentReports";
import { getClubReplyActionPermissions } from "@bookmarked/utils/clubDiscussionUi";
import { blockUser, reportContent } from "@/lib/services/moderation";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import type { BookClubMemberRole } from "@/types";

const REPORT_REASONS: { label: string; value: ContentReportReason }[] = (
  Object.entries(CONTENT_REPORT_REASON_LABELS) as Array<[ContentReportReason, string]>
).map(([value, label]) => ({ value, label }));

type Props = {
  replyId: string;
  replyAuthorId: string;
  replyAuthorName?: string;
  viewerId: string;
  viewerRole: BookClubMemberRole | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onBlocked?: () => void;
  onReported?: () => void;
  className?: string;
};

/**
 * Reply ••• menu — only renders actions allowed for the viewer.
 */
export function ReplyActionsMenu({
  replyId,
  replyAuthorId,
  replyAuthorName,
  viewerId,
  viewerRole,
  onEdit,
  onDelete,
  onBlocked,
  onReported,
  className,
}: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ContentReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const perms = getClubReplyActionPermissions({
    viewerId,
    replyAuthorId,
    viewerRole,
  });

  const hasAny =
    perms.canEdit || perms.canDelete || perms.canReport || perms.canBlock;
  const name = replyAuthorName?.trim() || "this user";

  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setReportOpen(false);
        setReason(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  if (!hasAny) return null;

  async function handleReport(nextReason: ContentReportReason, nextDetails?: string) {
    setBusy(true);
    const result = await reportContent({
      contentType: "club_reply" as ReportableContentType,
      contentId: replyId,
      reportedUserId: replyAuthorId,
      reason: nextReason,
      details: nextDetails,
    });
    setBusy(false);
    setReportOpen(false);
    setOpen(false);
    setReason(null);
    setDetails("");
    if (result.error) {
      toast.error(result.error);
      return;
    }
    onReported?.();
    toast.success("Report submitted. We review reports within 24 hours.");
  }

  async function handleBlock() {
    if (!window.confirm(`Block ${name}? Their content will be removed from your feed immediately.`)) {
      return;
    }
    setBusy(true);
    const result = await blockUser(replyAuthorId, {
      reason: "harassment_bullying",
      details: `Blocked from club_reply ${replyId}`,
    });
    setBusy(false);
    setOpen(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    onBlocked?.();
    toast.success("User blocked.");
  }

  function handleDelete() {
    if (!window.confirm("Delete this reply? This cannot be undone.")) return;
    setOpen(false);
    onDelete?.();
  }

  if (!open) {
    return (
      <button
        type="button"
        className={className ?? "text-text-muted hover:text-text"}
        aria-label="Reply options"
        onClick={() => setOpen(true)}
      >
        ⋯
      </button>
    );
  }

  if (reportOpen && reason === "other") {
    return (
      <div ref={rootRef} className="rounded-lg border border-border bg-surface p-3 shadow-md">
        <p className="mb-2 text-sm font-medium text-text">Add optional details</p>
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value.slice(0, 280))}
          rows={3}
          className="mb-2 w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
          placeholder="What should reviewers know?"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={busy}
            onClick={() => void handleReport("other", details)}
          >
            Submit
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setReason(null)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  if (reportOpen) {
    return (
      <div ref={rootRef} className="min-w-[180px] rounded-lg border border-border bg-surface p-2 shadow-md">
        <p className="mb-1 px-2 text-xs font-semibold uppercase text-text-muted">Report reason</p>
        {REPORT_REASONS.map((item) => (
          <button
            key={item.value}
            type="button"
            className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-background"
            onClick={() => {
              if (item.value === "other") setReason("other");
              else void handleReport(item.value);
            }}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className="mt-1 block w-full rounded-md px-2 py-1.5 text-left text-sm text-text-muted hover:bg-background"
          onClick={() => setReportOpen(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="absolute right-0 z-20 min-w-[140px] rounded-lg border border-border bg-surface py-1 shadow-md">
        {perms.canEdit ? (
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-background"
            onClick={() => {
              setOpen(false);
              onEdit?.();
            }}
          >
            Edit
          </button>
        ) : null}
        {perms.canDelete ? (
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm text-rust hover:bg-background"
            onClick={handleDelete}
          >
            Delete
          </button>
        ) : null}
        {perms.canReport ? (
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-background"
            onClick={() => setReportOpen(true)}
          >
            Report
          </button>
        ) : null}
        {perms.canBlock ? (
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left text-sm text-rust hover:bg-background"
            disabled={busy}
            onClick={() => void handleBlock()}
          >
            Block
          </button>
        ) : null}
      </div>
    </div>
  );
}
