/**
 * Use static process.env.* references so Next.js inlines values at build time.
 * Dynamic access (process.env[key]) is NOT replaced in static exports.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export type SupabaseEnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export type EnvValidationResult =
  | { ok: true; env: SupabaseEnv }
  | { ok: false; missing: SupabaseEnvKey[] };

export function getSupabaseEnv(): EnvValidationResult {
  const missing: SupabaseEnvKey[] = [];

  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return { ok: true, env: { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY } };
}

export function formatMissingEnvError(missing: SupabaseEnvKey[]): string {
  if (missing.length === 1) {
    return `Missing ${missing[0]}. Add it to apps/web/.env.local for local dev and as a GitHub Actions secret for production builds.`;
  }
  return `Missing ${missing.join(" and ")}. Add them to apps/web/.env.local for local dev and as GitHub Actions secrets for production builds.`;
}

export function assertSupabaseEnv(): SupabaseEnv {
  const result = getSupabaseEnv();
  if (!result.ok) {
    const message = formatMissingEnvError(result.missing);
    if (typeof window !== "undefined") {
      console.error(`[Bookmarked] ${message}`);
      result.missing.forEach((key) => console.error(`[Bookmarked] Missing ${key}`));
    }
    throw new Error(message);
  }
  return result.env;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv().ok;
}
