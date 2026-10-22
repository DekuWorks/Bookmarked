"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { HOME_ANNUAL_SAVINGS_COPY, HOME_DISPLAY_PRICES } from "@bookmarked/utils/homePricing";
import { PLUS_ANNUAL_SAVINGS_COPY, PLUS_DISPLAY_PRICES } from "@bookmarked/utils/plusPricing";
import { PLUS_UNLIMITED_FAIR_USE_COPY } from "@bookmarked/utils/subscription";

/**
 * Three membership cards with a monthly/yearly switch.
 * Layout adapted from 21st.dev “Pricing Plans with Billing Toggle”
 * by uiable (demo 29547), MIT: https://uiable.com/legal/license
 * framer-motion, lucide-react, and shadcn Badge/Button are not used.
 * Prices and feature copy come from Bookmarked’s existing plans.
 */

type PlanId = "free" | "plus" | "home";

type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyAmount: string;
  yearlyAmount: string;
  yearlyEquivalent?: string;
  savings?: string;
  featuresHeading: string;
  features: string[];
  featured?: boolean;
};

function amountFromLabel(label: string): string {
  const match = /^\$[\d.]+/.exec(label);
  return match?.[0] ?? label;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "The essentials",
    monthlyAmount: "$0",
    yearlyAmount: "$0",
    featuresHeading: "Included",
    features: [
      "1 custom shelf",
      "25 saved quotes",
      "3 quote graphics a month",
      "3 book clubs",
      "Reading DNA: top 3 traits",
      "Yearly Wrapped",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "Reading intelligence",
    monthlyAmount: amountFromLabel(PLUS_DISPLAY_PRICES.monthlyLabel),
    yearlyAmount: amountFromLabel(PLUS_DISPLAY_PRICES.yearlyLabel),
    yearlyEquivalent: PLUS_DISPLAY_PRICES.yearlyMonthlyEquivalentLabel,
    savings: PLUS_ANNUAL_SAVINGS_COPY.label,
    featuresHeading: "With Plus",
    features: [
      "Unlimited custom shelves",
      "Unlimited saved quotes",
      "Unlimited quote graphics",
      "Unlimited book clubs",
      "Full Reading DNA dashboard",
      "Monthly and yearly Wrapped",
      "Quote scanner and AI companion",
    ],
    featured: true,
  },
  {
    id: "home",
    name: "Home",
    tagline: "Real-world community",
    monthlyAmount: amountFromLabel(HOME_DISPLAY_PRICES.monthlyLabel),
    yearlyAmount: amountFromLabel(HOME_DISPLAY_PRICES.yearlyLabel),
    yearlyEquivalent: HOME_DISPLAY_PRICES.yearlyMonthlyEquivalentLabel,
    savings: HOME_ANNUAL_SAVINGS_COPY.label,
    featuresHeading: "With Home",
    features: [
      "Advanced Reading DNA",
      "Book Map and Reader Map",
      "Experiences and concierge",
    ],
  },
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0 text-puce-red dark:text-primary"
    >
      <path
        fill="currentColor"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.2 7.2a1 1 0 0 1-1.4 0L3.3 9.1a1 1 0 1 1 1.4-1.4l4.1 4.1 6.5-6.5a1 1 0 0 1 1.4 0Z"
      />
    </svg>
  );
}

type Props = {
  /** Shown only while the account is not on Plus or Home. */
  onSubscribeIntent?: () => void;
};

export function MembershipPricingCards({ onSubscribeIntent }: Props) {
  const [annual, setAnnual] = useState(false);

  return (
    <section aria-labelledby="membership-pricing-title">
      <header className="mx-auto max-w-2xl text-center">
        <h1
          id="membership-pricing-title"
          className="text-balance text-3xl font-bold text-puce-red sm:text-4xl"
        >
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-text-muted">
          <span className="block">
            Free keeps the essentials, Plus is reading intelligence, and Home is real-world community.
          </span>
          <span className="block">
            Subscribe in the iOS app and this site unlocks on the same account.
          </span>
        </p>
      </header>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          className="inline-flex min-h-11 items-center gap-3 rounded-full py-1 pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => setAnnual((current) => !current)}
        >
          <span
            aria-hidden="true"
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full border border-border bg-border/70 motion-reduce:transition-none",
              annual && "border-primary bg-primary"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-6 rounded-full bg-surface shadow-sm motion-safe:transition-transform motion-reduce:transition-none",
                annual && "translate-x-5"
              )}
            />
          </span>
          <span className="text-sm font-medium text-text">Annual billing</span>
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {annual ? "Showing yearly prices." : "Showing monthly prices."}
      </p>

      <div className="mt-8 grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 md:gap-5 md:pt-3">
        {PLANS.map((plan) => {
          const amount = annual ? plan.yearlyAmount : plan.monthlyAmount;
          const period = annual ? "year" : "month";
          const paid = plan.id !== "free";

          return (
            <article
              key={plan.id}
              aria-labelledby={`plan-${plan.id}-name`}
              className={cn(
                "surface-card flex h-full min-w-0 flex-col p-5 text-left sm:p-6",
                "motion-reduce:transform-none motion-reduce:transition-none",
                plan.featured &&
                  "z-10 border-2 border-puce-red bg-primary/10 md:-translate-y-2 dark:border-primary"
              )}
            >
              <div className="flex min-h-7 items-start justify-between gap-3">
                <h2
                  id={`plan-${plan.id}-name`}
                  className="text-xs font-semibold tracking-[0.14em] text-text-muted uppercase"
                >
                  {plan.name}
                </h2>
                {plan.featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-puce-red px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase dark:bg-primary dark:text-on-primary">
                    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-3">
                      <path
                        fill="currentColor"
                        d="M10 1.8 12.1 7l5.5.4-4.2 3.6 1.3 5.3L10 13.6 5.3 16.3 6.6 11 2.4 7.4 7.9 7 10 1.8Z"
                      />
                    </svg>
                    Popular
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-sm text-text-muted">{plan.tagline}</p>

              <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-text">
                <span className="font-display text-4xl font-bold tracking-tight text-puce-red sm:text-5xl">
                  {amount}
                </span>
                {paid ? (
                  <span className="text-sm text-text-muted">/ {period}</span>
                ) : (
                  <span className="text-sm text-text-muted">forever</span>
                )}
              </p>
              <p className="mt-1 min-h-10 text-sm text-pretty text-text-muted">
                {paid
                  ? annual
                    ? `Billed yearly, about ${plan.yearlyEquivalent}. ${plan.savings}.`
                    : "Billed monthly."
                  : "No subscription."}
              </p>

              {paid ? (
                <Button
                  variant={plan.featured ? "primary" : "outline"}
                  className="mt-5 w-full motion-reduce:transform-none"
                  onClick={onSubscribeIntent}
                >
                  Subscribe in the iOS app
                </Button>
              ) : (
                <p className="mt-5 flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-text-muted">
                  Your current plan
                </p>
              )}

              <div className="mt-6">
                <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                  {plan.featuresHeading}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-text">
                      <CheckIcon />
                      <span className="min-w-0 text-pretty">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mx-auto mt-6 max-w-3xl text-pretty text-center text-xs text-text-muted">
        {`Display prices: Plus ${PLUS_DISPLAY_PRICES.monthlyLabel} or ${PLUS_DISPLAY_PRICES.yearlyLabel}. Home ${HOME_DISPLAY_PRICES.monthlyLabel} or ${HOME_DISPLAY_PRICES.yearlyLabel}. The App Store shows the localised button price. There is no web checkout. ${PLUS_UNLIMITED_FAIR_USE_COPY}`}
      </p>
    </section>
  );
}
