import { createClient } from "@/lib/supabase/client";
import {
  bookNeedsCatalogEnrichment,
  enrichBookCatalogEntry,
} from "@/lib/services/bookMetadata";
import type { LibraryBookRow } from "@/lib/services/library";
import type { Book } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_PER_SESSION = 8;
const ENRICHMENT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DELAY_BETWEEN_MS = 400;

const SESSION_KEY = "bookmarked:catalogRefreshSession:v1";
const ENRICHED_AT_KEY = "bookmarked:catalogEnrichedAt:v1";

type SessionState = {
  count: number;
  attemptedIds: string[];
};

function readSessionState(): SessionState {
  if (typeof sessionStorage === "undefined") {
    return { count: 0, attemptedIds: [] };
  }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return { count: 0, attemptedIds: [] };
    const parsed = JSON.parse(raw) as SessionState;
    return {
      count: Number(parsed.count) || 0,
      attemptedIds: Array.isArray(parsed.attemptedIds) ? parsed.attemptedIds : [],
    };
  } catch {
    return { count: 0, attemptedIds: [] };
  }
}

function writeSessionState(state: SessionState): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function readEnrichedAtMap(): Record<string, number> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(ENRICHED_AT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function markBookEnriched(bookId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    const map = readEnrichedAtMap();
    map[bookId] = Date.now();
    localStorage.setItem(ENRICHED_AT_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function wasRecentlyEnriched(bookId: string): boolean {
  const ts = readEnrichedAtMap()[bookId];
  if (!ts) return false;
  return Date.now() - ts < ENRICHMENT_COOLDOWN_MS;
}

function libraryBookToCatalogBook(row: NonNullable<LibraryBookRow["books"]>): Book {
  return {
    id: row.id,
    external_source: row.external_source ?? null,
    external_id: row.external_id ?? null,
    title: row.title,
    author: row.author ?? null,
    description: row.description ?? null,
    cover_url: row.cover_url ?? null,
    page_count: row.page_count ?? null,
    published_date: row.published_date ?? null,
    isbn: row.isbn ?? null,
    publisher: row.publisher ?? null,
    subjects: row.subjects ?? null,
    created_at: "",
  };
}

function catalogPriority(book: Book): number {
  if (!book.cover_url?.trim()) return 0;
  if (!book.description?.trim()) return 1;
  if (!book.page_count) return 2;
  return 3;
}

function pickStaleCatalogBooks(books: LibraryBookRow[]): Book[] {
  const seen = new Set<string>();
  const candidates: Book[] = [];

  for (const row of books) {
    if (!row.books?.id || seen.has(row.books.id)) continue;
    seen.add(row.books.id);

    const book = libraryBookToCatalogBook(row.books);
    if (!bookNeedsCatalogEnrichment(book)) continue;
    if (wasRecentlyEnriched(book.id)) continue;

    candidates.push(book);
  }

  return candidates.sort((a, b) => catalogPriority(a) - catalogPriority(b));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let refreshInFlight: Promise<{ refreshed: number }> | null = null;

/**
 * Background refresh for books missing covers or catalog metadata.
 * Rate-limited per browser session; skips books enriched in the last 24h.
 */
export async function refreshStaleCatalogBooks(
  books: LibraryBookRow[],
  options?: {
    supabase?: SupabaseClient;
    onBookUpdated?: () => void;
  }
): Promise<{ refreshed: number }> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = readSessionState();
    const remaining = MAX_PER_SESSION - session.count;
    if (remaining <= 0) return { refreshed: 0 };

    const candidates = pickStaleCatalogBooks(books).filter(
      (book) => !session.attemptedIds.includes(book.id)
    );
    if (candidates.length === 0) return { refreshed: 0 };

    const batch = candidates.slice(0, remaining);
    const supabase = options?.supabase ?? createClient();
    let refreshed = 0;

    for (const book of batch) {
      session.attemptedIds.push(book.id);
      session.count += 1;
      writeSessionState(session);

      try {
        await enrichBookCatalogEntry(supabase, book);
        markBookEnriched(book.id);
        refreshed += 1;
        options?.onBookUpdated?.();
      } catch (error) {
        console.warn("[staleCatalogRefresh] enrichment failed:", book.id, error);
      }

      if (batch.indexOf(book) < batch.length - 1) {
        await delay(DELAY_BETWEEN_MS);
      }
    }

    return { refreshed };
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}
