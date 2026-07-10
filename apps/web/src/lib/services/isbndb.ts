/**
 * ISBNdb catalog client.
 * All requests go through the Supabase Edge Function `/functions/v1/isbndb`
 * so the API key never ships to the browser (static GitHub Pages export).
 */

import { createClient } from "@/lib/supabase/client";
import { formatIsbnForSearch, isIsbnQuery, normalizeIsbnInput } from "@/lib/utils/isbn";
import { EDITION_PAGE_SIZE, SEARCH_PAGE_SIZE } from "@/lib/constants/searchFilters";

export const ISBNDB_SOURCE = "isbndb" as const;

/** Catalog search hit — shape used by search UI / recommendations / import. */
export type CatalogDoc = {
  key: string;
  title: string;
  author_name?: string[];
  /** ISBNdb cover URL (image). */
  cover_url?: string | null;
  first_publish_year?: number;
  isbn?: string[];
  number_of_pages_median?: number;
  first_sentence?: string[];
  subject?: string[];
  publisher?: string[];
  language?: string[];
  synopsis?: string | null;
};

export type CatalogSearchResult = {
  docs: CatalogDoc[];
  numFound: number;
};

export type CatalogSearchOptions = {
  limit?: number;
  offset?: number;
  language?: string;
  yearFrom?: number;
  yearTo?: number;
  sort?: string;
  author?: string;
};

export type CatalogEditionSummary = {
  editionKey: string;
  title: string;
  isbn: string | null;
  publisher: string | null;
  publishDate: string | null;
  pageCount: number | null;
  coverUrl: string | null;
};

export type CatalogEditionsResult = {
  editions: CatalogEditionSummary[];
  total: number;
};

export type CatalogWorkDetails = {
  description: string | null;
  subjects: string[];
  published_date: string | null;
  publisher: string | null;
  page_count: number | null;
  cover_url: string | null;
  title?: string | null;
  author?: string | null;
  isbn?: string | null;
};

type IsbndbBook = {
  title?: string;
  title_long?: string;
  isbn?: string;
  isbn13?: string;
  isbn10?: string;
  publisher?: string;
  language?: string;
  date_published?: string;
  edition?: string;
  pages?: number;
  image?: string;
  image_original?: string;
  synopsis?: string;
  authors?: string[];
  subjects?: string[];
  other_isbns?: Array<{ isbn?: string; binding?: string }>;
};

type IsbndbBooksResponse = {
  books?: IsbndbBook[];
  total?: number;
  page?: number;
  page_size?: number;
};

type IsbndbAuthorResponse = {
  author?: string;
  name?: string;
  books?: IsbndbBook[];
  total?: number;
  page?: number;
  page_size?: number;
};

type IsbndbBookResponse = {
  book?: IsbndbBook;
};

function stripHtml(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || null;
}

/** Prefer ISBNdb `image`, fall back to `image_original`. */
export function isbndbCoverUrl(book: Pick<IsbndbBook, "image" | "image_original"> | null | undefined): string | null {
  const image = book?.image?.trim();
  if (image) return image;
  const original = book?.image_original?.trim();
  return original || null;
}

export function catalogExternalId(isbn: string | null | undefined): string | null {
  const clean = normalizeIsbnInput(isbn ?? "") ?? isbn?.replace(/[-\s]/g, "").trim() ?? "";
  return clean || null;
}

function yearFromDate(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.match(/(\d{4})/);
  if (!match) return undefined;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : undefined;
}

function mapLanguageCode(code: string | undefined): string | undefined {
  if (!code) return undefined;
  const map: Record<string, string> = {
    eng: "en",
    spa: "es",
    fre: "fr",
    ger: "de",
    ita: "it",
    por: "pt",
    jpn: "ja",
    kor: "ko",
    chi: "zh",
  };
  return map[code] ?? code;
}

function bookToDoc(book: IsbndbBook): CatalogDoc | null {
  const isbn = catalogExternalId(book.isbn13 ?? book.isbn ?? book.isbn10);
  if (!isbn || !book.title?.trim()) return null;

  const synopsis = stripHtml(book.synopsis);

  return {
    key: isbn,
    title: book.title.trim(),
    author_name: book.authors?.filter(Boolean),
    cover_url: isbndbCoverUrl(book),
    first_publish_year: yearFromDate(book.date_published),
    isbn: [isbn, book.isbn10, book.isbn13].filter(
      (value, index, arr): value is string => Boolean(value) && arr.indexOf(value) === index
    ),
    number_of_pages_median: book.pages ?? undefined,
    first_sentence: synopsis ? [synopsis.slice(0, 280)] : undefined,
    subject: book.subjects?.slice(0, 12),
    publisher: book.publisher ? [book.publisher] : undefined,
    language: book.language ? [book.language] : undefined,
    synopsis,
  };
}

function bookToEdition(book: IsbndbBook): CatalogEditionSummary | null {
  const isbn = catalogExternalId(book.isbn13 ?? book.isbn ?? book.isbn10);
  if (!isbn) return null;

  return {
    editionKey: isbn,
    title: book.title?.trim() || book.title_long?.trim() || "Untitled",
    isbn,
    publisher: book.publisher ?? null,
    publishDate: book.date_published ?? null,
    pageCount: book.pages ?? null,
    coverUrl: isbndbCoverUrl(book),
  };
}

function bookToDetails(book: IsbndbBook): CatalogWorkDetails {
  return {
    description: stripHtml(book.synopsis),
    subjects: (book.subjects ?? []).slice(0, 12),
    published_date: book.date_published ?? null,
    publisher: book.publisher ?? null,
    page_count: book.pages ?? null,
    cover_url: isbndbCoverUrl(book),
    title: book.title?.trim() ?? null,
    author: book.authors?.[0]?.trim() ?? null,
    isbn: catalogExternalId(book.isbn13 ?? book.isbn ?? book.isbn10),
  };
}

async function isbndbFetch<T>(
  path: string,
  query: Record<string, string | number | undefined> = {}
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const params = new URLSearchParams();
  params.set("path", path.replace(/^\/+/, ""));
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!base || !anon) {
    throw new Error("Supabase is not configured.");
  }

  const url = `${base.replace(/\/$/, "")}/functions/v1/isbndb?${params.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.access_token ?? anon}`,
        apikey: anon,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new Error("Could not reach the book catalog. Check your connection and try again.");
  }

  if (!res.ok) {
    let message = "Could not search the book catalog. Try again.";
    try {
      const payload = (await res.json()) as { error?: string; message?: string };
      message = payload.error ?? payload.message ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

function offsetToPage(offset: number, pageSize: number): number {
  return Math.floor(Math.max(0, offset) / pageSize) + 1;
}

function applyClientFilters(
  docs: CatalogDoc[],
  options: CatalogSearchOptions
): CatalogDoc[] {
  let next = docs;

  const language = mapLanguageCode(options.language);
  if (language) {
    next = next.filter((doc) => {
      const langs = (doc.language ?? []).map((l) => l.toLowerCase());
      return langs.length === 0 || langs.some((l) => l === language || l.startsWith(language));
    });
  }

  if (options.yearFrom != null) {
    next = next.filter(
      (doc) => doc.first_publish_year == null || doc.first_publish_year >= options.yearFrom!
    );
  }
  if (options.yearTo != null) {
    next = next.filter(
      (doc) => doc.first_publish_year == null || doc.first_publish_year <= options.yearTo!
    );
  }

  if (options.sort === "new") {
    next = [...next].sort(
      (a, b) => (b.first_publish_year ?? 0) - (a.first_publish_year ?? 0)
    );
  } else if (options.sort === "old") {
    next = [...next].sort(
      (a, b) => (a.first_publish_year ?? 9999) - (b.first_publish_year ?? 9999)
    );
  }

  return next;
}

function dedupeDocs(docs: CatalogDoc[]): CatalogDoc[] {
  const seen = new Set<string>();
  const out: CatalogDoc[] = [];
  for (const doc of docs) {
    const id = catalogExternalId(doc.key) ?? doc.key;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(doc);
  }
  return out;
}

export async function searchIsbndb(
  query: string,
  options: CatalogSearchOptions = {}
): Promise<CatalogSearchResult> {
  const limit = options.limit ?? SEARCH_PAGE_SIZE;
  const offset = options.offset ?? 0;
  const page = offsetToPage(offset, limit);

  const rawQuery = isIsbnQuery(query)
    ? (normalizeIsbnInput(query) ?? formatIsbnForSearch(query).replace(/^isbn:/, ""))
    : query.trim();

  if (!rawQuery) {
    return { docs: [], numFound: 0 };
  }

  // ISBN exact lookup
  if (isIsbnQuery(query) || /^\d{9}[\dXx]$|^\d{13}$/.test(rawQuery.replace(/[-\s]/g, ""))) {
    const isbn = normalizeIsbnInput(rawQuery) ?? rawQuery.replace(/[-\s]/g, "");
    try {
      const json = await isbndbFetch<IsbndbBookResponse>(`book/${encodeURIComponent(isbn)}`);
      const doc = json.book ? bookToDoc(json.book) : null;
      return { docs: doc ? [doc] : [], numFound: doc ? 1 : 0 };
    } catch {
      // Fall through to text search
    }
  }

  const params: Record<string, string | number | undefined> = {
    page,
    pageSize: limit,
  };
  if (options.author?.trim()) {
    params.author = options.author.trim();
  }

  const year =
    options.yearFrom != null && options.yearTo != null && options.yearFrom === options.yearTo
      ? options.yearFrom
      : options.yearFrom ?? options.yearTo;
  if (year != null) {
    params.year = year;
  }

  const language = mapLanguageCode(options.language);
  if (language) {
    params.language = language;
  }

  const json = await isbndbFetch<IsbndbBooksResponse>(
    `books/${encodeURIComponent(rawQuery)}`,
    params
  );

  const mapped = (json.books ?? [])
    .map(bookToDoc)
    .filter((doc): doc is CatalogDoc => doc !== null);

  const docs = applyClientFilters(dedupeDocs(mapped), {
    ...options,
    // Year already applied when yearFrom===yearTo via API; still filter ranges client-side
    language: undefined,
  });

  return {
    docs,
    numFound: json.total ?? docs.length,
  };
}

export async function searchIsbndbByAuthor(
  authorName: string,
  options: CatalogSearchOptions = {}
): Promise<CatalogSearchResult> {
  const trimmed = authorName.trim();
  if (!trimmed) return { docs: [], numFound: 0 };

  const limit = options.limit ?? SEARCH_PAGE_SIZE;
  const offset = options.offset ?? 0;
  const page = offsetToPage(offset, limit);

  try {
    const json = await isbndbFetch<IsbndbAuthorResponse>(
      `author/${encodeURIComponent(trimmed)}`,
      { page, pageSize: limit }
    );

    const mapped = (json.books ?? [])
      .map(bookToDoc)
      .filter((doc): doc is CatalogDoc => doc !== null);

    const docs = applyClientFilters(dedupeDocs(mapped), options);

    return {
      docs,
      numFound: json.total ?? docs.length,
    };
  } catch {
    // Fallback: books search with author filter
    return searchIsbndb(trimmed, { ...options, author: trimmed });
  }
}

export type FetchEditionsOptions = {
  limit?: number;
  offset?: number;
};

/**
 * Edition list for a title. `workId` is an ISBN (our external_id for ISBNdb).
 * We fetch the book, then search related editions by title+author.
 */
export async function fetchCatalogEditions(
  workId: string,
  options: FetchEditionsOptions = {}
): Promise<CatalogEditionsResult> {
  const limit = options.limit ?? EDITION_PAGE_SIZE;
  const offset = options.offset ?? 0;
  const page = offsetToPage(offset, limit);

  const details = await fetchIsbndbBookDetails(workId);
  const title = details?.title?.trim();
  if (!title) {
    return { editions: [], total: 0 };
  }

  const author = details?.author?.trim();
  const params: Record<string, string | number | undefined> = {
    page,
    pageSize: limit,
  };
  if (author) params.author = author;

  const json = await isbndbFetch<IsbndbBooksResponse>(
    `books/${encodeURIComponent(title)}`,
    params
  );

  const editions = (json.books ?? [])
    .map(bookToEdition)
    .filter((edition): edition is CatalogEditionSummary => edition !== null);

  // Ensure the selected ISBN appears first when present
  const preferred = catalogExternalId(workId);
  editions.sort((a, b) => {
    if (a.isbn === preferred) return -1;
    if (b.isbn === preferred) return 1;
    return 0;
  });

  return {
    editions,
    total: json.total ?? editions.length,
  };
}

export async function fetchIsbndbBookDetails(
  externalId: string
): Promise<CatalogWorkDetails | null> {
  const isbn = catalogExternalId(externalId) ?? externalId.trim();
  if (!isbn) return null;

  try {
    const json = await isbndbFetch<IsbndbBookResponse>(`book/${encodeURIComponent(isbn)}`);
    if (!json.book) return null;
    return bookToDetails(json.book);
  } catch {
    return null;
  }
}

/** @deprecated alias — prefer catalogExternalId */
export function isbndbWorkId(key?: string): string | null {
  return catalogExternalId(key);
}
