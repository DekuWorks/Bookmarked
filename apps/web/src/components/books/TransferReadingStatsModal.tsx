"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BookCover } from "@/components/books/BookCover";
import { useToast } from "@/components/ui/Toast";
import {
  EditionPickerModal,
  type CatalogEditionSummary,
} from "@/components/search/EditionPickerModal";
import { transferReadingStats } from "@/lib/actions/book";
import {
  catalogExternalId,
  searchIsbndb,
  type CatalogDoc,
} from "@/lib/services/isbndb";
import { resolveDisplayCoverUrl } from "@/lib/services/covers";
import { bookDetailsPath } from "@/lib/routes/book";
import { SEARCH_PAGE_SIZE } from "@/lib/constants/searchFilters";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  fromBookId: string;
  fromBookTitle: string;
};

type TransferCandidate = {
  title: string;
  author: string | null;
  external_id: string;
  cover_url: string;
  page_count: string;
  isbn: string;
  first_publish_year: string;
  first_sentence: string;
  edition_key?: string;
  displayCover: string | null;
};

function docToCandidate(doc: CatalogDoc, edition?: CatalogEditionSummary | null): TransferCandidate {
  const externalId = edition?.editionKey ?? catalogExternalId(doc.key) ?? doc.key;
  const isbn = edition?.isbn ?? doc.isbn?.[0] ?? externalId;
  const coverUrl = edition?.coverUrl ?? doc.cover_url ?? "";
  return {
    title: edition?.title ?? doc.title,
    author: doc.author_name?.[0] ?? null,
    external_id: externalId,
    cover_url: coverUrl,
    page_count: edition?.pageCount
      ? String(edition.pageCount)
      : doc.number_of_pages_median
        ? String(doc.number_of_pages_median)
        : "",
    isbn,
    first_publish_year:
      edition?.publishDate?.match(/\d{4}/)?.[0] ??
      (doc.first_publish_year ? String(doc.first_publish_year) : ""),
    first_sentence: doc.first_sentence?.[0] ?? "",
    edition_key: edition?.editionKey,
    displayCover: resolveDisplayCoverUrl({ coverUrl, isbn }),
  };
}

export function TransferReadingStatsModal({
  open,
  onClose,
  fromBookId,
  fromBookTitle,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState(fromBookTitle);
  const [docs, setDocs] = useState<CatalogDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TransferCandidate | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [editionOpen, setEditionOpen] = useState(false);
  const [editionWorkId, setEditionWorkId] = useState("");
  const [editionWorkTitle, setEditionWorkTitle] = useState("");
  const [pendingDoc, setPendingDoc] = useState<CatalogDoc | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery(fromBookTitle);
    setDocs([]);
    setSelected(null);
    setConfirming(false);
    setSearchError(null);
    setTransferring(false);
  }, [open, fromBookTitle]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setDocs([]);
      setSearchError("Enter a title, author, or ISBN.");
      return;
    }

    setLoading(true);
    setSearchError(null);
    try {
      const result = await searchIsbndb(trimmed, { limit: SEARCH_PAGE_SIZE, offset: 0 });
      setDocs(result.docs);
      if (result.docs.length === 0) {
        setSearchError(`No books found for “${trimmed}”.`);
      }
    } catch (e) {
      setDocs([]);
      setSearchError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !fromBookTitle.trim()) return;
    void runSearch(fromBookTitle);
  }, [open, fromBookTitle, runSearch]);

  function pickDoc(doc: CatalogDoc) {
    const externalId = catalogExternalId(doc.key);
    if (!externalId || !doc.title) return;
    setPendingDoc(doc);
    setEditionWorkId(externalId);
    setEditionWorkTitle(doc.title);
    setEditionOpen(true);
  }

  function handleEditionSelect(edition: CatalogEditionSummary) {
    if (!pendingDoc) return;
    setSelected(docToCandidate(pendingDoc, edition));
    setConfirming(true);
    setPendingDoc(null);
  }

  function useSearchHitWithoutEdition(doc: CatalogDoc) {
    const externalId = catalogExternalId(doc.key);
    if (!externalId || !doc.title) return;
    setSelected(docToCandidate(doc));
    setConfirming(true);
  }

  async function confirmTransfer() {
    if (!selected) return;
    setTransferring(true);
    const formData = new FormData();
    formData.set("from_book_id", fromBookId);
    formData.set("title", selected.title);
    formData.set("author", selected.author ?? "");
    formData.set("external_id", selected.external_id);
    formData.set("cover_url", selected.cover_url);
    formData.set("page_count", selected.page_count);
    formData.set("isbn", selected.isbn);
    formData.set("first_publish_year", selected.first_publish_year);
    formData.set("first_sentence", selected.first_sentence);
    if (selected.edition_key) {
      formData.set("edition_key", selected.edition_key);
    }

    try {
      const result = await transferReadingStats({}, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success ?? "Reading stats transferred.");
      onClose();
      if (result.bookId) {
        router.push(bookDetailsPath(result.bookId));
      }
    } finally {
      setTransferring(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Move to another edition"
        className="max-w-lg"
      >
        {!confirming || !selected ? (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Search for the edition you want (with the right cover), then move your
              progress, trail, notes, and reviews onto it. Your current shelf entry for{" "}
              <span className="font-medium text-text">{fromBookTitle}</span> will be
              removed.
            </p>

            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                void runSearch(query);
              }}
            >
              <label className="min-w-0 flex-1 text-left text-sm font-medium text-text">
                Search books
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Title, author, or ISBN"
                  className="mt-1.5 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
              <Button type="submit" variant="secondary" size="sm" loading={loading}>
                Search
              </Button>
            </form>

            {searchError ? (
              <p className="text-sm text-rust" role="alert">
                {searchError}
              </p>
            ) : null}

            {loading && docs.length === 0 ? (
              <p className="text-sm text-text-muted">Searching…</p>
            ) : null}

            {docs.length > 0 ? (
              <ul className="max-h-[45vh] space-y-2 overflow-y-auto" role="listbox">
                {docs.map((doc) => {
                  const externalId = catalogExternalId(doc.key);
                  if (!externalId || !doc.title) return null;
                  const isbn = doc.isbn?.[0] ?? externalId;
                  const coverUrl = resolveDisplayCoverUrl({
                    coverUrl: doc.cover_url,
                    isbn,
                  });
                  const author = doc.author_name?.[0] ?? null;

                  return (
                    <li key={`${doc.key}-${isbn}`}>
                      <div
                        className={cn(
                          "flex gap-3 rounded-lg border border-border bg-background p-3",
                          "hover:border-primary"
                        )}
                      >
                        <BookCover
                          title={doc.title}
                          author={author}
                          coverUrl={coverUrl}
                          className="w-14 shrink-0"
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="font-medium text-text">{doc.title}</p>
                          {author ? (
                            <p className="text-xs text-text-muted">{author}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-text-muted">
                            {[
                              doc.first_publish_year,
                              doc.number_of_pages_median
                                ? `${doc.number_of_pages_median} pp`
                                : null,
                              coverUrl ? "Cover available" : "No cover",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => pickDoc(doc)}
                            >
                              Pick edition
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => useSearchHitWithoutEdition(doc)}
                            >
                              Use this result
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              Transfer reading stats from{" "}
              <span className="font-medium text-text">{fromBookTitle}</span> to this
              edition? The source shelf entry will be removed after the transfer.
            </p>

            <div className="flex gap-3 rounded-lg border border-border bg-background p-3">
              <BookCover
                title={selected.title}
                author={selected.author}
                coverUrl={selected.displayCover}
                className="w-16 shrink-0"
              />
              <div className="min-w-0 text-left">
                <p className="font-medium text-text">{selected.title}</p>
                {selected.author ? (
                  <p className="text-sm text-text-muted">{selected.author}</p>
                ) : null}
                <p className="mt-1 text-xs text-text-muted">
                  {[
                    selected.first_publish_year,
                    selected.page_count ? `${selected.page_count} pp` : null,
                    selected.isbn ? `ISBN ${selected.isbn}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConfirming(false);
                  setSelected(null);
                }}
                disabled={transferring}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={transferring}
                onClick={() => void confirmTransfer()}
              >
                Transfer reading stats
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <EditionPickerModal
        open={editionOpen}
        workId={editionWorkId}
        workTitle={editionWorkTitle}
        onClose={() => {
          setEditionOpen(false);
          setPendingDoc(null);
        }}
        onSelect={handleEditionSelect}
      />
    </>
  );
}
