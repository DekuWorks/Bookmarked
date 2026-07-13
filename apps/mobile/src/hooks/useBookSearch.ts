import { useQuery } from "@tanstack/react-query";
import { searchIsbndb } from "../services/isbndb";

export function useBookSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ["book-search", trimmed],
    queryFn: () => searchIsbndb(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
