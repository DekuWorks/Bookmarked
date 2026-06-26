"use client";

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

type Props = {
  onSend: (body: string) => Promise<{ error?: string }>;
  disabled?: boolean;
};

export function MessageComposer({ onSend, disabled }: Props) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);

    const result = await onSend(trimmed);
    setSending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setBody("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="sticky bottom-0 border-t border-border bg-surface px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <Textarea
          label="Message"
          name="message-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message…"
          rows={2}
          disabled={disabled || sending}
          className="min-h-[72px] resize-none"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-text-muted">Enter to send · Shift+Enter for new line</p>
          <Button
            type="button"
            onClick={() => void handleSend()}
            loading={sending}
            disabled={disabled || !body.trim()}
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
