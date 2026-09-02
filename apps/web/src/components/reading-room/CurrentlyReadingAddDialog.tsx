"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { setBookShelfStatus } from "@/lib/actions/book";
import { trackProductEvent } from "@/lib/services/productAnalytics";
import type { LibraryBookRow } from "@/lib/services/library";
import {
  CURRENTLY_READING_ADD_EVENTS,
  currentlyReadingAddSearchHref,
} from "@bookmarked/utils/currentlyReadingAdd";
import { CURRENTLY_READING_ADD_COPY } from "@bookmarked/utils/overviewCopy";
import { TbrPickerModal } from "@/components/reading-room/TbrPickerModal";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export function CurrentlyReadingAddDialog({ open, onClose, onAdded }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [tbrOpen, setTbrOpen] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  function closeAll(canceled: boolean) {
    setTbrOpen(false);
    setMovingId(null);
    if (canceled) {
      trackProductEvent(CURRENTLY_READING_ADD_EVENTS.canceled);
    }
    onClose();
  }

  function goToSearch() {
    setTbrOpen(false);
    onClose();
    router.push(currentlyReadingAddSearchHref());
  }

  async function handleSelectTbr(row: LibraryBookRow) {
    const bookId = row.books?.id;
    if (!bookId) return;
    setMovingId(bookId);
    const formData = new FormData();
    formData.set("book_id", bookId);
    formData.set("shelf_status", "currently_reading");

    try {
      const result = await setBookShelfStatus({}, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      trackProductEvent(CURRENTLY_READING_ADD_EVENTS.fromTbr, { book_id: bookId });
      toast.success(result.success ?? `Moved "${row.books?.title ?? "book"}" to Currently Reading`);
      setTbrOpen(false);
      onClose();
      onAdded();
    } finally {
      setMovingId(null);
    }
  }

  return (
    <>
      <Modal
        open={open && !tbrOpen}
        onClose={() => closeAll(true)}
        title={CURRENTLY_READING_ADD_COPY.cardLabel}
      >
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={() => setTbrOpen(true)}
          >
            {CURRENTLY_READING_ADD_COPY.chooseFromTbr}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={goToSearch}>
            {CURRENTLY_READING_ADD_COPY.searchForABook}
          </Button>
        </div>
      </Modal>

      <TbrPickerModal
        open={open && tbrOpen}
        movingId={movingId}
        onClose={() => {
          setTbrOpen(false);
        }}
        onSelect={(row) => void handleSelectTbr(row)}
        onSearchForABook={goToSearch}
      />
    </>
  );
}
