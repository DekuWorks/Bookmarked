import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { env, assertSupabaseEnv } from "../constants/env";
import { createRememberMeStorage } from "./rememberMe";

assertSupabaseEnv();

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: createRememberMeStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
