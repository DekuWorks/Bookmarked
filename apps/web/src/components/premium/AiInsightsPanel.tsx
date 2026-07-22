"use client";

type Props = {
  className?: string;
};

export function AiInsightsPanel({ className }: Props) {
  return (
    <div className={className}>
      <div className="rounded-xl border border-dashed border-border bg-background/70 px-4 py-6 text-center">
        <p className="font-medium text-puce-red">AI insights are on the way</p>
        <p className="mt-2 text-sm text-text-muted">
          You have Premium access. Personalized reflections and reading patterns will appear here
          once AI insights launch.
        </p>
      </div>
    </div>
  );
}
