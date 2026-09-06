"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/Input";
import { shouldShowSearchClear } from "@bookmarked/utils/searchClear";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
  label: string;
  name?: string;
};

function CloseIcon() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { value, onChange, onClear, placeholder, label, name = "q" },
  ref
) {
  const showClear = shouldShowSearchClear(value);

  return (
    <div className="relative">
      <Input
        ref={ref}
        label={label}
        variant="search"
        hideLabel
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={showClear ? "pr-12" : undefined}
        autoComplete="off"
      />
      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-text-muted hover:bg-primary/10 hover:text-puce-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
});
