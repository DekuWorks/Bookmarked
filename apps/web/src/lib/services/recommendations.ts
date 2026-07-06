import { getUserLibraryBooks, type LibraryBookRow } from "@/lib/services/library";
import { searchOpenLibrary } from "@/lib/services/openLibrary";
import { openLibraryCoverUrl, openLibraryWorkId } from "@/lib/services/openLibrary";
import type { OpenLibraryDoc } from "@/types";

export type BecauseYouReadRecommendation = {
  title: string;
  author: string | null;
  externalId: string;
  coverUrl: string | null;
  reason: string;
  sourceTitle: string;
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function topSubjectsFromLibrary(books: LibraryBookRow[], limit = 5): string[] {
  const counts = new Map<string, number>();

  for (const row of books) {
    for (const subject of row.books?.subjects ?? []) {
      const key = subject.trim();
      if (!key || key.length < 3) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([subject]) => subject);
}

function seedBooks(books: LibraryBookRow[]): LibraryBookRow[] {
  const read = books.filter((b) => b.shelf_status === "read");
  const reading = books.filter((b) => b.shelf_status === "currently_reading");
  const favorites = books.filter((b) => b.is_favorite);
  return [...favorites, ...reading, ...read].slice(0, 8);
}

function docToRecommendation(
  doc: OpenLibraryDoc,
  reason: string,
  sourceTitle: string
): BecauseYouReadRecommendation | null {
  const externalId = openLibraryWorkId(doc.key);
  if (!externalId || !doc.title?.trim()) return null;

  return {
    title: doc.title.trim(),
    author: doc.author_name?.[0]?.trim() ?? null,
    externalId,
    coverUrl: openLibraryCoverUrl(doc.cover_i),
    reason,
    sourceTitle,
  };
}

export async function getBecauseYouReadRecommendations(
  userId: string,
  profileGenres?: string[] | null,
  limit = 8
): Promise<BecauseYouReadRecommendation[]> {
  const books = await getUserLibraryBooks(userId);
  if (!books.length) return [];

  const ownedExternalIds = new Set(
    books
      .map((b) => b.books?.external_id)
      .filter((id): id is string => Boolean(id))
  );
  const ownedTitles = new Set(
    books.map((b) => normalizeToken(b.books?.title ?? "")).filter(Boolean)
  );

  const seeds = seedBooks(books);
  const subjects = topSubjectsFromLibrary(books);
  const genres = (profileGenres ?? []).map((g) => g.trim()).filter(Boolean);

  const queries: { query: string; reason: string; sourceTitle: string }[] = [];

  for (const seed of seeds.slice(0, 3)) {
    const title = seed.books?.title?.trim();
    if (!title) continue;
    const subject = seed.books?.subjects?.[0];
    if (subject) {
      queries.push({
        query: subject,
        reason: `Because you read ${title}`,
        sourceTitle: title,
      });
    }
  }

  for (const genre of genres.slice(0, 2)) {
    queries.push({
      query: genre,
      reason: `From your favorite genre: ${genre}`,
      sourceTitle: genre,
    });
  }

  for (const subject of subjects.slice(0, 3)) {
    queries.push({
      query: subject,
      reason: `Popular in your library: ${subject}`,
      sourceTitle: subject,
    });
  }

  const results: BecauseYouReadRecommendation[] = [];
  const seen = new Set<string>();

  for (const { query, reason, sourceTitle } of queries) {
    if (results.length >= limit) break;

    try {
      const { docs } = await searchOpenLibrary(query, { limit: 6 });
      for (const doc of docs) {
        const externalId = openLibraryWorkId(doc.key);
        if (!externalId || seen.has(externalId)) continue;
        if (ownedExternalIds.has(externalId)) continue;

        const titleKey = normalizeToken(doc.title ?? "");
        if (titleKey && ownedTitles.has(titleKey)) continue;

        const rec = docToRecommendation(doc, reason, sourceTitle);
        if (!rec) continue;

        seen.add(externalId);
        results.push(rec);
        if (results.length >= limit) break;
      }
    } catch {
      // Skip failed Open Library query
    }
  }

  return results;
}
