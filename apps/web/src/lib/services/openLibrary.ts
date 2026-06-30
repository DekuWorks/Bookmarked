import type { OpenLibraryDoc } from "@/types";
import { formatIsbnForSearch, isIsbnQuery } from "@/lib/utils/isbn";
import { EDITION_PAGE_SIZE, SEARCH_PAGE_SIZE } from "@/lib/constants/searchFilters";

const SEARCH_URL = "https://openlibrary.org/search.json";

export type OpenLibrarySearchResult = {
  docs: OpenLibraryDoc[];
  numFound: number;
};

export type OpenLibrarySearchOptions = {
  limit?: number;
  offset?: number;
  language?: string;
  yearFrom?: number;
  yearTo?: number;
  sort?: string;
};

function buildSearchQuery(rawQuery: string, options: OpenLibrarySearchOptions): string {
  let q = isIsbnQuery(rawQuery) ? formatIsbnForSearch(rawQuery) : rawQuery.trim();

  if (options.yearFrom != null && options.yearTo != null) {
    q += ` first_publish_year:[${options.yearFrom} TO ${options.yearTo}]`;
  } else if (options.yearFrom != null) {
    q += ` first_publish_year:[${options.yearFrom} TO *]`;
  } else if (options.yearTo != null) {
    q += ` first_publish_year:[* TO ${options.yearTo}]`;
  }

  return q.trim();
}

/** Search Open Library for works by a specific author name. */
export async function searchOpenLibraryByAuthor(
  authorName: string,
  options: OpenLibrarySearchOptions = {}
): Promise<OpenLibrarySearchResult> {
  const trimmed = authorName.trim();
  if (!trimmed) {
    return { docs: [], numFound: 0 };
  }

  const limit = options.limit ?? SEARCH_PAGE_SIZE;
  const offset = options.offset ?? 0;

  const params = new URLSearchParams({
    author: trimmed,
    limit: String(limit),
    offset: String(offset),
    fields:
      "key,title,author_name,cover_i,first_publish_year,isbn,number_of_pages_median,first_sentence,subject,publisher,language",
  });

  if (options.language) {
    params.set("language", options.language);
  }

  if (options.yearFrom != null && options.yearTo != null) {
    params.set(
      "q",
      `first_publish_year:[${options.yearFrom} TO ${options.yearTo}]`
    );
  } else if (options.yearFrom != null) {
    params.set("q", `first_publish_year:[${options.yearFrom} TO *]`);
  } else if (options.yearTo != null) {
    params.set("q", `first_publish_year:[* TO ${options.yearTo}]`);
  }

  if (options.sort) {
    params.set("sort", options.sort);
  }

  const res = await fetch(`${SEARCH_URL}?${params}`);

  if (!res.ok) {
    throw new Error("Could not load books for this author. Try again.");
  }

  const json = (await res.json()) as OpenLibrarySearchResult;
  return {
    docs: json.docs ?? [],
    numFound: json.numFound ?? 0,
  };
}

export async function searchOpenLibrary(
  query: string,
  options: OpenLibrarySearchOptions = {}
): Promise<OpenLibrarySearchResult> {
  const limit = options.limit ?? SEARCH_PAGE_SIZE;
  const offset = options.offset ?? 0;
  const q = buildSearchQuery(query, options);

  const params = new URLSearchParams({
    q,
    limit: String(limit),
    offset: String(offset),
    fields:
      "key,title,author_name,cover_i,first_publish_year,isbn,number_of_pages_median,first_sentence,subject,publisher,language",
  });

  if (options.language) {
    params.set("language", options.language);
  }

  if (options.sort) {
    params.set("sort", options.sort);
  }

  const res = await fetch(`${SEARCH_URL}?${params}`);

  if (!res.ok) {
    throw new Error("Could not search Open Library. Try again.");
  }

  const json = (await res.json()) as OpenLibrarySearchResult;
  return {
    docs: json.docs ?? [],
    numFound: json.numFound ?? 0,
  };
}

export type OpenLibraryEditionSummary = {
  editionKey: string;
  title: string;
  isbn: string | null;
  publisher: string | null;
  publishDate: string | null;
  pageCount: number | null;
  coverId: number | null;
};

type OpenLibraryEditionListEntry = {
  key?: string;
  title?: string;
  full_title?: string;
  isbn_10?: string[];
  isbn_13?: string[];
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  covers?: number[];
};

export type FetchWorkEditionsOptions = {
  limit?: number;
  offset?: number;
};

export type OpenLibraryEditionsResult = {
  editions: OpenLibraryEditionSummary[];
  total: number;
};

function parseEditionListEntry(entry: OpenLibraryEditionListEntry): OpenLibraryEditionSummary | null {
  if (!entry.key) return null;

  const isbn = entry.isbn_13?.[0] ?? entry.isbn_10?.[0] ?? null;

  return {
    editionKey: entry.key,
    title: entry.title ?? entry.full_title ?? "Untitled",
    isbn,
    publisher: entry.publishers?.[0] ?? null,
    publishDate: entry.publish_date ?? null,
    pageCount: entry.number_of_pages ?? null,
    coverId: entry.covers?.[0] ?? null,
  };
}

export async function fetchWorkEditions(
  workId: string,
  options: FetchWorkEditionsOptions = {}
): Promise<OpenLibraryEditionsResult> {
  const limit = options.limit ?? EDITION_PAGE_SIZE;
  const offset = options.offset ?? 0;
  const workPath = workId.startsWith("/works/") ? workId : `/works/${workId}`;
  const list = await fetchOpenLibraryJson<{
    size?: number;
    entries?: OpenLibraryEditionListEntry[];
  }>(`${workPath}/editions.json?limit=${limit}&offset=${offset}`);

  const entries = list?.entries ?? [];
  const editions = entries
    .map(parseEditionListEntry)
    .filter((edition): edition is OpenLibraryEditionSummary => edition !== null);

  return {
    editions,
    total: list?.size ?? editions.length,
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
  const trimmed = externalId.trim();
  if (trimmed.startsWith("/works/") || trimmed.startsWith("/books/")) {
    return trimmed;
  }
  return `/works/${trimmed}`;
}

async function fetchOpenLibraryJson<T>(path: string): Promise<T | null> {
  const res = await fetch(`https://openlibrary.org${path}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

function parseOpenLibraryDescription(
  value: string | { value?: string } | undefined
): string | null {
  if (!value) return null;
  const raw = typeof value === "string" ? value : (value.value ?? null);
  if (!raw) return null;
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null;
}

async function resolveWorkPath(externalId: string): Promise<string | null> {
  let path = normalizeWorkPath(externalId);

  if (path.startsWith("/works/")) {
    return path;
  }

  const edition = await fetchOpenLibraryJson<{ works?: { key?: string }[] }>(`${path}.json`);
  const workKey = edition?.works?.[0]?.key;
  if (workKey) return workKey;

  if (path.startsWith("/books/")) {
    return null;
  }

  return `/works/${externalId.replace(/^\/works\//, "")}`;
}

async function fetchEditionFallbackDetails(
  workPath: string
): Promise<Partial<OpenLibraryWorkDetails>> {
  const list = await fetchOpenLibraryJson<{
    entries?: Array<{ key?: string }>;
  }>(`${workPath}/editions.json?limit=3`);

  for (const entry of list?.entries ?? []) {
    if (!entry.key) continue;

    const edition = await fetchOpenLibraryJson<{
      description?: string | { value?: string };
      number_of_pages?: number;
      publishers?: string[];
      publish_date?: string;
    }>(`${entry.key}.json`);

    if (!edition) continue;

    const description = parseOpenLibraryDescription(edition.description);
    if (description || edition.number_of_pages || edition.publishers?.length) {
      return {
        description: description ?? null,
        subjects: [],
        published_date: edition.publish_date ?? null,
        publisher: edition.publishers?.[0] ?? null,
        page_count: edition.number_of_pages ?? null,
      };
    }
  }

  return {};
}

export async function fetchOpenLibraryWorkDetails(
  externalId: string
): Promise<OpenLibraryWorkDetails | null> {
  const workPath = await resolveWorkPath(externalId);
  if (!workPath) return null;

  const data = await fetchOpenLibraryJson<{
    description?: string | { value?: string };
    subjects?: string[];
    subject_places?: string[];
    first_publish_date?: string;
    publishers?: string[];
    number_of_pages?: number;
  }>(`${workPath}.json`);

  if (!data) return null;

  let description = parseOpenLibraryDescription(data.description);

  if (!description) {
    const descPayload = await fetchOpenLibraryJson<string | { value?: string }>(
      `${workPath}/description.json`
    );
    description = parseOpenLibraryDescription(descPayload ?? undefined);
  }

  const subjects = [...(data.subjects ?? []), ...(data.subject_places ?? [])].slice(0, 12);

  let published_date = data.first_publish_date ?? null;
  let publisher = data.publishers?.[0] ?? null;
  let page_count = data.number_of_pages ?? null;

  if (!description || !page_count || !publisher) {
    const editionFallback = await fetchEditionFallbackDetails(workPath);
    if (!description && editionFallback.description) {
      description = editionFallback.description;
    }
    if (!published_date && editionFallback.published_date) {
      published_date = editionFallback.published_date;
    }
    if (!publisher && editionFallback.publisher) {
      publisher = editionFallback.publisher;
    }
    if (!page_count && editionFallback.page_count) {
      page_count = editionFallback.page_count;
    }
  }

  return {
    description,
    subjects,
    published_date,
    publisher,
    page_count,
  };
}
