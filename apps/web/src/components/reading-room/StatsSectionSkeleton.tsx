import { Skeleton } from "@/components/ui/Skeleton";

/** Accessible placeholder for a Stats section that is still fetching. */
export function StatsSectionSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3" role="status" aria-busy="true" aria-live="polite">
      <p className="sr-only">{label}</p>
      <div className="grid grid-cols-7 gap-1" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <Skeleton key={index} className="h-10 rounded-md" />
        ))}
      </div>
    </div>
  );
}
