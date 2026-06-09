const SUPABASE_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export type SupabaseEnvKey = (typeof SUPABASE_ENV_KEYS)[number];

export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

export type EnvValidationResult =
  | { ok: true; env: SupabaseEnv }
  | { ok: false; missing: SupabaseEnvKey[] };

function readEnv(key: SupabaseEnvKey): string {
  return process.env[key]?.trim() ?? "";
}

export function getSupabaseEnv(): EnvValidationResult {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const missing: SupabaseEnvKey[] = [];

  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return { ok: true, env: { url, anonKey } };
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
