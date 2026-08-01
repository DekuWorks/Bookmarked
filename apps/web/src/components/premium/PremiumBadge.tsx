import { PlusBadge } from "@/components/premium/PlusBadge";
import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
  compact?: boolean;
};

/** @deprecated Prefer `PlusBadge`. */
export function PremiumBadge({ className, compact }: Props) {
  return <PlusBadge className={cn(className)} compact={compact} label="Plus" />;
}
