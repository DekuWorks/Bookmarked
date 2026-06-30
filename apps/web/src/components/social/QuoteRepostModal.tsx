"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MentionComposer } from "@/components/social/MentionComposer";
import {
  CommentAttachmentControls,
  useCommentAttachment,
} from "@/components/social/CommentAttachmentControls";
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
  const attachment = useCommentAttachment();

  useEffect(() => {
    if (!open) return;
    setBody("");
    attachment.clearAttachment();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when modal opens
  }, [open]);

  async function handleRepost() {
    const trimmed = body.trim();
    const attachmentResult = await attachment.resolveAttachmentUrl();
    if (attachmentResult.error) {
      toast.error(attachmentResult.error);
      return;
    }

    const imageUrl = attachmentResult.url;
    const hasQuote = Boolean(trimmed || imageUrl);

    setSubmitting(true);
    const result = await repostPost(post.id, {
      body: trimmed,
      image_url: imageUrl,
    });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(hasQuote ? "Quote repost published." : "Reposted.");
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

        <CommentAttachmentControls {...attachment} disabled={submitting} />

        <div>
          <p className="mb-2 text-xs font-medium text-text-muted">Reposting</p>
          <RepostPreview post={post} linkToPost={false} />
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
