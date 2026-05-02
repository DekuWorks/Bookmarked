const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const env = {
  supabaseUrl: url ?? "",
  supabaseAnonKey: anon ?? "",
};

export function assertSupabaseEnv(): void {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and add your Supabase project values."
    );
  }
}
