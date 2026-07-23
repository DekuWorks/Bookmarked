"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { deleteAccount } from "@/lib/services/moderation";
import { useToast } from "@/components/ui/Toast";

type Props = {
  onDeleted?: () => void;
};

export function DeleteAccountPanel({ onDeleted }: Props) {
  const toast = useToast();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    const result = await deleteAccount();
    setDeleting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    onDeleted?.();
    window.location.href = "/";
  }

  if (!open) {
    return (
      <section className="surface-card border-rust/30 p-6">
        <h2 className="text-lg font-semibold text-rust">Delete account</h2>
        <p className="mt-2 text-sm text-text-muted">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 border-rust text-rust hover:bg-rust/10"
          onClick={() => setOpen(true)}
        >
          Delete my account
        </Button>
      </section>
    );
  }

  return (
    <section className="surface-card border-rust/30 p-6">
      <h2 className="text-lg font-semibold text-rust">Confirm account deletion</h2>
      <p className="mt-2 text-sm text-text-muted">
        This permanently removes your profile, library, reviews, posts, messages, and all other
        data. Type <strong>DELETE</strong> to confirm.
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder="Type DELETE"
        autoComplete="off"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-rust text-rust hover:bg-rust/10"
          loading={deleting}
          disabled={!canDelete}
          onClick={() => void handleDelete()}
        >
          Permanently delete account
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
