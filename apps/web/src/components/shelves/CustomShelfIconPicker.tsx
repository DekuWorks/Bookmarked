"use client";

import {
  CUSTOM_SHELF_ICON_KEYS,
  DEFAULT_CUSTOM_SHELF_ICON_KEY,
  getCustomShelfA11yLabel,
  getCustomShelfIconCatalog,
  type CustomShelfIconKey,
} from "@/lib/constants/shelfIcons";
import { ShelfIcon } from "@/components/shelves/ShelfIcon";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: string;
  onChange: (key: CustomShelfIconKey) => void;
  disabled?: boolean;
};

export function CustomShelfIconPicker({ value, onChange, disabled }: Props) {
  const selected = CUSTOM_SHELF_ICON_KEYS.includes(value as CustomShelfIconKey)
    ? (value as CustomShelfIconKey)
    : DEFAULT_CUSTOM_SHELF_ICON_KEY;
  const catalog = getCustomShelfIconCatalog();

  return (
    <fieldset className="mb-4" disabled={disabled}>
      <legend className="mb-1.5 block text-sm font-medium text-text">Choose icon</legend>
      <p className="mb-2 text-xs text-text-muted">
        First icon is selected by default. You can change it before saving.
      </p>
      <div
        role="radiogroup"
        aria-label="Custom shelf icon"
        className="flex flex-wrap gap-2"
      >
        {catalog.map((item, index) => {
          const isSelected = item.key === selected;
          return (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={getCustomShelfA11yLabel(item.key, isSelected)}
              disabled={disabled}
              onClick={() => onChange(item.key)}
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
              {isSelected ? (
                <span className="sr-only">Selected</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
