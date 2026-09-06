import { supabase } from "./supabase";
import { normalizeScannedQuote } from "../../../../packages/utils/quoteScanner";

export async function scanQuoteImage(imageBase64: string, mimeType?: string) {
  const { data, error } = await supabase.functions.invoke<{ text?: string; error?: string }>(
    "quote-scanner",
    { body: { imageBase64, mimeType } }
  );
  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  return { text: normalizeScannedQuote(data?.text ?? "") };
}
