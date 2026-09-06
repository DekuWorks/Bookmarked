/**
 * Plus Quote Scanner OCR. Photo is processed in memory and not stored.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function subscriptionIsActive(row: {
  subscription_tier: string;
  subscription_status: string;
  subscription_expires_at: string | null;
}): boolean {
  if (!["plus", "home"].includes(row.subscription_tier)) return false;
  const status = row.subscription_status;
  if (status === "expired" || status === "inactive") return false;
  const entitled = ["active", "trialing", "past_due", "grace_period", "canceled"].includes(status);
  if (!entitled) return false;
  if (!row.subscription_expires_at) return status !== "canceled";
  return new Date(row.subscription_expires_at).getTime() > Date.now();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) return jsonResponse({ error: "Server misconfigured" }, 500);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return jsonResponse({ error: "Unauthorized" }, 401);

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("subscription_tier, subscription_status, subscription_expires_at")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!subscription || !subscriptionIsActive(subscription)) {
    return jsonResponse({ error: "Plus required" }, 403);
  }

  let body: { imageBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const image = body.imageBase64?.trim();
  if (!image || image.length > 2_500_000) {
    return jsonResponse({ error: "Image is missing or too large." }, 400);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (!apiKey) return jsonResponse({ error: "Scanner unavailable" }, 503);

  const mime = body.mimeType?.startsWith("image/") ? body.mimeType : "image/jpeg";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-4o-mini",
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content:
              "Extract the visible quote text only. Do not reconstruct a whole book. Return JSON { text, confidence }.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Read the quote in this photo." },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${image}` },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("[quote-scanner] OpenAI error", response.status);
      return jsonResponse({ error: "Could not read that photo." }, 502);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    let text = "";
    if (typeof content === "string") {
      try {
        const parsed = JSON.parse(content) as { text?: string };
        text = typeof parsed.text === "string" ? parsed.text : content;
      } catch {
        text = content;
      }
    }

    return jsonResponse({
      text: String(text).trim(),
      confidence: null,
    });
  } catch (error) {
    console.error("[quote-scanner] failed", error);
    return jsonResponse({ error: "Could not read that photo." }, 502);
  }
});
