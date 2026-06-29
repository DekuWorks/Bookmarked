"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookSpine } from "@/components/library/BookSpine";
import { EmptyShelfMessage } from "@/components/library/EmptyShelfMessage";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { CopyLinkButton } from "@/components/ui/CopyLinkButton";
import { LoadingState } from "@/components/ui/LoadingState";
import { layout } from "@/lib/constants/layout";
import { bookDetailsPath } from "@/lib/routes/book";
import { customShelfPath } from "@/lib/routes/customShelf";
import {
  getCustomShelfBySlug,
  removeBookFromCustomShelf,
  type CustomShelfGroup,
} from "@/lib/services/customShelves";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

function CustomShelfContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug")?.trim() ?? "";
  const user = useAuthUser();
  const [shelf, setShelf] = useState<CustomShelfGroup | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadShelf = useCallback(async () => {
    if (!user || !slug) return;

    const data = await getCustomShelfBySlug(user.id, slug);
    if (!data) {
      setLoadError("Shelf not found.");
      setShelf(null);
      return;
    }

    setLoadError(null);
    setShelf(data);
  }, [slug, user]);

  useEffect(() => {
    if (!user || !slug) return;

    setShelf(null);
    setLoadError(null);
    void loadShelf().catch((error) => {
      console.error("[custom-shelf] load failed:", error);
      setLoadError("Could not load this shelf. Please refresh and try again.");
    });
  }, [user, slug, loadShelf]);

  async function handleRemove(bookId: string) {
    if (!shelf) return;
    setRemovingId(bookId);
    const result = await removeBookFromCustomShelf(shelf.id, bookId);
    setRemovingId(null);
    if (!result.error) {
      setShelf((current) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.book_id !== bookId),
            }
          : current
      );
    }
  }

  if (!slug) {
    return (
      <div className="text-center">
        <p className="text-text-muted">No shelf selected.</p>
        <Link href="/library" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  if (user === undefined || (user && !shelf && !loadError)) {
    return <LoadingState message="Loading shelf…" />;
  }

  if (loadError) {
    return (
      <div className="text-center">
        <p className="text-rust">{loadError}</p>
        <Link href="/library" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  if (!user || !shelf) return null;

  return (
    <div className={layout.pageStackWide}>
      <header className="flex flex-col items-center gap-4 text-center">
        <div>
          <Link
            href="/library"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Back to library
          </Link>
          <h1 className="mt-2 flex items-center justify-center gap-2 text-3xl font-bold text-puce-red sm:text-4xl">
            <span aria-hidden>📚</span>
            {shelf.name}
          </h1>
          {shelf.genre ? (
            <p className="mt-1 text-sm font-medium text-primary">{shelf.genre}</p>
          ) : null}
          <p className="mt-2 text-sm font-medium text-text">
            {shelf.items.length} {shelf.items.length === 1 ? "book" : "books"}
          </p>
          <div className="mt-3 flex justify-center">
            <CopyLinkButton path={customShelfPath(shelf.slug)} label="Copy shelf link" variant="outline" />
          </div>
        </div>
        <ButtonLink href="/search" variant="secondary">
          Add books
        </ButtonLink>
      </header>

      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="bookshelf-back px-4 pb-0 pt-5">
          {shelf.items.length === 0 ? (
            <EmptyShelfMessage className="pb-6" />
          ) : (
            <div className="bookshelf-row scrollbar-thin">
              {shelf.items.map((item) => {
                const book = item.books;
                return (
                  <div key={item.id} className="relative shrink-0">
                    <BookSpine
                      title={book?.title ?? "Untitled"}
                      author={book?.author}
                      coverUrl={book?.cover_url}
                      pageCount={book?.page_count}
                      href={book?.id ? bookDetailsPath(book.id) : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => void handleRemove(item.book_id)}
                      disabled={removingId === item.book_id}
                      className="absolute -right-1 -top-1 rounded-full bg-surface px-2 py-0.5 text-xs text-rust shadow-sm hover:bg-background disabled:opacity-50"
                      aria-label={`Remove ${book?.title ?? "book"} from shelf`}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="bookshelf-board h-5 rounded-b-xl" aria-hidden />
      </section>
    </div>
  );
}

export default function CustomShelfPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading shelf…" />}>
      <CustomShelfContent />
    </Suspense>
  );
}
