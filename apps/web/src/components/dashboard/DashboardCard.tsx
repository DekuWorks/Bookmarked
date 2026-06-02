import { cn } from "@/lib/utils/cn";
import { type ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function DashboardCard({ title, children, className, action }: Props) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-surface p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-puce-red">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
