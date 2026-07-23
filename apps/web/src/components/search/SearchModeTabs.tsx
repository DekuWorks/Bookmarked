"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export type SearchMode = "books" | "people";

const OPTIONS: { id: SearchMode; label: string }[] = [
  { id: "books", label: "Books" },
  { id: "people", label: "Readers" },
];

function parseMode(value: string | null): SearchMode {
  return value === "people" ? "people" : "books";
}

export function SearchModeTabs() {
  const searchParams = useSearchParams();
  const mode = parseMode(searchParams.get("mode"));

  return (
    <div className="pill-tabs mx-auto w-full max-w-md justify-center" role="tablist" aria-label="Search type">
      {OPTIONS.map((option) => {
        const params = new URLSearchParams(searchParams.toString());
        if (option.id === "books") {
          params.delete("mode");
        } else {
          params.set("mode", option.id);
        }
        const qs = params.toString();
        const href = qs ? `/search/?${qs}` : option.id === "books" ? "/search/" : `/search/?mode=${option.id}`;

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

export function getSearchMode(searchParams: URLSearchParams): SearchMode {
  return parseMode(searchParams.get("mode"));
}
