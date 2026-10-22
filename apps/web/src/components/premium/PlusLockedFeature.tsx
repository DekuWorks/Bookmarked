import { PlusBadge } from "@/components/premium/PlusBadge";
import { PLUS_WEB_SUBSCRIBE_GUIDANCE } from "@bookmarked/utils/plusLockedCopy";

type Props = {
  title: string;
  description: string;
  headingId: string;
};

/** Locked Plus preview. No checkout and no invented store URL. */
export function PlusLockedFeature({ title, description, headingId }: Props) {
  return (
    <div className="rr-plus-lock rounded-2xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/10 via-surface to-surface p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <PlusBadge />
        <h2 id={headingId} className="font-display text-xl text-puce-red">
          {title}
        </h2>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">{description}</p>
      <p className="mt-3 text-sm leading-relaxed text-puce-red">{PLUS_WEB_SUBSCRIBE_GUIDANCE}</p>
    </div>
  );
}
