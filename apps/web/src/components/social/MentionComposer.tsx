"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/Input";
import { searchProfilesForMessaging } from "@/lib/services/messages";
import type { MessageProfile } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  viewerId: string;
  minHeightClassName?: string;
};

function activeMentionQuery(value: string, cursor: number): string | null {
  const before = value.slice(0, cursor);
  const match = before.match(/@([a-zA-Z0-9_]*)$/);
  return match ? match[1] : null;
}

export function MentionComposer({
  value,
  onChange,
  placeholder,
  className,
  viewerId,
  minHeightClassName = "min-h-[80px]",
}: Props) {
  const [suggestions, setSuggestions] = useState<MessageProfile[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSuggestions = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      const results = await searchProfilesForMessaging(query, viewerId);
      setSuggestions(results.filter((profile) => profile.username));
      setHighlightIndex(0);
    },
    [viewerId]
  );

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  function handleChange(nextValue: string) {
    onChange(nextValue);
    const cursor = textareaRef.current?.selectionStart ?? nextValue.length;
    const query = activeMentionQuery(nextValue, cursor);
    setMentionQuery(query);

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (query === null) {
      setSuggestions([]);
      return;
    }

    searchTimer.current = setTimeout(() => {
      void loadSuggestions(query);
    }, 200);
  }

  function insertMention(username: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const atIndex = before.lastIndexOf("@");
    if (atIndex < 0) return;

    const nextValue = `${before.slice(0, atIndex)}@${username} ${after}`;
    onChange(nextValue);
    setMentionQuery(null);
    setSuggestions([]);

    requestAnimationFrame(() => {
      const nextCursor = atIndex + username.length + 2;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!suggestions.length || mentionQuery === null) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      const profile = suggestions[highlightIndex];
      if (profile?.username) {
        event.preventDefault();
        insertMention(profile.username);
      }
    } else if (event.key === "Escape") {
      setSuggestions([]);
      setMentionQuery(null);
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onClick={(event) => {
          const target = event.currentTarget;
          const query = activeMentionQuery(target.value, target.selectionStart);
          setMentionQuery(query);
          if (query) void loadSuggestions(query);
        }}
        placeholder={placeholder}
        className={cn("mb-0", minHeightClassName, className)}
      />

      {suggestions.length > 0 && mentionQuery !== null ? (
        <ul
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-md"
          role="listbox"
        >
          {suggestions.map((profile, index) => {
            const label = profile.display_name?.trim() || profile.username || "Reader";
            return (
              <li key={profile.id} role="option" aria-selected={index === highlightIndex}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                    index === highlightIndex ? "bg-background text-text" : "text-text hover:bg-background/80"
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    if (profile.username) insertMention(profile.username);
                  }}
                >
                  <span className="font-medium text-puce-red">@{profile.username}</span>
                  <span className="truncate text-text-muted">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
