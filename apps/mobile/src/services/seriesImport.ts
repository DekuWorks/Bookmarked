import { supabase } from "./supabase";

export type SeriesImportRow = {
  seriesName: string;
  bookTitle: string;
  author: string;
  position: number | null;
  entryType: "main" | "novella" | "prequel" | "companion" | "short_story" | "other";
  bookId: string | null;
  status: "ready" | "duplicate_entry" | "book_not_found" | "invalid";
  message?: string;
};

export type SeriesImportSummary = {
  imported: number;
  skipped: number;
  errors: number;
  details: SeriesImportRow[];
};

const ENTRY_TYPES = new Set<SeriesImportRow["entryType"]>([
  "main", "novella", "prequel", "companion", "short_story", "other",
]);

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i += 1; } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      fields.push(current.trim()); current = "";
    } else current += char;
  }
  fields.push(current.trim());
  return fields;
}

export function parseSeriesCsv(csv: string): SeriesImportRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const header = parseCsvLine(lines[0]).map((value) => value.toLowerCase().replace(/\s+/g, "_"));
  const required = ["series_name", "book_title", "author", "position", "entry_type"];
  if (required.some((column) => !header.includes(column))) {
    throw new Error("CSV needs: series_name, book_title, author, position, entry_type.");
  }
  return lines.slice(1, 201).map((line) => {
    const values = parseCsvLine(line);
    const get = (column: string) => values[header.indexOf(column)]?.trim() ?? "";
    const seriesName = get("series_name");
    const bookTitle = get("book_title");
    const author = get("author");
    const rawPosition = get("position");
    const position = rawPosition ? Number(rawPosition) : null;
    const rawType = get("entry_type").toLowerCase().replace(/[\s-]+/g, "_");
    const entryType = (ENTRY_TYPES.has(rawType as SeriesImportRow["entryType"]) ? rawType : "other") as SeriesImportRow["entryType"];
    const invalid = !seriesName || !bookTitle || !author || !rawPosition || !Number.isFinite(position);
    return { seriesName, bookTitle, author, position, entryType, bookId: null, status: invalid ? "invalid" : "ready", message: invalid ? "Series name, book title, author, and a numeric position are required." : undefined };
  });
}

export async function previewSeriesImport(csv: string): Promise<SeriesImportRow[]> {
  const rows = parseSeriesCsv(csv);
  await Promise.all(rows.map(async (row) => {
    if (row.status !== "ready") return;
    const { data: books, error } = await supabase.from("books").select("id").ilike("title", row.bookTitle).ilike("author", row.author).limit(2);
    if (error) { row.status = "invalid"; row.message = error.message; return; }
    if (!books?.length) { row.status = "book_not_found"; row.message = "No catalog book matches this title and author."; return; }
    row.bookId = books[0].id;
    const { data: series } = await supabase.from("book_series").select("id").ilike("name", row.seriesName).maybeSingle();
    if (!series) return;
    const { data: entry } = await supabase.from("book_series_entries").select("id").eq("series_id", series.id).eq("book_id", row.bookId).maybeSingle();
    if (entry) { row.status = "duplicate_entry"; row.message = "This book is already in the existing series."; }
  }));
  return rows;
}

export async function importSeriesRows(userId: string, rows: SeriesImportRow[]): Promise<SeriesImportSummary> {
  const details = rows.map((row) => ({ ...row }));
  let imported = 0;
  let errors = 0;
  const seriesIds = new Map<string, string>();
  for (const row of details) {
    if (row.status !== "ready" || !row.bookId) continue;
    const key = row.seriesName.toLocaleLowerCase();
    let seriesId = seriesIds.get(key);
    if (!seriesId) {
      const { data: existing, error: findError } = await supabase.from("book_series").select("id").ilike("name", row.seriesName).maybeSingle();
      if (findError) { row.status = "invalid"; row.message = findError.message; errors += 1; continue; }
      if (existing) seriesId = existing.id;
      else {
        const { data: created, error: createError } = await supabase.from("book_series").insert({ name: row.seriesName, created_by: userId }).select("id").single();
        if (createError || !created) { row.status = "invalid"; row.message = createError?.message ?? "Couldn't create series."; errors += 1; continue; }
        seriesId = created.id;
      }
      seriesIds.set(key, seriesId!);
    }
    const { error } = await supabase.from("book_series_entries").insert({ series_id: seriesId, book_id: row.bookId, position: row.position, entry_type: row.entryType });
    if (error) { row.status = "duplicate_entry"; row.message = error.message; errors += 1; } else imported += 1;
  }
  return { imported, skipped: details.filter((row) => row.status !== "ready").length, errors, details };
}
