"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  customEmojiFromQuery,
  filterEmojiCategories,
  isValidReactionEmoji,
  normalizeReactionEmoji,
} from "@/lib/utils/emoji";
import { cn } from "@/lib/utils/cn";

type Props = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  alignEnd?: boolean;
};

export function MessageReactionPicker({ onSelect, onClose, alignEnd }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const customEmoji = useMemo(() => customEmojiFromQuery(query), [query]);
  const categories = useMemo(() => filterEmojiCategories(query), [query]);
  const hasResults = categories.some((category) => category.emojis.length > 0);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function handleSelect(emoji: string) {
    if (!isValidReactionEmoji(emoji)) return;
    onSelect(normalizeReactionEmoji(emoji));
    onClose();
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    if (customEmoji) {
      handleSelect(customEmoji);
      return;
    }

    const firstEmoji = categories[0]?.emojis[0]?.emoji;
    if (firstEmoji) handleSelect(firstEmoji);
  }

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Choose a reaction"
      className={cn(
        "absolute bottom-full z-30 mb-2 flex w-64 max-w-[min(16rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg",
        alignEnd ? "right-0" : "left-0"
      )}
    >
      <div className="border-b border-border p-2">
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search or paste emoji…"
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Search emojis"
        />
      </div>

      <div className="max-h-56 overflow-y-auto p-2">
        {customEmoji ? (
          <button
            type="button"
            className="mb-2 flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition hover:border-primary/40 hover:bg-surface"
            onClick={() => handleSelect(customEmoji)}
          >
            <span className="text-xl">{customEmoji}</span>
            <span className="text-text-muted">Use custom emoji</span>
          </button>
        ) : null}

        {hasResults ? (
          <div className="space-y-3">
            {categories.map((category) => (
              <section key={category.label}>
                <h3 className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  {category.label}
                </h3>
                <div className="grid grid-cols-6 gap-0.5">
                  {category.emojis.map((option) => (
                    <button
                      key={`${category.label}-${option.emoji}`}
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-background"
                      onClick={() => handleSelect(option.emoji)}
                      aria-label={`React with ${option.emoji}`}
                      title={option.keywords.join(", ")}
                    >
                      {option.emoji}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="px-1 py-6 text-center text-xs text-text-muted">
            {query.trim()
              ? "No matches. Paste an emoji above to use it."
              : "Search for an emoji or paste your own."}
          </p>
        )}
      </div>
    </div>
  );
}
