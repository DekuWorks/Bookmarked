"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PlusBadge } from "@/components/premium/PlusBadge";

type Props = {
  open: boolean;
  onClose: () => void;
  featureLabel: string;
  limitMessage: string;
  preserveNote?: string;
};

/**
 * Soft limit modal when Free caps are hit (e.g. 1 custom shelf).
 * Existing data is preserved; only new creation is blocked.
 */
export function FeatureLimitModal({
  open,
  onClose,
  featureLabel,
  limitMessage,
  preserveNote = "Your existing items stay safe — upgrading unlocks more room to create.",
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Membership limit">
      <div className="space-y-4" role="dialog" aria-modal="true" aria-labelledby="feature-limit-title">
        <div className="flex flex-wrap items-center gap-2">
          <PlusBadge compact />
          <h3 id="feature-limit-title" className="text-lg font-semibold text-puce-red dark:text-primary">
            {featureLabel}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-text-muted">{limitMessage}</p>
        <p className="text-sm text-text-muted">{preserveNote}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Not now
          </Button>
          <ButtonLink href="/upgrade/" variant="primary" size="sm">
            Upgrade to Plus
          </ButtonLink>
        </div>
      </div>
    </Modal>
  );
}
