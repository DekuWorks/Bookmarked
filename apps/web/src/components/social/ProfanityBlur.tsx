"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import {
  parseModerationMeta,
  resolveWarnSpans,
  splitTextBySpans,
  type ModerationMeta,
} from "../../../../../packages/utils/contentModeration";
import { cn } from "@/lib/utils/cn";

type Props = {
  text: string;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  meta?: ModerationMeta | import("../../../../../packages/types").ModerationMeta | null;
};

function FlaggedSpan({ word }: { word: string }) {
  const [revealed, setRevealed] = useState(false);
  const contentId = useId();

  return (
    <span className="inline">
      {revealed ? (
        <button
          type="button"
          id={contentId}
          onClick={() => setRevealed(false)}
          className={cn(
            "rounded-sm bg-primary/15 px-0.5 font-medium text-puce-red",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          )}
          aria-label="Hide vulgar language"
          aria-expanded={true}
        >
          {word}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setRevealed(true);
            }
          }}
          className={cn(
            "group/vulgar relative inline rounded-sm bg-primary/20 px-1 py-0.5 text-xs font-semibold text-puce-red",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
          )}
          aria-label="Vulgar Language. Hover or focus to reveal."
          aria-expanded={false}
        >
          <span className="group-hover/vulgar:hidden group-focus:hidden group-focus-visible/vulgar:hidden">
            Vulgar Language – Hover to View.
          </span>
          <span className="hidden group-hover/vulgar:inline group-focus:inline group-focus-visible/vulgar:inline">
            {word}
          </span>
        </button>
      )}
    </span>
  );
}

/**
 * Blur only flagged spans. Hover, focus, or click reveals; click again hides.
 */
export function ProfanityBlur({
  text,
  children,
  className,
  contentClassName,
  meta,
}: Props) {
  const parsed = parseModerationMeta(meta);
  const spans = useMemo(() => resolveWarnSpans(text, parsed), [text, parsed]);

  if (spans.length === 0) {
    return <div className={cn(className, contentClassName)}>{children ?? text}</div>;
  }

  const parts = splitTextBySpans(text, spans);

  return (
    <div className={cn("whitespace-pre-wrap text-left", className, contentClassName)}>
      {parts.map((part, index) =>
        part.span ? (
          <FlaggedSpan key={`${part.span.start}-${index}`} word={part.text} />
        ) : (
          <span key={`plain-${index}`}>{part.text}</span>
        )
      )}
    </div>
  );
}
