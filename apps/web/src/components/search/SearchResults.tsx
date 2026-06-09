import { SearchResultCard } from "@/components/search/SearchResultCard";
import {
  openLibraryCoverUrl,
  openLibraryWorkId,
  searchOpenLibrary,
} from "@/lib/services/openLibrary";

type Props = {
  query: string;
};

export async function SearchResults({ query }: Props) {
  let results;
  try {
    results = await searchOpenLibrary(query);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed.";
    return <p className="text-rust">{message}</p>;
  }

  if (!results.docs.length) {
    return <p className="text-text-muted">No books found for &ldquo;{query}&rdquo;.</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-text-muted">
        {results.numFound.toLocaleString()} results — showing {results.docs.length}
      </p>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.docs.map((doc) => {
          const title = doc.title ?? "Untitled";
          const author = doc.author_name?.[0] ?? null;
          const external_id = doc.key ?? openLibraryWorkId(doc.key) ?? "";
          const coverUrl = openLibraryCoverUrl(doc.cover_i);

          return (
            <li key={external_id || title}>
              <SearchResultCard
                title={title}
                author={author}
                external_id={external_id}
                coverUrl={coverUrl}
                cover_i={String(doc.cover_i ?? "")}
                page_count={String(doc.number_of_pages_median ?? "")}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
