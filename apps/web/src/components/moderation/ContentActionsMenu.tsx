"use client";

import { useState } from "react";
import type { ContentReportReason, ReportableContentType } from "../../../../../packages/types";
import { blockUser, reportContent } from "@/lib/services/moderation";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

const REPORT_REASONS: { label: string; value: ContentReportReason }[] = [
  { label: "Harassment or bullying", value: "harassment" },
  { label: "Spam", value: "spam" },
  { label: "Inappropriate content", value: "inappropriate" },
  { label: "Hate speech", value: "hate_speech" },
  { label: "Other", value: "other" },
];

type Props = {
  contentType: ReportableContentType;
  contentId: string;
  reportedUserId: string;
  reportedUserName?: string;
  onBlocked?: () => void;
  onReported?: () => void;
  className?: string;
};

export function ContentActionsMenu({
  contentType,
  contentId,
  reportedUserId,
  reportedUserName,
  onBlocked,
  onReported,
  className,
}: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const name = reportedUserName?.trim() || "this user";

  async function handleReport(reason: ContentReportReason) {
    setBusy(true);
    const result = await reportContent({
      contentType,
      contentId,
      reportedUserId,
      reason,
    });
    setBusy(false);
    setReportOpen(false);
    setOpen(false);

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
    const result = await blockUser(reportedUserId, {
      reason: "harassment",
      details: `Blocked from ${contentType} ${contentId}`,
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

  if (!open) {
    return (
      <button
        type="button"
        className={className ?? "text-text-muted hover:text-text"}
        aria-label="More options"
        onClick={() => setOpen(true)}
      >
        ⋯
      </button>
    );
  }

  if (reportOpen) {
    return (
      <div className="rounded-lg border border-border bg-surface p-3 shadow-md">
        <p className="mb-2 text-sm font-medium text-text">Why are you reporting this?</p>
        <div className="flex flex-col gap-1">
          {REPORT_REASONS.map((reason) => (
            <Button
              key={reason.value}
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start"
              loading={busy}
              onClick={() => void handleReport(reason.value)}
            >
              {reason.label}
            </Button>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => setReportOpen(false)}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-2 shadow-md">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={() => setReportOpen(true)}
      >
        Report content
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-start text-rust"
        loading={busy}
        onClick={() => void handleBlock()}
      >
        Block {name}
      </Button>
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
