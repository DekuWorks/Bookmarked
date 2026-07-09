"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { addAnotherRead, type BookActionState } from "@/lib/actions/book";

const initial: BookActionState = {};

type Props = {
  bookId: string;
  onStarted?: () => void;
};

export function AddAnotherReadButton({ bookId, onStarted }: Props) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState(addAnotherRead, initial);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(state.success);
      onStarted?.();
    }
  }, [state, toast, onStarted]);

  return (
    <form action={formAction}>
      <input type="hidden" name="book_id" value={bookId} />
      <Button type="submit" variant="outline" loading={pending}>
        Add another read
      </Button>
    </form>
  );
}
