"use client";

import {
  getCustomShelfIconA11yLabel,
  getCustomShelfIconCatalog,
  resolveCustomShelfPickerSelection,
  sanitizeShelfEmoji,
  type CustomShelfIconSelection,
} from "@/lib/constants/shelfIcons";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: CustomShelfIconSelection;
  onChange: (next: CustomShelfIconSelection) => void;
  disabled?: boolean;
};

export function CustomShelfIconPicker({ value, onChange, disabled }: Props) {
  const selected = resolveCustomShelfPickerSelection(value);
  const catalog = getCustomShelfIconCatalog();
  const emojiSelected = selected.type === "emoji";

  return (
    <fieldset className="mb-4" disabled={disabled}>
      <legend className="mb-1.5 block text-sm font-medium text-text">Choose icon</legend>
      <p className="mb-2 text-xs text-text-muted">
        The bookmark is selected by default. You can use an emoji instead.
      </p>
      <div
        role="radiogroup"
        aria-label="Custom shelf icon"
        className="flex flex-wrap gap-2"
      >
        {catalog.map((item, index) => {
          const isSelected = selected.type === "bookmarked" && item.key === selected.value;
          return (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={getCustomShelfIconA11yLabel(
                { type: "bookmarked", value: item.key },
                isSelected
              )}
              disabled={disabled}
              onClick={() => onChange({ type: "bookmarked", value: item.key })}
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border-2 bg-transparent p-1",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/60"
              )}
            >
              <ShelfIcon iconKey={item.key} size="small" />
              <span className="sr-only">{index + 1}</span>
              {isSelected ? <span className="sr-only">Selected</span> : null}
            </button>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={emojiSelected}
          aria-label={getCustomShelfIconA11yLabel(
            { type: "emoji", value: emojiSelected ? selected.value : "" },
            emojiSelected
          )}
          disabled={disabled}
          onClick={() =>
            onChange({
              type: "emoji",
              value: emojiSelected ? selected.value : "",
            })
          }
          className={cn(
            "inline-flex min-h-11 items-center justify-center rounded-lg border-2 bg-transparent px-3 py-1 text-sm font-medium",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            emojiSelected
              ? "border-primary bg-primary/10 text-text"
              : "border-border text-text-muted hover:border-primary/60"
          )}
        >
          {emojiSelected && selected.value ? (
            <span aria-hidden className="mr-1.5 text-lg leading-none">
              {selected.value}
            </span>
          ) : null}
          Use Emoji
        </button>
      </div>
      {emojiSelected ? (
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium text-text">Emoji</span>
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={selected.value}
            disabled={disabled}
            onChange={(event) => {
              const next = event.target.value;
              const sanitized = sanitizeShelfEmoji(next);
              onChange({ type: "emoji", value: sanitized ?? next });
            }}
            placeholder="Pick one emoji"
            className={cn(
              "min-h-[44px] w-full max-w-[12rem] rounded-lg border border-border bg-surface px-3 py-2 text-lg text-text",
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            )}
            aria-label="Custom shelf emoji"
          />
        </label>
      ) : null}
    </fieldset>
  );
}
