import { openLibraryCoverUrl } from "@/lib/services/openLibrary";

export type CoverInput = {
  coverUrl?: string | null;
  coverId?: number | string | null;
  isbn?: string | null;
  title?: string;
  author?: string | null;
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

export async function fetchGoogleBooksCoverUrl(
  input: Pick<CoverInput, "isbn" | "title" | "author">
): Promise<string | null> {
  const params = new URLSearchParams({ maxResults: "1" });

  if (input.isbn?.trim()) {
    params.set("q", `isbn:${input.isbn.replace(/[-\s]/g, "")}`);
  } else if (input.title?.trim()) {
    let q = `intitle:${input.title.trim()}`;
    if (input.author?.trim()) q += ` inauthor:${input.author.trim()}`;
    params.set("q", q);
  } else {
    return null;
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;

    const json = (await res.json()) as {
      items?: Array<{
        volumeInfo?: {
          imageLinks?: { thumbnail?: string; smallThumbnail?: string };
        };
      }>;
    };

    const raw =
      json.items?.[0]?.volumeInfo?.imageLinks?.thumbnail ??
      json.items?.[0]?.volumeInfo?.imageLinks?.smallThumbnail;

    if (!raw) return null;
    return raw.replace(/^http:/, "https:").replace(/zoom=\d+/, "zoom=1");
  } catch {
    return null;
  }
}

/** Best-effort cover URL: stored → Open Library → Google Books. */
export async function resolveBookCoverUrl(input: CoverInput): Promise<string | null> {
  const immediate = resolveDisplayCoverUrl(input);
  if (immediate) return immediate;

  return fetchGoogleBooksCoverUrl({
    isbn: input.isbn,
    title: input.title,
    author: input.author,
  });
}
