/**
 * Thin compatibility adapters formerly backed by Open Library.
 * New catalog traffic uses ISBNdb via `./isbndb`.
 */

export {
  searchIsbndb as searchOpenLibrary,
  searchIsbndbByAuthor as searchOpenLibraryByAuthor,
  fetchCatalogEditions as fetchWorkEditions,
  fetchIsbndbBookDetails as fetchOpenLibraryWorkDetails,
  catalogExternalId as openLibraryWorkId,
  isbndbCoverUrl,
  type CatalogDoc as OpenLibraryDoc,
  type CatalogSearchResult as OpenLibrarySearchResult,
  type CatalogSearchOptions as OpenLibrarySearchOptions,
  type CatalogEditionSummary as OpenLibraryEditionSummary,
  type CatalogEditionsResult as OpenLibraryEditionsResult,
  type CatalogWorkDetails as OpenLibraryWorkDetails,
  type FetchEditionsOptions as FetchWorkEditionsOptions,
} from "@/lib/services/isbndb";

/** @deprecated ISBNdb stores full cover URLs — use document.cover_url instead. */
export function openLibraryCoverUrl(_coverId?: number): string | null {
  return null;
}
