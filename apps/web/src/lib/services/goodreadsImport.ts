/**
 * Goodreads library export CSV parser and import service.
 * Supports the standard Goodreads export format (Book Id, Title, Author, ISBN, etc.).
 */

import { createClient } from "@/lib/supabase/client";
import { searchOpenLibrary, openLibraryWorkId, openLibraryCoverUrl } from "@/lib/services/openLibrary";
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

async function findOpenLibraryMatch(row: GoodreadsRow) {
  const isbn = row.isbn13 ?? row.isbn;
  const query = isbn ? isbn : [row.title, row.author].filter(Boolean).join(" ");
  if (!query.trim()) return null;

  const result = await searchOpenLibrary(query, { limit: 5 });
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
  doc: NonNullable<Awaited<ReturnType<typeof findOpenLibraryMatch>>>
): Promise<ImportRowResult> {
  const externalId = openLibraryWorkId(doc.key);
  if (!externalId) {
    return { title: row.title, status: "error", message: "Invalid Open Library work id" };
  }

  const coverId = doc.cover_i;
  const coverUrl = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
    : null;

  const { data: existingBook } = await supabase
    .from("books")
    .select("id")
    .eq("external_source", "open_library")
    .eq("external_id", externalId)
    .maybeSingle();

  let bookId = existingBook?.id;

  if (!bookId) {
    const { data: inserted, error } = await supabase
      .from("books")
      .insert({
        external_source: "open_library",
        external_id: externalId,
        title: doc.title ?? row.title,
        author: doc.author_name?.[0] ?? row.author,
        cover_url: coverUrl,
        isbn: row.isbn13 ?? row.isbn,
        page_count: row.numberOfPages ?? doc.number_of_pages_median ?? null,
        published_date: doc.first_publish_year ? String(doc.first_publish_year) : null,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return { title: row.title, status: "error", message: error?.message ?? "Could not create book" };
    }
    bookId = inserted.id;
  }

  const shelfStatus: ShelfStatus = row.exclusiveShelf ?? "want_to_read";

  const { data: existingUserBook } = await supabase
    .from("user_books")
    .select("id, shelf_status")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();

  const now = new Date().toISOString();
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
  if (shelfStatus === "read") {
    payload.finished_at = row.dateRead ?? row.dateAdded ?? now;
    payload.progress_percent = 100;
  }
  if (row.myRating && row.myRating >= 1 && row.myRating <= 5) {
    payload.rating = row.myRating;
  }

  const { error: shelfError } = await supabase
    .from("user_books")
    .upsert(payload, { onConflict: "user_id,book_id" });

  if (shelfError) {
    return { title: row.title, status: "error", message: shelfError.message };
  }

  return {
    title: row.title,
    status: existingUserBook ? "updated" : "imported",
  };
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
      const doc = await findOpenLibraryMatch(row);
      if (!doc) {
        summary.skipped += 1;
        summary.results.push({
          title: row.title,
          status: "skipped",
          message: "No Open Library match found",
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
