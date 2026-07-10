"use client";

import { useRef, useState } from "react";
import { importGoodreadsCsv, type ImportSummary } from "@/lib/services/goodreadsImport";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";

type Props = {
  userId: string;
  onImportComplete?: () => void;
  embedded?: boolean;
};

export function LibraryImportPanel({ userId, onImportComplete, embedded = false }: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a Goodreads CSV export.");
      return;
    }

    setImporting(true);
    setSummary(null);

    try {
      const text = await file.text();
      const result = await importGoodreadsCsv(userId, text);
      setSummary(result);
      onImportComplete?.();

      if (result.errors > 0 || result.skipped > 0) {
        toast.error(
          `Import finished with ${result.imported} new, ${result.updated} updated, ${result.skipped} skipped, ${result.errors} errors.`
        );
      } else {
        toast.success(
          `Imported ${result.imported} books${result.updated ? `, updated ${result.updated}` : ""}.`
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      className={cn(
        embedded
          ? "border-b border-border pb-6 last:border-0 last:pb-0"
          : "rounded-xl border border-border bg-surface p-6 shadow-sm"
      )}
    >
      <h2 className="text-lg font-semibold text-puce-red">Import library</h2>
      <p className="mt-1 text-sm text-text-muted">
        Upload your Goodreads export CSV to add books to your shelves. We match titles via Open
        Library and preserve your shelf, dates, and ratings when available.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          id="goodreads-csv-import"
          onChange={(e) => void handleFileChange(e)}
          disabled={importing}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={importing}
          onClick={() => fileRef.current?.click()}
        >
          {importing ? "Importing…" : "Choose Goodreads CSV"}
        </Button>
        <a
          href="https://www.goodreads.com/review/import"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary hover:underline"
        >
          Export from Goodreads
        </a>
      </div>

      <p className="mt-3 text-xs text-text-muted">
        MVP supports Goodreads CSV only. Up to 200 rows per import. Books without a catalog
        match are skipped.
      </p>

      {summary ? (
        <div className="mt-5 rounded-lg border border-border bg-background/50 p-4">
          <p className="font-medium text-puce-red">Import summary</p>
          <ul className="mt-2 grid gap-1 text-sm text-text-muted sm:grid-cols-2">
            <li>{summary.total} rows processed</li>
            <li>{summary.imported} imported</li>
            <li>{summary.updated} updated</li>
            <li>{summary.skipped} skipped</li>
            <li>{summary.errors} errors</li>
          </ul>
          {summary.results.some((r) => r.status === "skipped" || r.status === "error") ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-primary">
                View details
              </summary>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-text-muted">
                {summary.results
                  .filter((r) => r.status === "skipped" || r.status === "error")
                  .slice(0, 30)
                  .map((r, i) => (
                    <li key={`${r.title}-${i}`}>
                      <span className="font-medium text-text">{r.title}</span>
                      {r.message ? ` — ${r.message}` : ""}
                    </li>
                  ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </Wrapper>
  );
}
