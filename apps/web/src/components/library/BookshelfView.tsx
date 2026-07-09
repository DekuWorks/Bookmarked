import { BookshelfSection } from "@/components/library/BookshelfSection";
import type { ShelfGroup } from "@/lib/services/library";

type Props = {
  shelves: ShelfGroup[];
  /** When set, shelf links route to this reader's public library. */
  username?: string;
  showHeaderLink?: boolean;
};

export function BookshelfView({ shelves, username, showHeaderLink = true }: Props) {
  return (
    <div className="space-y-8">
      {shelves.map((shelf) => (
        <BookshelfSection
          key={shelf.status}
          title={shelf.title}
          emoji={shelf.emoji}
          status={shelf.status}
          slug={shelf.slug}
          items={shelf.items}
          username={username}
          showHeaderLink={showHeaderLink}
        />
      ))}
    </div>
  );
}
