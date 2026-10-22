import { Text, View } from "react-native";
import { HOME_ANNUAL_SAVINGS_COPY, HOME_DISPLAY_PRICES } from "../../../../packages/utils/homePricing";
import { PLUS_ANNUAL_SAVINGS_COPY, PLUS_DISPLAY_PRICES } from "../../../../packages/utils/plusPricing";
import { PRICING_TIER_CATALOG } from "../../../../packages/utils/pricingTiers";
import { PLUS_UNLIMITED_FAIR_USE_COPY } from "../../../../packages/utils/subscription";
import { PlusBadge } from "./PlusBadge";

type Props = {
  showHome?: boolean;
};

export function SubscriptionComparison({ showHome = true }: Props) {
  const tiers = PRICING_TIER_CATALOG.filter((tier) => showHome || tier.id !== "home");

  return (
    <View
      className="overflow-hidden rounded-2xl border border-brand-border bg-surface"
      accessibilityRole="summary"
      accessibilityLabel="Membership comparison"
    >
      {tiers.map((tier, index) => (
        <View
          key={tier.id}
          className={index === 0 ? "px-3 py-3" : "border-t border-brand-border px-3 py-3"}
        >
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-puce-red">{tier.name}</Text>
            {tier.id === "plus" ? <PlusBadge compact /> : null}
          </View>
          {tier.includesLabel ? (
            <Text className="mt-1 text-sm font-medium text-ink">{tier.includesLabel}</Text>
          ) : null}
          {tier.groups.map((group) => (
            <View key={group.id} className="mt-3">
              <Text className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {group.heading}
              </Text>
              {group.items.map((item) => (
                <Text key={item} className="mt-1 text-sm text-ink">
                  {`• ${item}`}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ))}
      <Text className="border-t border-brand-border px-3 py-2 text-xs text-ink-muted">
        Plus: {PLUS_DISPLAY_PRICES.monthlyLabel} or {PLUS_DISPLAY_PRICES.yearlyLabel} (about{" "}
        {PLUS_DISPLAY_PRICES.yearlyMonthlyEquivalentLabel}; {PLUS_ANNUAL_SAVINGS_COPY.label}). Home:{" "}
        {HOME_DISPLAY_PRICES.monthlyLabel} or {HOME_DISPLAY_PRICES.yearlyLabel} (about{" "}
        {HOME_DISPLAY_PRICES.yearlyMonthlyEquivalentLabel}; {HOME_ANNUAL_SAVINGS_COPY.label}).
        Subscribe buttons use the App Store price. {PLUS_UNLIMITED_FAIR_USE_COPY}
      </Text>
    </View>
  );
}
