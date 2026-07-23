"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { useActionToast } from "@/lib/hooks/useActionToast";
import { addAnotherRead, type BookActionState } from "@/lib/actions/book";

const initial: BookActionState = {};

type Props = {
  bookId: string;
  onStarted?: () => void;
};

export function AddAnotherReadButton({ bookId, onStarted }: Props) {
  const [state, formAction, pending] = useActionState(addAnotherRead, initial);

  useActionToast(state, onStarted);

  return (
    <form action={formAction}>
      <input type="hidden" name="book_id" value={bookId} />
      <Button type="submit" variant="outline" loading={pending}>
        Add another read
      </Button>
    </form>
  );
}
