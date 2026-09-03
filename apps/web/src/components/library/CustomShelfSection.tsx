"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandChromeIcon } from "@/components/icons/BrandChromeIcon";
import { BookSpine } from "@/components/library/BookSpine";
import { EmptyShelfMessage } from "@/components/library/EmptyShelfMessage";
import { DeleteCustomShelfModal } from "@/components/shelves/DeleteCustomShelfModal";
import { customShelfPath } from "@/lib/routes/customShelf";
import { bookDetailsPath } from "@/lib/routes/book";
import { Z_CLASS } from "@/lib/constants/zIndex";
import { cn } from "@/lib/utils/cn";
import type { CustomShelfGroup } from "@/lib/services/customShelves";

type Props = {
  shelf: CustomShelfGroup;
  showHeaderLink?: boolean;
  onDeleted?: (shelfId: string) => void;
};

export function CustomShelfSection({ shelf, showHeaderLink = true, onDeleted }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  function openDeleteDialog() {
    setMenuOpen(false);
    setDeleteOpen(true);
  }

  return (
    <>
      {/* No `overflow-hidden` on the section itself — the header's "⋯" dropdown is
          absolutely positioned inside it and would otherwise get clipped. Rounded
          corners + overflow clipping are scoped to the shelf visual below instead. */}
      <section className="rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col items-center justify-center gap-2 border-b border-border px-4 py-3 text-center sm:flex-row sm:justify-between">
          <div>
            <h2 className="flex flex-wrap items-center justify-center gap-2 text-lg font-semibold text-puce-red sm:justify-start">
              <BrandChromeIcon name="library" />
              {shelf.name}
              <span className="text-sm font-normal text-text-muted">({shelf.items.length})</span>
            </h2>
            {shelf.genre ? (
              <p className="mt-0.5 text-xs text-text-muted">Genre: {shelf.genre}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {showHeaderLink ? (
              <Link
                href={customShelfPath(shelf.slug)}
                className="text-sm font-medium text-primary hover:underline"
              >
                View Shelf
              </Link>
            ) : null}
            {onDeleted ? (
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg text-text-muted hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
                  aria-label={`Options for ${shelf.name}`}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  ⋯
                </button>
                {menuOpen ? (
                  <div
                    role="menu"
                    className={cn(
                      "absolute right-0 top-full mt-1 min-w-[10rem] rounded-lg border border-border bg-surface py-1 shadow-lg",
                      Z_CLASS.dropdown
                    )}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={openDeleteDialog}
                      className="block w-full px-4 py-2 text-left text-sm text-rust hover:bg-background"
                    >
                      Delete shelf
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-b-xl">
          <div className="bookshelf-back px-4 pb-0 pt-5">
            {shelf.items.length === 0 ? (
              <EmptyShelfMessage className="pb-6" />
            ) : (
              <div className="bookshelf-row scrollbar-thin">
                {shelf.items.map((item) => {
                  const book = item.books;
                  return (
                    <BookSpine
                      key={item.id}
                      title={book?.title ?? "Untitled"}
                      author={book?.author}
                      coverUrl={book?.cover_url}
                      pageCount={book?.page_count}
                      href={book?.id ? bookDetailsPath(book.id) : undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
          <div className="bookshelf-board h-5 rounded-b-xl" aria-hidden />
        </div>
      </section>

      {onDeleted ? (
        <DeleteCustomShelfModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          shelfId={shelf.id}
          shelfName={shelf.name}
          onDeleted={() => onDeleted(shelf.id)}
        />
      ) : null}
    </>
  );
}
