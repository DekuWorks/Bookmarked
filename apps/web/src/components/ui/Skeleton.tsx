import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function FeedCardSkeleton() {
  return (
    <div className="surface-card flex gap-4 p-5 sm:gap-5 sm:p-6">
      <Skeleton className="h-24 w-16 shrink-0 rounded-md" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="surface-card space-y-4 p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}
