import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookCard } from "@/components/books/BookCard";
import { Button } from "@/components/ui/Button";
import type { ShelfStatus } from "@/types";

export const metadata = { title: "Library" };

const shelves: { status: ShelfStatus; title: string }[] = [
  { status: "currently_reading", title: "Currently reading" },
  { status: "want_to_read", title: "Want to read" },
  { status: "read", title: "Read" },
];

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userBooks } = await supabase
    .from("user_books")
    .select(
      "id, shelf_status, progress_percent, books(id, title, author, cover_url)"
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  const byShelf = shelves.map((shelf) => ({
    ...shelf,
    items: (userBooks ?? []).filter((ub) => ub.shelf_status === shelf.status),
  }));

  const isEmpty = !userBooks?.length;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-puce-red">Library</h1>
          <p className="mt-1 text-text-muted">Your shelves in one place.</p>
        </div>
        <Link href="/search" className="inline-flex">
          <Button variant="secondary" type="button">
            Add books
          </Button>
        </Link>
      </header>

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-lg font-medium text-text">Your library is empty</p>
          <p className="mt-2 text-text-muted">Search for books to add them to a shelf.</p>
          <Link href="/search" className="mt-6 inline-flex">
            <Button variant="primary" type="button">
              Search books
            </Button>
          </Link>
        </div>
      ) : (
        byShelf.map((shelf) => (
          <section key={shelf.status}>
            <h2 className="mb-4 text-xl font-semibold text-puce-red">{shelf.title}</h2>
            {shelf.items.length === 0 ? (
              <p className="text-sm text-text-muted">No books on this shelf yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {shelf.items.map((ub) => {
                  const book = ub.books as {
                    id?: string;
                    title?: string;
                    author?: string | null;
                    cover_url?: string | null;
                  } | null;
                  return (
                    <BookCard
                      key={ub.id}
                      title={book?.title ?? "Untitled"}
                      author={book?.author}
                      coverUrl={book?.cover_url}
                      shelfStatus={shelf.status}
                      progressPercent={Number(ub.progress_percent) || 0}
                      href={book?.id ? `/books/${book.id}` : undefined}
                    />
                  );
                })}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
