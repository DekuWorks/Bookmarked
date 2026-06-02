import type { OpenLibraryDoc } from "@/types";

const SEARCH_URL = "https://openlibrary.org/search.json";

export type OpenLibrarySearchResult = {
  docs: OpenLibraryDoc[];
  numFound: number;
};

export async function searchOpenLibrary(
  query: string,
  limit = 12
): Promise<OpenLibrarySearchResult> {
  const params = new URLSearchParams({
    q: query.trim(),
    limit: String(limit),
    fields: "key,title,author_name,cover_i,first_publish_year,isbn,number_of_pages_median",
  });

  const res = await fetch(`${SEARCH_URL}?${params}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error("Could not search Open Library. Try again.");
  }

  const json = (await res.json()) as OpenLibrarySearchResult;
  return {
    docs: json.docs ?? [],
    numFound: json.numFound ?? 0,
  };
}

export function openLibraryCoverUrl(coverId?: number): string | null {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

export function openLibraryWorkId(key?: string): string | null {
  if (!key) return null;
  return key.replace("/works/", "").replace("/books/", "");
}
