"use client";

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { MAX_MESSAGE_BODY_LENGTH } from "@/lib/constants/validation";
import { GifSearchPicker } from "@/components/social/GifSearchPickerLazy";
import { useCommentAttachment } from "@/components/social/CommentAttachmentControls";
import {
  uploadMessageAttachment,
  validateMessageAttachmentFile,
} from "@/lib/services/messages";

type Props = {
  conversationId: string;
  onSend: (body: string, attachmentUrl?: string | null) => Promise<{ error?: string }>;
  disabled?: boolean;
};

export function MessageComposer({ conversationId, onSend, disabled }: Props) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attachment = useCommentAttachment({
    validateFile: validateMessageAttachmentFile,
    uploadImage: (file) => uploadMessageAttachment(conversationId, file),
  });

  async function handleSend() {
    const trimmed = body.trim();
    if ((!trimmed && !attachment.hasAttachment) || sending) return;

    setSending(true);
    setError(null);

    const attachmentResult = await attachment.resolveAttachmentUrl();
    if (attachmentResult.error) {
      setSending(false);
      setError(attachmentResult.error);
      return;
    }

    const result = await onSend(trimmed, attachmentResult.url);
    setSending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setBody("");
    attachment.clearAttachment();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  const canSend = Boolean(body.trim() || attachment.hasAttachment);
  const isDisabled = disabled || sending;

  return (
    <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] border-t border-border bg-surface px-4 py-3 md:bottom-0">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {attachment.imagePreview ? (
          <div className="relative inline-block w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.imagePreview}
              alt="Attachment preview"
              className="max-h-40 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={attachment.clearAttachment}
              className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
              aria-label="Remove attachment"
            >
              Remove
            </button>
          </div>
        ) : null}

        {attachment.gifUrl && !attachment.imagePreview ? (
          <div className="relative inline-block w-fit max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachment.gifUrl}
              alt="GIF preview"
              className="max-h-40 rounded-lg border border-border object-contain bg-background"
            />
            <button
              type="button"
              onClick={attachment.clearAttachment}
              className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
              aria-label="Remove GIF"
            >
              Remove
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <input
            ref={attachment.fileInputRef}
            id={attachment.inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={attachment.handleFileChange}
            disabled={isDisabled}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => attachment.fileInputRef.current?.click()}
            disabled={isDisabled || Boolean(attachment.gifUrl)}
            aria-label="Attach image"
          >
            Attach
          </Button>
          <Textarea
            label="Message"
            name="message-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message…"
            rows={2}
            maxLength={MAX_MESSAGE_BODY_LENGTH}
            disabled={isDisabled}
            className="min-h-[72px] flex-1 resize-none"
          />
        </div>

        <GifSearchPicker
          gifInput={attachment.gifInput}
          onGifInputChange={attachment.setGifInput}
          onGifInputBlur={() => attachment.applyGifUrl(attachment.gifInput)}
          onSelect={attachment.selectGif}
          hasGif={Boolean(attachment.gifUrl)}
          disabled={isDisabled}
        />

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-text-muted">Enter to send · Shift+Enter for new line</p>
          <Button
            type="button"
            onClick={() => void handleSend()}
            loading={sending}
            disabled={disabled || !canSend}
            size="sm"
          >
            Send
          </Button>
        </div>
        {error ? <p className="text-sm text-rust">{error}</p> : null}
      </div>
    </div>
  );
}
