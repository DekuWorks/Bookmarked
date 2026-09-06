import { CustomShelfSection } from "@/components/library/CustomShelfSection";
import type { CustomShelfGroup } from "@/lib/services/customShelves";

type Props = {
  shelves: CustomShelfGroup[];
  onShelfDeleted?: (shelfId: string) => void;
  onShelfUpdated?: (shelf: import("@/types").UserShelf) => void;
};

export function CustomShelvesView({ shelves, onShelfDeleted, onShelfUpdated }: Props) {
  if (shelves.length === 0) return null;

  return (
    <div className="space-y-8">
      {shelves.map((shelf) => (
        <CustomShelfSection
          key={shelf.id}
          shelf={shelf}
          onDeleted={onShelfDeleted}
          onUpdated={onShelfUpdated}
        />
      ))}
    </div>
  );
}
