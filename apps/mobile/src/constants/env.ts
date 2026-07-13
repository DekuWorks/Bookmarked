const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const giphy = process.env.EXPO_PUBLIC_GIPHY_API_KEY;

export const env = {
  supabaseUrl: url ?? "",
  supabaseAnonKey: anon ?? "",
  /** Public Giphy client key (safe to ship; used for GIF search). */
  giphyApiKey: giphy ?? "",
};

export function assertSupabaseEnv(): void {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and add your Supabase project values."
    );
  }
}
