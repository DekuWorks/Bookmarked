"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  importSeriesRows,
  previewSeriesImport,
  type SeriesImportRow,
  type SeriesImportSummary,
} from "@/lib/services/seriesImport";

export function SeriesImportPanel({ userId }: { userId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [rows, setRows] = useState<SeriesImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<SeriesImportSummary | null>(null);

  async function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setSummary(null);
      setRows(await previewSeriesImport(await file.text()));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read the CSV.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function confirmImport() {
    setImporting(true);
    try {
      const result = await importSeriesRows(userId, rows);
      setSummary(result);
      setRows([]);
      toast.success(`Imported ${result.imported} series entr${result.imported === 1 ? "y" : "ies"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Series import failed.");
    } finally {
      setImporting(false);
    }
  }

  const ready = rows.filter((row) => row.status === "ready");
  const skipped = rows.length - ready.length;

  return (
    <section>
      <h2 className="text-lg font-semibold text-puce-red">Import series spreadsheet</h2>
      <p className="mt-1 text-sm text-text-muted">
        Upload CSV columns: <code>series_name, book_title, author, position, entry_type</code>. We link exact title-and-author catalog matches and skip duplicate entries.
      </p>
      <input ref={fileRef} id="series-csv-import" type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => void pickFile(event)} disabled={importing} />
      <div className="mt-4">
        <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
          Choose series CSV
        </Button>
      </div>
      {rows.length ? (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="font-medium text-puce-red">Import preview</p>
          <p className="mt-1 text-sm text-text-muted">{ready.length} ready · {skipped} skipped or needs attention</p>
          <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-xs text-text-muted">
            {rows.slice(0, 30).map((row, index) => (
              <li key={`${row.seriesName}-${row.bookTitle}-${index}`}>
                <span className="font-medium text-text">{row.seriesName}</span> — {row.bookTitle} ({row.entryType})
                {row.message ? ` · ${row.message}` : ""}
              </li>
            ))}
          </ul>
          <Button className="mt-3" type="button" size="sm" loading={importing} disabled={!ready.length} onClick={() => void confirmImport()}>
            Confirm {ready.length} entry{ready.length === 1 ? "" : "ies"}
          </Button>
        </div>
      ) : null}
      {summary ? <p className="mt-4 text-sm text-text-muted">{summary.imported} imported · {summary.skipped} skipped · {summary.errors} errors</p> : null}
    </section>
  );
}
