/**
 * Goodreads library export CSV parser and import service.
 * Supports the standard Goodreads export format (Book Id, Title, Author, ISBN, etc.).
 */

import { createClient } from "@/lib/supabase/client";
import { completeReadingSession } from "@/lib/services/completeReadingSession";
import {
  catalogExternalId,
  ISBNDB_SOURCE,
  searchIsbndb,
  type CatalogDoc,
} from "@/lib/services/isbndb";
import type { ShelfStatus } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type GoodreadsRow = {
  bookId: string;
  title: string;
  author: string | null;
  isbn: string | null;
  isbn13: string | null;
  exclusiveShelf: ShelfStatus | null;
  dateRead: string | null;
  dateAdded: string | null;
  myRating: number | null;
  numberOfPages: number | null;
};

export type ImportRowResult = {
  title: string;
  status: "imported" | "updated" | "skipped" | "error";
  message?: string;
  /** Present for successful rows, used to safely undo newly-created shelves. */
  userBookId?: string;
  bookId?: string;
  createdUserBook?: boolean;
};

export type ImportSummary = {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  results: ImportRowResult[];
};

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function mapExclusiveShelf(value: string): ShelfStatus | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "read") return "read";
  if (normalized === "currently-reading") return "currently_reading";
  if (normalized === "to-read") return "want_to_read";
  return null;
}

function parseGoodreadsDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function normalizeIsbn(value: string | null): string | null {
  const digits = (value ?? "").replace(/[^0-9Xx]/g, "");
  return digits.length >= 10 ? digits : null;
}

export function parseGoodreadsCsv(text: string): GoodreadsRow[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const indexOf = (name: string) => headers.indexOf(name.toLowerCase());

  const titleIdx = indexOf("title");
  if (titleIdx < 0) return [];

  const rows: GoodreadsRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const title = fields[titleIdx]?.trim();
    if (!title) continue;

    const exclusiveRaw = fields[indexOf("exclusive shelf")] ?? "";
    const shelf = mapExclusiveShelf(exclusiveRaw);

    rows.push({
      bookId: fields[indexOf("book id")]?.trim() ?? String(i),
      title,
      author: fields[indexOf("author")]?.trim() || null,
      isbn: normalizeIsbn(fields[indexOf("isbn")] ?? null),
      isbn13: normalizeIsbn(fields[indexOf("isbn13")] ?? null),
      exclusiveShelf: shelf,
      dateRead: parseGoodreadsDate(fields[indexOf("date read")] ?? ""),
      dateAdded: parseGoodreadsDate(fields[indexOf("date added")] ?? ""),
      myRating: Number(fields[indexOf("my rating")] ?? 0) || null,
      numberOfPages: Number(fields[indexOf("number of pages")] ?? 0) || null,
    });
  }

  return rows;
}

async function findCatalogMatch(row: GoodreadsRow): Promise<CatalogDoc | null> {
  const isbn = row.isbn13 ?? row.isbn;
  const query = isbn ? isbn : [row.title, row.author].filter(Boolean).join(" ");
  if (!query.trim()) return null;

  const result = await searchIsbndb(query, { limit: 5 });
  const docs = result.docs ?? [];

  if (isbn) {
    const isbnMatch = docs.find((doc) =>
      (doc.isbn ?? []).some((value) => normalizeIsbn(value) === isbn)
    );
    if (isbnMatch) return isbnMatch;
  }

  const titleLower = row.title.toLowerCase();
  const authorLower = row.author?.toLowerCase() ?? "";

  const titleMatch = docs.find((doc) => {
    const docTitle = (doc.title ?? "").toLowerCase();
    const docAuthor = (doc.author_name?.[0] ?? "").toLowerCase();
    const titleHit = docTitle.includes(titleLower) || titleLower.includes(docTitle);
    const authorHit = !authorLower || !docAuthor || docAuthor.includes(authorLower);
    return titleHit && authorHit;
  });

  return titleMatch ?? docs[0] ?? null;
}

async function upsertImportedBook(
  supabase: SupabaseClient,
  userId: string,
  row: GoodreadsRow,
  doc: CatalogDoc
): Promise<ImportRowResult> {
  const externalId = catalogExternalId(doc.key);
  if (!externalId) {
    return { title: row.title, status: "error", message: "Invalid catalog id" };
  }

  const coverUrl = doc.cover_url ?? null;
  const isbn = row.isbn13 ?? row.isbn ?? externalId;

  const { data: existingByIsbn } = isbn
    ? await supabase.from("books").select("id").eq("isbn", isbn).maybeSingle()
    : { data: null };

  const { data: existingByExternal } = !existingByIsbn
    ? await supabase
        .from("books")
        .select("id")
        .eq("external_source", ISBNDB_SOURCE)
        .eq("external_id", externalId)
        .maybeSingle()
    : { data: null };

  let bookId = existingByIsbn?.id ?? existingByExternal?.id;

  if (!bookId) {
    const { data: inserted, error } = await supabase
      .from("books")
      .insert({
        external_source: ISBNDB_SOURCE,
        external_id: externalId,
        title: doc.title ?? row.title,
        author: doc.author_name?.[0] ?? row.author,
        cover_url: coverUrl,
        isbn,
        page_count: row.numberOfPages ?? doc.number_of_pages_median ?? null,
        published_date: doc.first_publish_year ? String(doc.first_publish_year) : null,
        description: doc.synopsis ?? doc.first_sentence?.[0] ?? null,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return { title: row.title, status: "error", message: error?.message ?? "Could not create book" };
    }
    bookId = inserted.id;
  } else {
    const pagePatch: Record<string, unknown> = {
      cover_url: coverUrl,
      external_source: ISBNDB_SOURCE,
      external_id: externalId,
    };
    if (row.numberOfPages && row.numberOfPages > 0) {
      pagePatch.page_count = row.numberOfPages;
    }
    await supabase.from("books").update(pagePatch).eq("id", bookId);
  }

  const { data: bookRow } = await supabase
    .from("books")
    .select("id, title, page_count, cover_url, subjects, isbn")
    .eq("id", bookId)
    .maybeSingle();

  const shelfStatus: ShelfStatus = row.exclusiveShelf ?? "want_to_read";

  const { data: existingUserBook } = await supabase
    .from("user_books")
    .select(
      "id, shelf_status, progress_pages, read_count, started_at, is_favorite, rating, completion_tags"
    )
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();

  const now = new Date().toISOString();
  const previousShelf = existingUserBook?.shelf_status ?? null;
  const resolvedPageCount =
    bookRow?.page_count ?? row.numberOfPages ?? doc.number_of_pages_median ?? null;

  if (shelfStatus === "read" && previousShelf !== "read") {
    // Goodreads exports often omit Date Read. Never invent a completion date
    // from the import time (or Date Added), because that corrupts goals and
    // reading statistics. The preview asks the reader to resolve these rows.
    if (!row.dateRead) {
      return {
        title: row.title,
        status: "skipped",
        message: "Missing completion date — choose a date before importing this finished book",
      };
    }
    const finishedAt = row.dateRead;
    const startedAt = row.dateAdded ?? existingUserBook?.started_at ?? finishedAt;

    const { data: userBook, error: shelfError } = await supabase
      .from("user_books")
      .upsert(
        {
          user_id: userId,
          book_id: bookId,
          updated_at: now,
          started_at: startedAt,
          ...(row.myRating && row.myRating >= 1 && row.myRating <= 5
            ? { rating: row.myRating }
            : {}),
        },
        { onConflict: "user_id,book_id" }
      )
      .select("id, started_at, read_count, is_favorite, rating, completion_tags")
      .single();

    if (shelfError) {
      return { title: row.title, status: "error", message: shelfError.message };
    }

    const completion = await completeReadingSession({
      supabase,
      userId,
      bookId,
      userBookId: userBook.id,
      bookTitle: bookRow?.title ?? row.title,
      book: {
        id: bookId,
        page_count: resolvedPageCount,
        cover_url: bookRow?.cover_url ?? coverUrl,
        subjects: bookRow?.subjects ?? null,
        isbn: bookRow?.isbn ?? isbn,
      },
      editionSelected: Boolean(bookRow?.isbn ?? isbn),
      previousPage: Number(existingUserBook?.progress_pages) || 0,
      readNumber: Number(existingUserBook?.read_count) || 1,
      finishedAt,
      startedAt: userBook.started_at ?? startedAt,
      manualPageCount: row.numberOfPages,
      source: "library",
      applyCompletionTags: Boolean(existingUserBook),
      completionTagsState: existingUserBook
        ? {
            read_count: userBook.read_count ?? existingUserBook.read_count,
            is_favorite: userBook.is_favorite ?? existingUserBook.is_favorite,
            rating: userBook.rating ?? existingUserBook.rating,
            completion_tags: userBook.completion_tags ?? existingUserBook.completion_tags,
          }
        : undefined,
    });

    if (completion.error) {
      return { title: row.title, status: "error", message: completion.error };
    }

    return {
      title: row.title,
      status: existingUserBook ? "updated" : "imported",
      userBookId: userBook.id,
      bookId,
      createdUserBook: !existingUserBook,
    };
  }

  const payload: Record<string, unknown> = {
    user_id: userId,
    book_id: bookId,
    shelf_status: shelfStatus,
    updated_at: now,
  };

  if (row.dateAdded && shelfStatus !== "read") {
    payload.started_at = row.dateAdded;
  }
  if (shelfStatus === "currently_reading" && !row.dateAdded) {
    payload.started_at = now;
  }
  if (row.myRating && row.myRating >= 1 && row.myRating <= 5) {
    payload.rating = row.myRating;
  }

  const { data: savedUserBook, error: shelfError } = await supabase
    .from("user_books")
    .upsert(payload, { onConflict: "user_id,book_id" })
    .select("id")
    .single();

  if (shelfError) {
    return { title: row.title, status: "error", message: shelfError.message };
  }

  return {
    title: row.title,
    status: existingUserBook ? "updated" : "imported",
    userBookId: savedUserBook?.id,
    bookId,
    createdUserBook: !existingUserBook,
  };
}

export type GoodreadsImportUndoSnapshot = {
  userId: string;
  createdAt: string;
  /** Only user_books created by the import are safe to delete. */
  createdUserBookIds: string[];
  bookIds: string[];
};

export async function undoGoodreadsImport(
  userId: string,
  snapshot: GoodreadsImportUndoSnapshot
): Promise<{ deleted: number; error?: string }> {
  if (snapshot.userId !== userId || snapshot.createdUserBookIds.length === 0) {
    return { deleted: 0 };
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_books")
    .delete()
    .eq("user_id", userId)
    .in("id", snapshot.createdUserBookIds)
    .select("id");
  return error ? { deleted: 0, error: error.message } : { deleted: data?.length ?? 0 };
}

export async function importGoodreadsCsv(
  userId: string,
  csvText: string,
  options?: { maxRows?: number }
): Promise<ImportSummary> {
  const rows = parseGoodreadsCsv(csvText).slice(0, options?.maxRows ?? 200);
  const supabase = createClient();

  const summary: ImportSummary = {
    total: rows.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    results: [],
  };

  for (const row of rows) {
    try {
      const doc = await findCatalogMatch(row);
      if (!doc) {
        summary.skipped += 1;
        summary.results.push({
          title: row.title,
          status: "skipped",
          message: "No catalog match found",
        });
        continue;
      }

      const result = await upsertImportedBook(supabase, userId, row, doc);
      summary.results.push(result);

      if (result.status === "imported") summary.imported += 1;
      else if (result.status === "updated") summary.updated += 1;
      else if (result.status === "skipped") summary.skipped += 1;
      else summary.errors += 1;
    } catch (error) {
      summary.errors += 1;
      summary.results.push({
        title: row.title,
        status: "error",
        message: error instanceof Error ? error.message : "Import failed",
      });
    }
  }

  return summary;
}
