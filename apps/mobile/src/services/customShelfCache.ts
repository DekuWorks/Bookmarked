import type { QueryClient } from "@tanstack/react-query";

/** Library, Profile, Add/Move, and custom shelf cards all read these keys. */
export async function invalidateCustomShelfViews(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["custom-shelves"] }),
    queryClient.invalidateQueries({ queryKey: ["custom-shelf"] }),
    queryClient.invalidateQueries({ queryKey: ["library"] }),
    queryClient.invalidateQueries({ queryKey: ["reader-shelf-preview"] }),
  ]);
}
