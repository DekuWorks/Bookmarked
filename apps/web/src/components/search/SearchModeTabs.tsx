"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export type SearchMode = "books" | "people" | "clubs";

const OPTIONS: { id: SearchMode; label: string }[] = [
  { id: "books", label: "Books" },
  { id: "people", label: "People" },
  { id: "clubs", label: "Clubs" },
];

function parseMode(value: string | null): SearchMode {
  if (value === "people" || value === "clubs") return value;
  return "books";
}

/** Accepts `cat` (origin helper) and legacy `mode`. */
export function getSearchMode(searchParams: URLSearchParams): SearchMode {
  return parseMode(searchParams.get("cat") ?? searchParams.get("mode"));
}

export function SearchModeTabs() {
  const searchParams = useSearchParams();
  const mode = getSearchMode(searchParams);

  return (
    <div className="pill-tabs mx-auto w-full max-w-md justify-center" role="tablist" aria-label="Search type">
      {OPTIONS.map((option) => {
        const params = new URLSearchParams();
        if (option.id !== "books") {
          params.set("cat", option.id);
        }
        const qs = params.toString();
        const href = qs ? `/search/?${qs}` : "/search/";

        return (
          <Link
            key={option.id}
            href={href}
            role="tab"
            aria-selected={mode === option.id}
            data-active={mode === option.id ? "true" : "false"}
            className={cn("pill-tab shrink-0")}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
