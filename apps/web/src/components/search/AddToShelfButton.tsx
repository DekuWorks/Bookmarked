"use client";

import { useActionState } from "react";
import { addOpenLibraryBookToShelf, type ShelfActionState } from "@/lib/services/books";
import { Button } from "@/components/ui/Button";
import type { ShelfStatus } from "@/types";

const initial: ShelfActionState = {};

type Props = {
  title: string;
  author: string | null;
  external_id: string;
  cover_i: string;
  page_count: string;
  shelfStatus?: ShelfStatus;
};

export function AddToShelfButton({
  title,
  author,
  external_id,
  cover_i,
  page_count,
  shelfStatus = "want_to_read",
}: Props) {
  const [state, formAction, pending] = useActionState(addOpenLibraryBookToShelf, initial);

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="author" value={author ?? ""} />
      <input type="hidden" name="external_id" value={external_id} />
      <input type="hidden" name="cover_i" value={cover_i} />
      <input type="hidden" name="page_count" value={page_count} />
      <input type="hidden" name="shelf_status" value={shelfStatus} />
      <Button type="submit" variant="outline" size="sm" loading={pending}>
        Add to shelf
      </Button>
      {state.error ? <p className="mt-1 text-xs text-rust">{state.error}</p> : null}
      {state.success ? (
        <p className="mt-1 text-xs text-puce-red">{state.success}</p>
      ) : null}
    </form>
  );
}
