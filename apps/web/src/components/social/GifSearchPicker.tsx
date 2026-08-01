"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  fetchTrendingGiphy,
  isGiphySearchConfigured,
  searchGiphy,
  type GiphySearchResult,
} from "@/lib/services/giphy";
import { Z_CLASS } from "@/lib/constants/zIndex";
import { cn } from "@/lib/utils/cn";

type Props = {
  gifInput: string;
  onGifInputChange: (value: string) => void;
  onGifInputBlur: () => void;
  onSelect: (result: GiphySearchResult) => void;
  disabled?: boolean;
  hasGif?: boolean;
  className?: string;
};

const compactInputClassName =
  "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

function GifResultGrid({
  results,
  onSelect,
  disabled,
}: {
  results: GiphySearchResult[];
  onSelect: (result: GiphySearchResult) => void;
  disabled?: boolean;
}) {
  if (results.length === 0) return null;

  return (
    <ul className="grid grid-cols-4 gap-1">
      {results.map((result) => (
        <li key={result.id}>
          <button
            type="button"
            onClick={() => onSelect(result)}
            className="block min-h-[36px] w-full overflow-hidden rounded border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
            title={result.title}
            disabled={disabled}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.previewUrl}
              alt={result.title}
              className="aspect-square w-full object-cover"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function GifSearchPicker({
  gifInput,
  onGifInputChange,
  onGifInputBlur,
  onSelect,
  disabled,
  hasGif = false,
  className,
}: Props) {
  const searchEnabled = isGiphySearchConfigured();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<GiphySearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchEnabled) {
      setResults([]);
      setLoading(false);
      return;
    }

    const query = searchQuery.trim();
    const handle = window.setTimeout(() => {
      setLoading(true);
      const request = query ? searchGiphy(query) : fetchTrendingGiphy();
      void request
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, query ? 350 : 0);

    return () => window.clearTimeout(handle);
  }, [searchQuery, searchEnabled]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(result: GiphySearchResult) {
    onSelect(result);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={hasGif ? "GIF selected, open GIF picker" : "Add GIF"}
      >
        <span className={cn(hasGif && "text-puce-red")}>{hasGif ? "GIF added" : "Add GIF"}</span>
        {hasGif ? (
          <span className="ml-1.5 rounded-full bg-puce-red/10 px-1.5 py-0.5 text-xs font-medium text-puce-red">
            ✓
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="GIF search"
          className={cn(
            "absolute left-0 mt-1 w-[min(calc(100vw-2rem),18rem)] rounded-lg border border-border bg-surface p-2 shadow-md",
            Z_CLASS.popover
          )}
        >
          {searchEnabled ? (
            <>
              <label className="sr-only" htmlFor="gif-search-input">
                Search Giphy
              </label>
              <input
                id="gif-search-input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search Giphy…"
                className={compactInputClassName}
                disabled={disabled}
                autoFocus
              />
              <div className="mt-1.5 max-h-40 overflow-y-auto overscroll-contain">
                {loading ? (
                  <p className="py-2 text-center text-xs text-text-muted">
                    {searchQuery.trim() ? "Searching…" : "Loading trending…"}
                  </p>
                ) : results.length === 0 && searchQuery.trim() ? (
                  <p className="py-2 text-center text-xs text-text-muted">No GIFs found.</p>
                ) : (
                  <GifResultGrid results={results} onSelect={handleSelect} disabled={disabled} />
                )}
              </div>
            </>
          ) : (
            <p className="text-xs leading-snug text-text-muted">
              GIF search is not configured. Paste a Giphy link below, or set{" "}
              <code className="rounded bg-background px-1 py-0.5 text-[11px]">
                NEXT_PUBLIC_GIPHY_API_KEY
              </code>{" "}
              to enable search.
            </p>
          )}

          <details className="mt-2 border-t border-border pt-1.5">
            <summary
              className={cn(
                "cursor-pointer list-none text-xs font-medium text-text-muted",
                "[&::-webkit-details-marker]:hidden"
              )}
            >
              Paste Giphy link
            </summary>
            <label className="sr-only" htmlFor="gif-url-input">
              Giphy URL
            </label>
            <input
              id="gif-url-input"
              type="url"
              value={gifInput}
              onChange={(event) => onGifInputChange(event.target.value)}
              onBlur={onGifInputBlur}
              placeholder="giphy.com/…"
              className={cn(compactInputClassName, "mt-1.5")}
              disabled={disabled}
            />
          </details>
        </div>
      ) : null}
    </div>
  );
}
