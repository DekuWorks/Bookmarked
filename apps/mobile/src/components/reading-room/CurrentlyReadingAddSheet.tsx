import { useEffect, useRef, useState } from "react";
import { ActionSheetIOS, Alert } from "react-native";
import { useRouter } from "expo-router";
import { TbrPickerSheet } from "./TbrPickerSheet";
import { setShelfStatus, type LibraryBookRow } from "../../services/library";
import { trackProductEvent } from "../../services/productAnalytics";
import {
  CURRENTLY_READING_ADD_EVENTS,
  currentlyReadingAddSearchPath,
} from "../../../../../packages/utils/currentlyReadingAdd";
import { CURRENTLY_READING_ADD_COPY } from "../../../../../packages/utils/overviewCopy";

type Props = {
  userId: string;
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export function CurrentlyReadingAddSheet({ userId, visible, onClose, onAdded }: Props) {
  const router = useRouter();
  const [tbrOpen, setTbrOpen] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const onCloseRef = useRef(onClose);
  const routerRef = useRef(router);
  onCloseRef.current = onClose;
  routerRef.current = router;

  useEffect(() => {
    if (!visible || tbrOpen) return;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [
          "Cancel",
          CURRENTLY_READING_ADD_COPY.chooseFromTbr,
          CURRENTLY_READING_ADD_COPY.searchForABook,
        ],
        cancelButtonIndex: 0,
      },
      (index) => {
        if (index === 1) {
          setTbrOpen(true);
          return;
        }
        if (index === 2) {
          onCloseRef.current();
          routerRef.current.push(currentlyReadingAddSearchPath());
          return;
        }
        trackProductEvent(CURRENTLY_READING_ADD_EVENTS.canceled);
        onCloseRef.current();
      }
    );
  }, [visible, tbrOpen]);

  async function handleSelectTbr(row: LibraryBookRow) {
    const book = row.books;
    if (!book?.id) return;
    setMovingId(book.id);
    const result = await setShelfStatus(
      userId,
      {
        id: book.id,
        title: book.title,
        cover_url: book.cover_url,
        subjects: book.subjects,
        page_count: book.page_count,
      },
      "currently_reading"
    );
    setMovingId(null);
    if (result.error) {
      Alert.alert("Couldn't move book", result.error);
      return;
    }
    trackProductEvent(CURRENTLY_READING_ADD_EVENTS.fromTbr, { book_id: book.id });
    onClose();
    setTbrOpen(false);
    onAdded();
  }

  return (
    <TbrPickerSheet
      visible={visible && tbrOpen}
      userId={userId}
      movingId={movingId}
      onClose={() => setTbrOpen(false)}
      onSelect={(row) => void handleSelectTbr(row)}
      onSearchForABook={() => {
        setTbrOpen(false);
        onClose();
        router.push(currentlyReadingAddSearchPath());
      }}
    />
  );
}
