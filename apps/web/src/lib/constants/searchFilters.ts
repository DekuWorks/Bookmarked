export const SEARCH_PAGE_SIZE = 12;
export const EDITION_PAGE_SIZE = 15;

export const SEARCH_LANGUAGE_OPTIONS = [
  { value: "", label: "Any language" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
] as const;

export const SEARCH_SORT_OPTIONS = [
  { value: "", label: "Relevance" },
  { value: "new", label: "Newest" },
  { value: "old", label: "Oldest" },
  { value: "rating", label: "Rating" },
] as const;

export type SearchSortValue = (typeof SEARCH_SORT_OPTIONS)[number]["value"];
