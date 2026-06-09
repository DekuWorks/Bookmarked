"use client";

import { formatMissingEnvError, getSupabaseEnv } from "@/lib/env";

export function SupabaseConfigError() {
  const result = getSupabaseEnv();
  if (result.ok) return null;

  return (
    <div
      role="alert"
      className="border-b border-rust/30 bg-rust/10 px-4 py-3 text-center text-sm text-rust"
    >
      <p className="font-semibold">Configuration error</p>
      <p className="mt-1">{formatMissingEnvError(result.missing)}</p>
      <ul className="mt-2 list-inside list-disc text-left text-xs sm:text-center">
        {result.missing.map((key) => (
          <li key={key}>Missing {key}</li>
        ))}
      </ul>
    </div>
  );
}
