"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestAiCompanion } from "@/lib/services/aiCompanion";
import { AI_COMPANION_ACTIONS, endingExplanationBlocked } from "@bookmarked/utils/aiCompanionSafety";

export function AiCompanionPanel() {
  const [action, setAction] = useState<(typeof AI_COMPANION_ACTIONS)[number]>("discussion_questions");
  const [bookTitle, setBookTitle] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endingConfirmed, setEndingConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        Progress-aware companion. Ending thoughts need an extra confirm if you have not finished.
      </p>
      <Input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} placeholder="Book title" />
      <select
        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
        value={action}
        onChange={(e) => setAction(e.target.value as (typeof AI_COMPANION_ACTIONS)[number])}
      >
        {AI_COMPANION_ACTIONS.map((item) => (
          <option key={item} value={item}>
            {item.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      {endingExplanationBlocked({ shelfStatus: "currently_reading" }, endingConfirmed) &&
      action === "ending_explanation" ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={endingConfirmed} onChange={(e) => setEndingConfirmed(e.target.checked)} />
          I want ending thoughts even though I have not finished.
        </label>
      ) : null}
      <Button
        type="button"
        size="sm"
        loading={loading}
        onClick={() => {
          setLoading(true);
          setError(null);
          void requestAiCompanion({
            action,
            bookTitle,
            endingConfirmed,
            shelfStatus: "currently_reading",
          }).then((response) => {
            setLoading(false);
            if ("error" in response && response.error) setError(response.error);
            else setResult(JSON.stringify(response.result ?? {}, null, 2));
          });
        }}
      >
        Ask companion
      </Button>
      {error ? <p className="text-sm text-rust">{error}</p> : null}
      {result ? <pre className="overflow-x-auto rounded-lg bg-background p-3 text-xs">{result}</pre> : null}
    </div>
  );
}
