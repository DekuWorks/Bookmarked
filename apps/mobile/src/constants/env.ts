const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const giphy = process.env.EXPO_PUBLIC_GIPHY_API_KEY;
const site =
  process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://bookmarked.online";

export const env = {
  supabaseUrl: url ?? "",
  supabaseAnonKey: anon ?? "",
  /** Public Giphy client key (safe to ship; used for GIF search). */
  giphyApiKey: giphy ?? "",
  /** Web origin used for email confirmation / password-reset redirects. */
  siteUrl: site,
};

export function assertSupabaseEnv(): void {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and add your Supabase project values."
    );
  }
}

export function webAuthRedirect(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withSlash = normalized.endsWith("/") ? normalized : `${normalized}/`;
  return `${env.siteUrl}${withSlash}`;
}
