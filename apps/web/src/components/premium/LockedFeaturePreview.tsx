"use client";

import { UpgradePrompt } from "@/components/premium/UpgradePrompt";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
  blurPreview?: boolean;
};

/** Shows a dimmed preview of premium content with a soft upgrade CTA. */
export function LockedFeaturePreview({
  title,
  description,
  children,
  className,
  blurPreview = true,
}: Props) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {children ? (
        <div
          className={cn(
            "pointer-events-none select-none opacity-50",
            blurPreview && "blur-[2px]"
          )}
          aria-hidden
        >
          {children}
        </div>
      ) : null}
      <div className={cn(children ? "absolute inset-0 flex items-end p-3 sm:p-4" : undefined)}>
        <UpgradePrompt title={title} description={description} compact className="w-full shadow-sm" />
      </div>
    </div>
  );
}
