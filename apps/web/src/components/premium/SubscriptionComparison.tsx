"use client";

import { PlusBadge } from "@/components/premium/PlusBadge";
import { cn } from "@/lib/utils/cn";
import { PLUS_ANNUAL_SAVINGS_COPY, PLUS_DISPLAY_PRICES } from "@bookmarked/utils/plusPricing";
import { HOME_ANNUAL_SAVINGS_COPY, HOME_DISPLAY_PRICES } from "@bookmarked/utils/homePricing";
import { PLUS_UNLIMITED_FAIR_USE_COPY } from "@bookmarked/utils/subscription";

type Row = {
  label: string;
  free: string;
  plus: string;
  home?: string;
};

const ROWS: Row[] = [
  { label: "Custom shelves", free: "1", plus: "Unlimited", home: "Unlimited" },
  { label: "Saved quotes", free: "25", plus: "Unlimited", home: "Unlimited" },
  { label: "Quote graphics", free: "3 / month", plus: "Unlimited", home: "Unlimited" },
  { label: "Book clubs", free: "3", plus: "Unlimited", home: "Unlimited" },
  { label: "Reading DNA", free: "Top 3 traits", plus: "Full dashboard", home: "Advanced" },
  { label: "Insights & Wrapped", free: "Yearly recap", plus: "Monthly + yearly", home: "Monthly + yearly" },
  { label: "Quote scanner / AI companion", free: "—", plus: "Included", home: "Included" },
  { label: "Book Map / Reader Map", free: "—", plus: "—", home: "Included" },
  { label: "Experiences + concierge", free: "—", plus: "—", home: "Included" },
];

type Props = {
  className?: string;
  showHome?: boolean;
};

export function SubscriptionComparison({ className, showHome = true }: Props) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-border bg-surface dark:border-border",
        className
      )}
      role="region"
      aria-label="Membership comparison"
    >
      <table className="min-w-full text-left text-sm">
        <thead className="bg-primary/10 text-puce-red dark:text-primary">
          <tr>
            <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
              Feature
            </th>
            <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
              Free
            </th>
            <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
              <span className="inline-flex items-center gap-2">
                Plus <PlusBadge compact />
              </span>
            </th>
            {showHome ? (
              <th scope="col" className="px-3 py-3 font-semibold sm:px-4">
                Home
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-t border-border">
              <th scope="row" className="px-3 py-2.5 font-medium text-text sm:px-4">
                {row.label}
              </th>
              <td className="px-3 py-2.5 text-text-muted sm:px-4">{row.free}</td>
              <td className="px-3 py-2.5 text-text sm:px-4">{row.plus}</td>
              {showHome ? (
                <td className="px-3 py-2.5 text-text sm:px-4">{row.home ?? row.plus}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-3 py-2 text-xs text-text-muted sm:px-4">
        Plus display: {PLUS_DISPLAY_PRICES.monthlyLabel} or {PLUS_DISPLAY_PRICES.yearlyLabel}{" "}
        ({PLUS_DISPLAY_PRICES.yearlyMonthlyEquivalentLabel}; {PLUS_ANNUAL_SAVINGS_COPY.label}).
        Home display: {HOME_DISPLAY_PRICES.monthlyLabel} or {HOME_DISPLAY_PRICES.yearlyLabel}{" "}
        ({HOME_DISPLAY_PRICES.yearlyMonthlyEquivalentLabel}; {HOME_ANNUAL_SAVINGS_COPY.label}).
        Subscribe in the Bookmarked iOS app — the App Store shows the localised button price.{" "}
        {PLUS_UNLIMITED_FAIR_USE_COPY}
      </p>
    </div>
  );
}
