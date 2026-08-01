import { PlusBadge } from "./PlusBadge";

type Props = {
  compact?: boolean;
};

/** @deprecated Prefer `PlusBadge`. */
export function PremiumBadge({ compact }: Props) {
  return <PlusBadge compact={compact} label="Plus" />;
}
