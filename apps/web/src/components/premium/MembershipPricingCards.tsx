"use client";

import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils/cn";
import { HOME_ANNUAL_SAVINGS_COPY, HOME_DISPLAY_PRICES } from "@bookmarked/utils/homePricing";
import { PLUS_ANNUAL_SAVINGS_COPY, PLUS_DISPLAY_PRICES } from "@bookmarked/utils/plusPricing";
import { pricingTierById, type PricingTierId } from "@bookmarked/utils/pricingTiers";
import { PLUS_UNLIMITED_FAIR_USE_COPY } from "@bookmarked/utils/subscription";
import { useState } from "react";

/**
 * Three membership cards with a monthly/yearly switch.
 * Visual structure from the 21st.dev pricing mockup (uiable block-pricing-18, MIT:
 * https://uiable.com/legal/license). Bookmarked prices and feature copy only.
 * No shadcn, framer-motion, or lucide-react.
 */

type Plan = {
  id: PricingTierId;
  monthlyAmount: string;
  yearlyAmount: string;
  savings?: string;
  featured?: boolean;
};

function amountFromLabel(label: string): string {
  const match = /^\$[\d.]+/.exec(label);
  return match?.[0] ?? label;
}

const PLANS: Plan[] = [
  {
    id: "free",
    monthlyAmount: "$0",
    yearlyAmount: "$0",
  },
  {
    id: "plus",
    monthlyAmount: amountFromLabel(PLUS_DISPLAY_PRICES.monthlyLabel),
    yearlyAmount: amountFromLabel(PLUS_DISPLAY_PRICES.yearlyLabel),
    savings: PLUS_ANNUAL_SAVINGS_COPY.label,
    featured: true,
  },
  {
    id: "home",
    monthlyAmount: amountFromLabel(HOME_DISPLAY_PRICES.monthlyLabel),
    yearlyAmount: amountFromLabel(HOME_DISPLAY_PRICES.yearlyLabel),
    savings: HOME_ANNUAL_SAVINGS_COPY.label,
    featured: false,
  },
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="mt-0.5 size-4 shrink-0 text-text-muted"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 10.5 8 14l7.5-8"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-3">
      <path
        fill="currentColor"
        d="M10 1.8 12.1 7l5.5.4-4.2 3.6 1.3 5.3L10 13.6 5.3 16.3 6.6 11 2.4 7.4 7.9 7 10 1.8Z"
      />
    </svg>
  );
}

type Props = {
  /** Shown only while the account is not on Plus or Home. Scrolls to the iOS instructions. */
  onSubscribeIntent?: () => void;
  /** Public pages send visitors to /upgrade/ instead of starting checkout. */
  subscribeHref?: string;
  headingLevel?: 1 | 2;
  /** Logged-out landing page. The upgrade page keeps “Your current plan”. */
  freeCta?: { href: string; label: string };
};

export function MembershipPricingCards({
  onSubscribeIntent,
  subscribeHref,
  headingLevel = 1,
  freeCta,
}: Props) {
  const [annual, setAnnual] = useState(false);
  const Heading = headingLevel === 2 ? "h2" : "h1";
  const savingsPercent = PLUS_ANNUAL_SAVINGS_COPY.percent;

  return (
    <section
      aria-labelledby="membership-pricing-title"
      className="relative min-w-0 bg-background px-4 py-14 text-left sm:px-6 sm:py-20 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 text-text/15 dark:text-text/10 [background-image:radial-gradient(circle,currentColor_1px,transparent_1px)] [background-size:18px_18px]"
      />

      <div className="relative mx-auto w-full min-w-0 max-w-6xl">
        <header className="mx-auto max-w-2xl text-center">
          <Heading
            id="membership-pricing-title"
            className="text-balance text-4xl font-extrabold tracking-tight text-text sm:text-5xl"
            style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
          >
            Simple, Transparent Pricing
          </Heading>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-text-muted sm:text-lg">
            Free keeps the essentials. Plus is reading intelligence, and Home is real-world
            community.
          </p>
        </header>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            role="switch"
            aria-checked={annual}
            className="inline-flex min-h-11 items-center gap-3 rounded-full py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => setAnnual((current) => !current)}
          >
            <span
              aria-hidden="true"
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full bg-border motion-reduce:transition-none",
                annual && "bg-text"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow-sm motion-safe:transition-transform motion-reduce:transition-none",
                  annual && "translate-x-5"
                )}
              />
            </span>
            <span className="text-sm font-medium text-text">
              Annual billing{" "}
              <span className="font-semibold">(save ~{savingsPercent}%)</span>
            </span>
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {annual ? "Showing yearly prices." : "Showing monthly prices."}
        </p>

        <div className="mt-8 grid w-full min-w-0 grid-cols-1 items-stretch gap-6 pt-3 md:grid-cols-3 md:items-start md:gap-5 md:pt-6">
          {PLANS.map((plan) => {
            const catalog = pricingTierById(plan.id);
            const amount = annual ? plan.yearlyAmount : plan.monthlyAmount;
            const period = annual ? "per year" : "per month";
            const paid = plan.id !== "free";

            return (
              <article
                key={plan.id}
                aria-labelledby={`plan-${plan.id}-name`}
                className={cn(
                  "relative flex h-full min-w-0 flex-col rounded-2xl bg-surface p-6 text-left sm:p-8",
                  "motion-reduce:transform-none",
                  plan.featured
                    ? "z-10 mt-3 border-2 border-text shadow-xl md:mt-0"
                    : "border border-border shadow-sm md:mt-8"
                )}
              >
                {plan.featured ? (
                  <span className="absolute top-0 right-5 z-10 inline-flex -translate-y-1/2 items-center gap-1 rounded-md bg-text px-2.5 py-1 text-[11px] font-semibold text-background">
                    <StarIcon />
                    Popular
                  </span>
                ) : null}

                <h3
                  id={`plan-${plan.id}-name`}
                  className="text-center text-xs font-semibold tracking-[0.16em] text-text-muted uppercase"
                >
                  {catalog.name}
                </h3>

                <p className="mt-6 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-1 text-text">
                  <span className="text-5xl font-bold tracking-tight text-text sm:text-6xl">
                    {amount}
                  </span>
                  <span className="text-sm text-text-muted sm:text-base">
                    {paid ? `/ ${period}` : "forever"}
                  </span>
                </p>
                <p className="mt-2 text-center text-xs text-text-muted">
                  {paid ? (annual ? "billed yearly" : "billed monthly") : "No subscription."}
                </p>
                <p className="mt-1 min-h-8 text-center text-xs text-pretty text-text-muted">
                  {paid && annual ? plan.savings : ""}
                </p>

                <div className="mt-6 min-w-0 flex-1 space-y-4">
                  {catalog.includesLabel ? (
                    <ul>
                      <li className="flex min-w-0 items-start gap-2.5 text-sm text-text">
                        <CheckIcon />
                        <span className="min-w-0 break-words text-pretty">{catalog.includesLabel}</span>
                      </li>
                    </ul>
                  ) : (
                    <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                      Included
                    </p>
                  )}
                  {catalog.groups.map((group) => (
                    <div key={group.id} className="min-w-0">
                      <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                        {group.heading}
                      </p>
                      <ul className="mt-2 space-y-2">
                        {group.items.map((feature) => (
                          <li
                            key={feature}
                            className="flex min-w-0 items-start gap-2.5 text-sm text-text"
                          >
                            <CheckIcon />
                            <span className="min-w-0 break-words text-pretty">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  {paid ? (
                    subscribeHref ? (
                      <ButtonLink
                        href={subscribeHref}
                        variant={plan.featured ? "primary" : "outline"}
                        className="w-full motion-reduce:transform-none"
                      >
                        Subscribe in the iOS app
                      </ButtonLink>
                    ) : (
                      <Button
                        variant={plan.featured ? "primary" : "outline"}
                        className="w-full motion-reduce:transform-none"
                        onClick={onSubscribeIntent}
                      >
                        Subscribe in the iOS app
                      </Button>
                    )
                  ) : freeCta ? (
                    <ButtonLink href={freeCta.href} variant="outline" className="w-full">
                      {freeCta.label}
                    </ButtonLink>
                  ) : (
                    <p className="flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-center text-sm font-semibold text-text-muted">
                      Your current plan
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-pretty text-center text-xs text-text-muted">
          {`Display prices: Plus ${PLUS_DISPLAY_PRICES.monthlyLabel} or ${PLUS_DISPLAY_PRICES.yearlyLabel} (about ${PLUS_DISPLAY_PRICES.yearlyMonthlyEquivalentLabel}). Home ${HOME_DISPLAY_PRICES.monthlyLabel} or ${HOME_DISPLAY_PRICES.yearlyLabel} (about ${HOME_DISPLAY_PRICES.yearlyMonthlyEquivalentLabel}). The App Store shows the localised button price. There is no web checkout. ${PLUS_UNLIMITED_FAIR_USE_COPY}`}
        </p>
      </div>
    </section>
  );
}
