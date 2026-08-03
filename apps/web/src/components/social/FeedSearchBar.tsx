"use client";

import { Input } from "@/components/ui/Input";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function FeedSearchBar({ value, onChange }: Props) {
  return (
    <div className="relative w-full">
      <Input
        label="Search feed"
        variant="search"
        hideLabel
        name="feed-search"
        placeholder="Search readers, books, or posts"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pr-11"
        autoComplete="off"
      />
      <span
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
        aria-hidden
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
    </div>
  );
}
