import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_HOME_ELIGIBILITY_FLAGS,
  parseHomeEligibilityFlags,
  type HomeEligibilityFlags,
} from "@bookmarked/utils/homeEligibility";

export async function loadHomeEligibilityFlags(): Promise<HomeEligibilityFlags> {
  const supabase = createClient();
  const { data, error } = await supabase.from("feature_flags").select("key, value");
  if (error || !data) return DEFAULT_HOME_ELIGIBILITY_FLAGS;
  return parseHomeEligibilityFlags(data);
}
