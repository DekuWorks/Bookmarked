"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MentionComposer } from "@/components/social/MentionComposer";
import { RepostPreview } from "@/components/social/RepostPreview";
import { useToast } from "@/components/ui/Toast";
import { repostPost } from "@/lib/services/posts";
import type { PostWithAuthor } from "@/types";

type Props = {
  open: boolean;
  onClose: () => void;
  post: PostWithAuthor;
  viewerId: string;
  onReposted?: () => void;
};

export function QuoteRepostModal({ open, onClose, post, viewerId, onReposted }: Props) {
  const toast = useToast();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBody("");
  }, [open]);

  async function handleRepost() {
    setSubmitting(true);
    const result = await repostPost(post.id, body);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(body.trim() ? "Quote repost published." : "Reposted.");
    onClose();
    onReposted?.();
  }

  return (
    <Modal open={open} onClose={onClose} title="Repost" className="max-w-lg">
      <div className="space-y-4">
        <MentionComposer
          viewerId={viewerId}
          value={body}
          onChange={setBody}
          placeholder="Add your thoughts… Use @ to mention someone."
          minHeightClassName="min-h-[88px]"
        />

        <div>
          <p className="mb-2 text-xs font-medium text-text-muted">Reposting</p>
          <RepostPreview post={post} />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={submitting}
            onClick={() => void handleRepost()}
          >
            Repost
          </Button>
        </div>
      </div>
    </Modal>
  );
}
