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

export type OpenLibraryWorkDetails = {
  description: string | null;
  subjects: string[];
  published_date: string | null;
  publisher: string | null;
  page_count: number | null;
};

function normalizeWorkPath(externalId: string): string {
  if (externalId.startsWith("/works/") || externalId.startsWith("/books/")) {
    return externalId;
  }
  return `/works/${externalId}`;
}

function parseOpenLibraryDescription(
  value: string | { value?: string } | undefined
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.value ?? null;
}

export async function fetchOpenLibraryWorkDetails(
  externalId: string
): Promise<OpenLibraryWorkDetails | null> {
  const path = normalizeWorkPath(externalId);
  const res = await fetch(`https://openlibrary.org${path}.json`, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    description?: string | { value?: string };
    subjects?: string[];
    subject_places?: string[];
    first_publish_date?: string;
    publishers?: string[];
    number_of_pages?: number;
  };

  const subjects = [
    ...(data.subjects ?? []),
    ...(data.subject_places ?? []),
  ].slice(0, 12);

  return {
    description: parseOpenLibraryDescription(data.description),
    subjects,
    published_date: data.first_publish_date ?? null,
    publisher: data.publishers?.[0] ?? null,
    page_count: data.number_of_pages ?? null,
  };
}
