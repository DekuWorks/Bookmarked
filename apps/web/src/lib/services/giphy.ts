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
  return Boolean(process.env.NEXT_PUBLIC_GIPHY_API_KEY?.trim());
}

export async function searchGiphy(query: string): Promise<GiphySearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY?.trim();
  if (!apiKey) return [];

  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL("https://api.giphy.com/v1/gifs/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", "12");
  url.searchParams.set("rating", "g");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("GIF search failed.");
  }

  const payload = (await response.json()) as { data?: GiphyApiGif[] };

  return (payload.data ?? [])
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
