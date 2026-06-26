import { openLibraryCoverUrl } from "@/lib/services/openLibrary";

export type CoverInput = {
  coverUrl?: string | null;
  coverId?: number | string | null;
  isbn?: string | null;
  title?: string;
  author?: string | null;
};

export type GoogleBooksVolume = {
  coverUrl: string | null;
  description: string | null;
  pageCount: number | null;
  publisher: string | null;
  publishedDate: string | null;
};

export function openLibraryIsbnCoverUrl(isbn: string): string | null {
  const clean = isbn.replace(/[-\s]/g, "");
  if (!clean) return null;
  return `https://covers.openlibrary.org/b/isbn/${clean}-M.jpg`;
}

/** Sync resolution for display (Open Library cover id + ISBN). */
export function resolveDisplayCoverUrl(input: CoverInput): string | null {
  if (input.coverUrl?.trim()) return input.coverUrl.trim();

  const coverId = input.coverId ? Number(input.coverId) : NaN;
  if (Number.isFinite(coverId) && coverId > 0) {
    return openLibraryCoverUrl(coverId);
  }

  if (input.isbn?.trim()) {
    return openLibraryIsbnCoverUrl(input.isbn);
  }

  return null;
}

function buildGoogleBooksQuery(input: Pick<CoverInput, "isbn" | "title" | "author">): string | null {
  if (input.isbn?.trim()) {
    return `isbn:${input.isbn.replace(/[-\s]/g, "")}`;
  }
  if (input.title?.trim()) {
    let q = `intitle:${input.title.trim()}`;
    if (input.author?.trim()) q += ` inauthor:${input.author.trim()}`;
    return q;
  }
  return null;
}

export async function fetchGoogleBooksVolume(
  input: Pick<CoverInput, "isbn" | "title" | "author">
): Promise<GoogleBooksVolume | null> {
  const q = buildGoogleBooksQuery(input);
  if (!q) return null;

  const params = new URLSearchParams({ q, maxResults: "1" });

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;

    const json = (await res.json()) as {
      items?: Array<{
        volumeInfo?: {
          description?: string;
          pageCount?: number;
          publisher?: string;
          publishedDate?: string;
          imageLinks?: { thumbnail?: string; smallThumbnail?: string };
        };
      }>;
    };

    const info = json.items?.[0]?.volumeInfo;
    if (!info) return null;

    const rawCover =
      info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null;

    return {
      coverUrl: rawCover
        ? rawCover.replace(/^http:/, "https:").replace(/zoom=\d+/, "zoom=1")
        : null,
      description: info.description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null,
      pageCount: info.pageCount ?? null,
      publisher: info.publisher ?? null,
      publishedDate: info.publishedDate ?? null,
    };
  } catch {
    return null;
  }
}

/** Best-effort cover URL: stored → Open Library → Google Books. */
export async function resolveBookCoverUrl(input: CoverInput): Promise<string | null> {
  const immediate = resolveDisplayCoverUrl(input);
  if (immediate) return immediate;

  const google = await fetchGoogleBooksVolume({
    isbn: input.isbn,
    title: input.title,
    author: input.author,
  });

  return google?.coverUrl ?? null;
}
