"use client";

import { useSearchParams } from "next/navigation";
import { BackNav } from "@/components/ui/BackNav";
import { originBackHref, parseNavOrigin, resolveOriginBack } from "@bookmarked/utils/navigationOrigin";

type Props = {
  fallbackLabel: string;
  fallbackHref: string;
  className?: string;
  /**
   * Always use the resolved in-app href.
   * Shelf screens pass this so a deep link cannot history.back() out of Bookmarked.
   */
  explicit?: boolean;
};

export function OriginBackNav({ fallbackLabel, fallbackHref, className, explicit = false }: Props) {
  const searchParams = useSearchParams();
  const origin = parseNavOrigin(searchParams.get("origin"));
  const query = searchParams.get("q");
  const scroll = searchParams.get("scroll");
  const target = resolveOriginBack(origin);
  const href = originBackHref(origin, "web", { query, scroll }) ?? fallbackHref;

  return (
    <BackNav
      label={target?.label.toLowerCase() ?? fallbackLabel}
      fallbackHref={href}
      href={origin || explicit ? href : undefined}
      className={className}
    />
  );
}
