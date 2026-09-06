import { createClient } from "@/lib/supabase/client";
import { normalizeScannedQuote } from "@bookmarked/utils/quoteScanner";

export async function scanQuoteImage(imageBase64: string, mimeType?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke<{ text?: string; error?: string }>(
    "quote-scanner",
    { body: { imageBase64, mimeType } }
  );
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { text: normalizeScannedQuote(data?.text ?? "") };
}
