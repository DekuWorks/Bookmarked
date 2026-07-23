"use client";

import { Modal } from "@/components/ui/Modal";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
};

export function UpgradeModal({
  open,
  onClose,
  title = "Unlock Premium",
  description = "Get advanced reading analytics, AI-powered insights, and more with Bookmarked Premium.",
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed text-text-muted">{description}</p>
      <ul className="mt-4 space-y-2 text-sm text-text">
        <li>📊 Advanced analytics and reading heatmaps</li>
        <li>✨ AI reading insights powered by OpenAI</li>
        <li>🎯 Priority access to new features</li>
      </ul>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <ButtonLink href="/upgrade/" variant="primary" className="flex-1 text-center">
          View plans
        </ButtonLink>
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Not now
        </Button>
      </div>
    </Modal>
  );
}
