import { env } from "../constants/env";

/**
 * Giphy GIF search. Mirror of apps/web/src/lib/services/giphy.ts but reads the
 * public `EXPO_PUBLIC_GIPHY_API_KEY`. Called directly from the client (no proxy),
 * matching web.
 */

export type GiphySearchResult = {
  id: string;
  title: string;
  previewUrl: string;
  imageUrl: string;
};

type GiphyApiGif = {
  id: string;
  title: string;
  images: {
    fixed_height_small?: { url?: string };
    fixed_height?: { url?: string };
    original?: { url?: string };
  };
};

export function isGiphySearchConfigured(): boolean {
  return Boolean(env.giphyApiKey?.trim());
}

function mapGiphyResults(gifs: GiphyApiGif[]): GiphySearchResult[] {
  return gifs
    .map((gif) => ({
      id: gif.id,
      title: gif.title || "GIF",
      previewUrl:
        gif.images.fixed_height_small?.url ??
        gif.images.fixed_height?.url ??
        gif.images.original?.url ??
        "",
      imageUrl: gif.images.original?.url ?? gif.images.fixed_height?.url ?? "",
    }))
    .filter((item) => item.imageUrl);
}

async function fetchGiphyEndpoint(
  path: "search" | "trending",
  params: Record<string, string>
): Promise<GiphySearchResult[]> {
  const apiKey = env.giphyApiKey?.trim();
  if (!apiKey) return [];

  const url = new URL(`https://api.giphy.com/v1/gifs/${path}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("limit", "24");
  url.searchParams.set("rating", "g");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
  } catch {
    throw new Error("Could not reach Giphy. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new Error("GIF search failed.");
  }

  const payload = (await response.json()) as { data?: GiphyApiGif[] };
  return mapGiphyResults(payload.data ?? []);
}

export async function searchGiphy(query: string): Promise<GiphySearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return fetchGiphyEndpoint("search", { q: trimmed });
}

export async function fetchTrendingGiphy(): Promise<GiphySearchResult[]> {
  return fetchGiphyEndpoint("trending", {});
}
