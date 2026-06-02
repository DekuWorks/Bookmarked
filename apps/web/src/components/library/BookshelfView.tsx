import { BookshelfSection } from "@/components/library/BookshelfSection";
import type { ShelfGroup } from "@/lib/services/library";

type Props = {
  shelves: ShelfGroup[];
};

export function BookshelfView({ shelves }: Props) {
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
        />
      ))}
    </div>
  );
}
