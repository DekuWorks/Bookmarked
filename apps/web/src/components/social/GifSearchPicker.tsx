"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import {
  fetchTrendingGiphy,
  isGiphySearchConfigured,
  searchGiphy,
  type GiphySearchResult,
} from "@/lib/services/giphy";

type Props = {
  gifInput: string;
  onGifInputChange: (value: string) => void;
  onGifInputBlur: () => void;
  onSelect: (result: GiphySearchResult) => void;
  disabled?: boolean;
};

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
    <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
      {results.map((result) => (
        <li key={result.id}>
          <button
            type="button"
            onClick={() => onSelect(result)}
            className="block w-full overflow-hidden rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
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
}: Props) {
  const searchEnabled = isGiphySearchConfigured();
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

  return (
    <div className="space-y-3">
      {searchEnabled ? (
        <div>
          <Input
            label="Search Giphy"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a GIF"
            className="mb-0"
            disabled={disabled}
          />
          {loading ? (
            <p className="mt-2 text-xs text-text-muted">
              {searchQuery.trim() ? "Searching…" : "Loading trending GIFs…"}
            </p>
          ) : (
            <GifResultGrid results={results} onSelect={onSelect} disabled={disabled} />
          )}
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          GIF search is not configured. Paste a Giphy link below, or set{" "}
          <code className="rounded bg-background px-1 py-0.5 text-xs">NEXT_PUBLIC_GIPHY_API_KEY</code>{" "}
          to enable search.
        </p>
      )}

      <Input
        label="Giphy URL"
        value={gifInput}
        onChange={(e) => onGifInputChange(e.target.value)}
        onBlur={onGifInputBlur}
        placeholder="Paste a giphy.com link"
        className="mb-0"
        disabled={disabled}
      />
    </div>
  );
}
