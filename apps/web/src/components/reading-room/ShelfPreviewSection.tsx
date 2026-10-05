import { ButtonLink } from "@/components/ui/ButtonLink";
import { ShelfPreviewRow } from "@/components/reading-room/ShelfPreviewRow";
import type { ShelfGroup } from "@/lib/services/library";
import { withOriginQuery } from "@bookmarked/utils/navigationOrigin";
import { OVERVIEW_SECTION_TITLES } from "@bookmarked/utils/overviewCopy";
import {
  OVERVIEW_PREVIEW_SHELVES,
  previewShelfItems,
} from "@bookmarked/utils/overviewShelfPreview";

type Props = {
  shelves: ShelfGroup[];
};

export function ShelfPreviewSection({ shelves }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-surface/90 p-4 shadow-sm md:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-puce-red md:text-2xl">
          {OVERVIEW_SECTION_TITLES.shelves}
        </h2>
        <ButtonLink
          href={withOriginQuery("/library/", { origin: "reading_room_overview" })}
          variant="ghost"
          size="sm"
        >
          {OVERVIEW_SECTION_TITLES.seeAllShelves}
        </ButtonLink>
      </div>
      <div className="space-y-5">
        {OVERVIEW_PREVIEW_SHELVES.map((shelf) => {
          const items = shelves.find((group) => group.status === shelf.status)?.items ?? [];
          return (
            <ShelfPreviewRow
              key={shelf.status}
              title={shelf.title}
              count={items.length}
              items={previewShelfItems(items)}
            />
          );
        })}
      </div>
    </section>
  );
}
