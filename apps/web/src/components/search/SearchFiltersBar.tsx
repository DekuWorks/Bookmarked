"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  SEARCH_LANGUAGE_OPTIONS,
  SEARCH_SORT_OPTIONS,
} from "@/lib/constants/searchFilters";
import { usePreferredCatalogLanguage } from "@/lib/hooks/usePreferredOpenLibraryLanguage";
import { resolveSearchLanguageFilterValue } from "@/lib/utils/searchLanguage";
import { cn } from "@/lib/utils/cn";

function parseYear(value: string | null): string {
  if (!value) return "";
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? String(Math.floor(n)) : "";
}

export function SearchFiltersBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const preferredLanguage = usePreferredCatalogLanguage();
  const urlLang = searchParams.get("lang");
  const language = resolveSearchLanguageFilterValue(urlLang, preferredLanguage);
  const yearFrom = parseYear(searchParams.get("yearFrom"));
  const yearTo = parseYear(searchParams.get("yearTo"));
  const sort = searchParams.get("sort") ?? "";

  function pushFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if (q) params.set("q", q);
    router.push(`/search/?${params.toString()}`);
  }

  const selectClass = cn(
    "min-h-[44px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text sm:w-auto",
    "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
  );

  return (
    <div className="mx-auto w-full max-w-4xl rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="mb-3 text-center text-sm font-medium text-puce-red">Refine results</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-left">
          <span className="mb-1 block text-xs font-medium text-text-muted">Language</span>
          <select
            value={language}
            onChange={(e) =>
              pushFilters({ lang: e.target.value ? e.target.value : "any" })
            }
            className={selectClass}
            aria-label="Filter by language"
          >
            {SEARCH_LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value || "any"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-left">
          <span className="mb-1 block text-xs font-medium text-text-muted">Year from</span>
          <input
            type="number"
            min={1000}
            max={2100}
            placeholder="e.g. 1990"
            value={yearFrom}
            onChange={(e) => pushFilters({ yearFrom: e.target.value || null })}
            className={selectClass}
            aria-label="Published year from"
          />
        </label>

        <label className="block text-left">
          <span className="mb-1 block text-xs font-medium text-text-muted">Year to</span>
          <input
            type="number"
            min={1000}
            max={2100}
            placeholder="e.g. 2024"
            value={yearTo}
            onChange={(e) => pushFilters({ yearTo: e.target.value || null })}
            className={selectClass}
            aria-label="Published year to"
          />
        </label>

        <label className="block text-left">
          <span className="mb-1 block text-xs font-medium text-text-muted">Sort by</span>
          <select
            value={sort}
            onChange={(e) => pushFilters({ sort: e.target.value || null })}
            className={selectClass}
            aria-label="Sort results"
          >
            {SEARCH_SORT_OPTIONS.map((opt) => (
              <option key={opt.value || "relevance"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
