import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useProfile } from "./useProfile";
import {
  normalizeLibraryView,
  updatePreferredLibraryView,
  type DisplayLibraryView,
} from "../services/libraryView";
import { useAuthStore } from "../store/authStore";
import type { Profile } from "../types";

export function useLibraryViewMode() {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();

  const view = useMemo(
    () => normalizeLibraryView(profile?.preferred_library_view),
    [profile?.preferred_library_view]
  );

  const mutation = useMutation({
    mutationFn: (mode: DisplayLibraryView) => updatePreferredLibraryView(mode),
    onMutate: async (mode) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ["profile", userId] });
      const previous = queryClient.getQueryData<Profile | null>(["profile", userId]);
      if (previous) {
        queryClient.setQueryData<Profile | null>(["profile", userId], {
          ...previous,
          preferred_library_view: mode,
        });
      }
      return { previous };
    },
    onError: (_err, _mode, context) => {
      if (context?.previous && userId) {
        queryClient.setQueryData(["profile", userId], context.previous);
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      }
    },
  });

  return {
    view,
    setView: mutation.mutate,
    isPending: mutation.isPending,
  };
}
