import { Text, View } from "react-native";
import { PlusBadge } from "./PlusBadge";
import { PLUS_ANNUAL_SAVINGS_COPY, PLUS_DISPLAY_PRICES } from "../../../../packages/utils/plusPricing";
import { HOME_ANNUAL_SAVINGS_COPY, HOME_DISPLAY_PRICES } from "../../../../packages/utils/homePricing";
import { PLUS_UNLIMITED_FAIR_USE_COPY } from "../../../../packages/utils/subscription";

const ROWS = [
  { label: "Custom shelves", free: "1", plus: "Unlimited", home: "Unlimited" },
  { label: "Saved quotes", free: "25", plus: "Unlimited", home: "Unlimited" },
  { label: "Quote graphics", free: "3 / month", plus: "Unlimited", home: "Unlimited" },
  { label: "Book clubs", free: "3", plus: "Unlimited", home: "Unlimited" },
  { label: "Reading DNA", free: "Top 3", plus: "Full", home: "Advanced" },
  { label: "Insights & Wrapped", free: "Yearly", plus: "Monthly + yearly", home: "Monthly + yearly" },
  { label: "Scanner / companion", free: "—", plus: "Included", home: "Included" },
  { label: "Book / Reader Map", free: "—", plus: "—", home: "Yes" },
] as const;

type Props = {
  showHome?: boolean;
};

export function SubscriptionComparison({ showHome = true }: Props) {
  return (
    <View
      className="overflow-hidden rounded-2xl border border-brand-border bg-surface"
      accessibilityRole="summary"
      accessibilityLabel="Membership comparison"
    >
      <View className="flex-row bg-primary/10 px-3 py-3">
        <Text className="flex-1 text-xs font-semibold text-puce-red">Feature</Text>
        <Text className="w-16 text-center text-xs font-semibold text-puce-red">Free</Text>
        <View className="w-20 items-center">
          <PlusBadge compact />
        </View>
        {showHome ? (
          <Text className="w-16 text-center text-xs font-semibold text-puce-red">Home</Text>
        ) : null}
      </View>
      {ROWS.map((row) => (
        <View key={row.label} className="flex-row border-t border-brand-border px-3 py-2.5">
          <Text className="flex-1 text-sm text-ink">{row.label}</Text>
          <Text className="w-16 text-center text-sm text-ink-muted">{row.free}</Text>
          <Text className="w-20 text-center text-sm text-ink">{row.plus}</Text>
          {showHome ? (
            <Text className="w-16 text-center text-sm text-ink">{row.home}</Text>
          ) : null}
        </View>
      ))}
      <Text className="border-t border-brand-border px-3 py-2 text-xs text-ink-muted">
        Plus: {PLUS_DISPLAY_PRICES.monthlyLabel} or {PLUS_DISPLAY_PRICES.yearlyLabel} (
        {PLUS_ANNUAL_SAVINGS_COPY.label}). Home: {HOME_DISPLAY_PRICES.monthlyLabel} or{" "}
        {HOME_DISPLAY_PRICES.yearlyLabel} ({HOME_ANNUAL_SAVINGS_COPY.label}). Subscribe buttons use
        the App Store price. {PLUS_UNLIMITED_FAIR_USE_COPY}
      </Text>
    </View>
  );
}
