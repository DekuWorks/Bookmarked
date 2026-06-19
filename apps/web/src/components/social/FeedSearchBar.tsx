"use client";

import { Input } from "@/components/ui/Input";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function FeedSearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Input
        label="Search feed"
        name="feed-search"
        placeholder="Search readers, books, or posts"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
        autoComplete="off"
      />
      <span
        className="pointer-events-none absolute right-3 top-[2.65rem] text-text-muted"
        aria-hidden
      >
        🔍
      </span>
    </div>
  );
}
