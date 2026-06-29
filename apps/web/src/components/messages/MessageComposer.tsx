"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
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
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearAttachment() {
    setAttachmentFile(null);
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachmentPreview(null);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateMessageAttachmentFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    clearAttachment();
    setAttachmentFile(file);
    setAttachmentPreview(URL.createObjectURL(file));
  }

  async function handleSend() {
    const trimmed = body.trim();
    if ((!trimmed && !attachmentFile) || sending) return;

    setSending(true);
    setError(null);

    let attachmentUrl: string | null = null;
    if (attachmentFile) {
      const uploadResult = await uploadMessageAttachment(conversationId, attachmentFile);
      if (uploadResult.error) {
        setSending(false);
        setError(uploadResult.error);
        return;
      }
      attachmentUrl = uploadResult.url ?? null;
    }

    const result = await onSend(trimmed, attachmentUrl);
    setSending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setBody("");
    clearAttachment();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  const canSend = Boolean(body.trim() || attachmentFile);

  return (
    <div className="sticky bottom-0 border-t border-border bg-surface px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {attachmentPreview ? (
          <div className="relative inline-block w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachmentPreview}
              alt="Attachment preview"
              className="max-h-40 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={clearAttachment}
              className="absolute -right-2 -top-2 rounded-full bg-surface px-2 py-0.5 text-xs shadow-sm ring-1 ring-border"
              aria-label="Remove attachment"
            >
              Remove
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleFileChange}
            disabled={disabled || sending}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || sending}
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
            disabled={disabled || sending}
            className="min-h-[72px] flex-1 resize-none"
          />
        </div>

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
