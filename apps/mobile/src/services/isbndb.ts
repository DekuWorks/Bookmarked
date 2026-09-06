import { supabase } from "./supabase";
import { env } from "../constants/env";

/**
 * ISBNdb catalog client for mobile. All requests go through the shared
 * Supabase Edge Function `/functions/v1/isbndb` (supabase/functions/isbndb),
 * so the ISBNdb API key stays server-side — same proxy the web app uses.
 */

export const ISBNDB_SOURCE = "isbndb" as const;

export type CatalogDoc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_url?: string | null;
  first_publish_year?: number;
  isbn?: string[];
  number_of_pages_median?: number;
  synopsis?: string | null;
};

type IsbndbBook = {
  title?: string;
  title_long?: string;
  isbn?: string;
  isbn13?: string;
  isbn10?: string;
  publisher?: string;
  date_published?: string;
  pages?: number;
  image?: string;
  image_original?: string;
  synopsis?: string;
  authors?: string[];
};

type IsbndbBooksResponse = { books?: IsbndbBook[]; total?: number };
type IsbndbBookResponse = { book?: IsbndbBook };

function normalizeIsbn(raw: string): string {
  return raw.replace(/[-\s]/g, "").trim();
}

export function catalogExternalId(isbn: string | null | undefined): string | null {
  const clean = normalizeIsbn(isbn ?? "");
  return clean || null;
}

function isIsbnQuery(query: string): boolean {
  const clean = normalizeIsbn(query);
  return /^\d{9}[\dXx]$/.test(clean) || /^\d{13}$/.test(clean);
}

function stripHtml(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function coverUrl(book: IsbndbBook): string | null {
  return book.image?.trim() || book.image_original?.trim() || null;
}

function yearFromDate(value: string | null | undefined): number | undefined {
  const match = value?.match(/(\d{4})/);
  if (!match) return undefined;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : undefined;
}

function bookToDoc(book: IsbndbBook): CatalogDoc | null {
  const isbn = normalizeIsbn(book.isbn13 ?? book.isbn ?? book.isbn10 ?? "");
  if (!isbn || !book.title?.trim()) return null;
  return {
    key: isbn,
    title: book.title.trim(),
    author_name: book.authors?.filter(Boolean),
    cover_url: coverUrl(book),
    first_publish_year: yearFromDate(book.date_published),
    isbn: [isbn],
    number_of_pages_median: book.pages ?? undefined,
    synopsis: stripHtml(book.synopsis),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function isbndbFetch<T>(
  path: string,
  query: Record<string, string | number | undefined> = {},
  signal?: AbortSignal
): Promise<T> {
  const base = env.supabaseUrl.trim();
  const anon = env.supabaseAnonKey.trim();
  if (!base || !anon) throw new Error("Supabase is not configured.");

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const params = new URLSearchParams();
  params.set("path", path.replace(/^\/+/, ""));
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
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
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new Error("Could not reach the book catalog. Check your connection.");
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

export async function searchIsbndb(
  query: string,
  limit = 20,
  signal?: AbortSignal
): Promise<CatalogDoc[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (isIsbnQuery(trimmed)) {
    const isbn = normalizeIsbn(trimmed);
    try {
      const json = await isbndbFetch<IsbndbBookResponse>(
        `book/${encodeURIComponent(isbn)}`,
        {},
        signal
      );
      const doc = json.book ? bookToDoc(json.book) : null;
      return doc ? [doc] : [];
    } catch (error) {
      if (isAbortError(error)) throw error;
      // fall through to text search
    }
  }

  const json = await isbndbFetch<IsbndbBooksResponse>(
    `books/${encodeURIComponent(trimmed)}`,
    { page: 1, pageSize: limit },
    signal
  );

  const seen = new Set<string>();
  const docs: CatalogDoc[] = [];
  for (const book of json.books ?? []) {
    const doc = bookToDoc(book);
    if (!doc || seen.has(doc.key)) continue;
    seen.add(doc.key);
    docs.push(doc);
  }
  return docs;
}
