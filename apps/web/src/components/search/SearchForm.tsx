"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SearchMode } from "@/components/search/SearchModeTabs";
import { isIsbnQuery } from "@/lib/utils/isbn";

type Props = {
  mode?: SearchMode;
};

export function SearchForm({ mode = "books" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;

    const params = new URLSearchParams();
    params.set("q", trimmed);
    if (mode !== "books") {
      params.set("cat", mode);
    }
    router.push(`/search/?${params.toString()}`);
  }

  const isbnHint = mode === "books" && isIsbnQuery(q);
  const placeholder =
    mode === "people"
      ? "Name or @username"
      : mode === "clubs"
        ? "Club name"
        : "Title, author, or ISBN";
  const label =
    mode === "people" ? "Search readers" : mode === "clubs" ? "Search book clubs" : "Search books";

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 sm:flex-row sm:items-end sm:justify-center"
    >
      <div className="min-w-0 w-full flex-1 sm:max-w-md">
        <Input
          ref={inputRef}
          label={label}
          variant="search"
          hideLabel
          name="q"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {isbnHint ? (
          <p className="-mt-2 text-xs text-primary">ISBN detected — searching by ISBN</p>
        ) : null}
      </div>
      <Button type="submit" variant="secondary" className="w-full sm:mb-0 sm:w-auto">
        Search
      </Button>
    </form>
  );
}
