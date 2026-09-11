"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { validateDiscussionFields } from "@bookmarked/utils/clubDiscussionUi";
import { updateDiscussion } from "@/lib/services/bookClubs";

export type EditDiscussionFormValues = {
  title: string;
  body: string;
};

type FormProps = {
  initialTitle: string;
  initialBody: string;
  submitting?: boolean;
  onSubmit: (values: EditDiscussionFormValues) => void | Promise<void>;
  onCancel: () => void;
};

/** Shared edit fields — mirrors create discussion validation. */
export function EditDiscussionForm({
  initialTitle,
  initialBody,
  submitting,
  onSubmit,
  onCancel,
}: FormProps) {
  const toast = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);

  useEffect(() => {
    setTitle(initialTitle);
    setBody(initialBody);
  }, [initialTitle, initialBody]);

  async function handleSubmit() {
    const validated = validateDiscussionFields(title, body);
    if ("error" in validated) {
      toast.error(validated.error);
      return;
    }
    await onSubmit(validated);
  }

  return (
    <div className="space-y-3 text-left">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What do you want to talk about?"
        maxLength={120}
        disabled={submitting}
      />
      <Textarea
        name="edit-discussion-body"
        label="Body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a thought, question, or reaction with the club…"
        className="min-h-[120px]"
        disabled={submitting}
      />
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" disabled={submitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={submitting}
          disabled={!title.trim() || !body.trim()}
          onClick={() => void handleSubmit()}
        >
          Save
        </Button>
      </div>
    </div>
  );
}

type ModalProps = {
  open: boolean;
  discussionId: string;
  initialTitle: string;
  initialBody: string;
  onClose: () => void;
  onSaved: (values: EditDiscussionFormValues & { updated_at: string; edited_at: string }) => void;
};

export function EditDiscussionModal({
  open,
  discussionId,
  initialTitle,
  initialBody,
  onClose,
  onSaved,
}: ModalProps) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: EditDiscussionFormValues) {
    setSubmitting(true);
    const result = await updateDiscussion(discussionId, values);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const now = new Date().toISOString();
    toast.success("Discussion updated.");
    onSaved({ ...values, updated_at: now, edited_at: now });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Discussion">
      <EditDiscussionForm
        initialTitle={initialTitle}
        initialBody={initialBody}
        submitting={submitting}
        onCancel={onClose}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
}
