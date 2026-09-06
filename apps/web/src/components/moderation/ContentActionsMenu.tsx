"use client";

import { useState } from "react";
import type { ContentReportReason, ReportableContentType } from "../../../../../packages/types";
import { CONTENT_REPORT_REASON_LABELS } from "../../../../../packages/utils/contentReports";
import { blockUser, reportContent } from "@/lib/services/moderation";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

const REPORT_REASONS: { label: string; value: ContentReportReason }[] = (
  Object.entries(CONTENT_REPORT_REASON_LABELS) as Array<[ContentReportReason, string]>
).map(([value, label]) => ({ value, label }));

type Props = {
  contentType: ReportableContentType;
  contentId: string;
  reportedUserId: string;
  reportedUserName?: string;
  onBlocked?: () => void;
  onReported?: () => void;
  className?: string;
  hideBlock?: boolean;
};

export function ContentActionsMenu({
  contentType,
  contentId,
  reportedUserId,
  reportedUserName,
  onBlocked,
  onReported,
  className,
  hideBlock,
}: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ContentReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const name = reportedUserName?.trim() || "this user";

  async function handleReport(nextReason: ContentReportReason, nextDetails?: string) {
    setBusy(true);
    const result = await reportContent({
      contentType,
      contentId,
      reportedUserId,
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
    const result = await blockUser(reportedUserId, {
      reason: "harassment_bullying",
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

  if (reportOpen && reason === "other") {
    return (
      <div className="rounded-lg border border-border bg-surface p-3 shadow-md">
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
      <div className="rounded-lg border border-border bg-surface p-3 shadow-md">
        <p className="mb-2 text-sm font-medium text-text">Why are you reporting this?</p>
        <div className="flex flex-col gap-1">
          {REPORT_REASONS.map((item) => (
            <Button
              key={item.value}
              type="button"
              variant="ghost"
              size="sm"
              className="justify-start"
              loading={busy}
              onClick={() => {
                if (item.value === "other") {
                  setReason("other");
                  return;
                }
                void handleReport(item.value);
              }}
            >
              {item.label}
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
        Report
      </Button>
      {!hideBlock ? (
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
      ) : null}
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
