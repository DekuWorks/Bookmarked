"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildCustomCategoryLookup,
  type ReadingNoteCategoryMeta,
} from "@/lib/readingNotes/categories";
import {
  listCustomNoteCategories,
  listNoteCategories,
} from "@/lib/services/noteCategories";
import type { UserReadingNoteCategory } from "@/types";

export function useReadingNoteCategories(userId: string | undefined) {
  const [customCategories, setCustomCategories] = useState<UserReadingNoteCategory[]>([]);
  const [categories, setCategories] = useState<ReadingNoteCategoryMeta[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  const refresh = useCallback(async () => {
    if (!userId) {
      setCustomCategories([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [custom, merged] = await Promise.all([
      listCustomNoteCategories(userId),
      listNoteCategories(userId),
    ]);
    setCustomCategories(custom);
    setCategories(merged);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const customLookup = useMemo(
    () => buildCustomCategoryLookup(customCategories),
    [customCategories]
  );

  return {
    categories,
    customCategories,
    customLookup,
    loading,
    refresh,
  };
}
