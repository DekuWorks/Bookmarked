export const SEARCH_PAGE_SIZE = 12;
export const EDITION_PAGE_SIZE = 15;

export const SEARCH_LANGUAGE_OPTIONS = [
  { value: "", label: "Any language" },
  { value: "eng", label: "English" },
  { value: "spa", label: "Spanish" },
  { value: "fre", label: "French" },
  { value: "ger", label: "German" },
  { value: "ita", label: "Italian" },
  { value: "por", label: "Portuguese" },
  { value: "jpn", label: "Japanese" },
  { value: "kor", label: "Korean" },
  { value: "chi", label: "Chinese" },
] as const;

export const SEARCH_SORT_OPTIONS = [
  { value: "", label: "Relevance" },
  { value: "new", label: "Newest" },
  { value: "old", label: "Oldest" },
  { value: "rating", label: "Rating" },
] as const;

export type SearchSortValue = (typeof SEARCH_SORT_OPTIONS)[number]["value"];
