"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type Props = {
  open: boolean;
  bookTitle: string;
  onSkip: () => void;
  onReviewNow: () => void;
};

export function RateBookPrompt({ open, bookTitle, onSkip, onReviewNow }: Props) {
  return (
    <Modal open={open} onClose={onSkip} title="Rate this book?">
      <p className="text-sm text-text-muted">
        You finished <span className="font-medium text-text">{bookTitle}</span>. Share a quick
        rating or write a full review — or skip for now.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onSkip}>
          Skip
        </Button>
        <Button type="button" variant="primary" onClick={onReviewNow}>
          Review now
        </Button>
      </div>
    </Modal>
  );
}
