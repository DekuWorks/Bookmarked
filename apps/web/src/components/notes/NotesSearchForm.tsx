"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function NotesSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }

    const query = params.toString();
    router.push(query ? `/notes/?${query}` : "/notes/");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 sm:flex-row sm:items-end sm:justify-center"
    >
      <div className="min-w-0 w-full flex-1 sm:max-w-md">
        <Input
          label="Search notes"
          name="q"
          placeholder="Keywords in quotes or reflections"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <Button type="submit" variant="secondary" className="w-full sm:mb-4 sm:w-auto">
        Search
      </Button>
    </form>
  );
}
