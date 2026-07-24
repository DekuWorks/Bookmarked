import Link from "next/link";
import { PREMIUM_FEATURE_LINKS } from "@bookmarked/utils/premiumFeatures";

type Props = {
  className?: string;
};

export function PremiumFeatureList({ className }: Props) {
  return (
    <ul className={className ?? "mt-6 space-y-3"}>
      {PREMIUM_FEATURE_LINKS.map((feature) => (
        <li
          key={feature.id}
          className="rounded-xl border border-border bg-background/60 px-4 py-3 text-left transition-shadow hover:shadow-sm"
        >
          {feature.webHref ? (
            <Link
              href={feature.webHref}
              className="font-semibold text-puce-red underline-offset-2 hover:underline"
            >
              {feature.title}
            </Link>
          ) : (
            <p className="font-semibold text-puce-red">{feature.title}</p>
          )}
          <p className="mt-1 text-sm leading-relaxed text-text-muted">{feature.description}</p>
        </li>
      ))}
    </ul>
  );
}
