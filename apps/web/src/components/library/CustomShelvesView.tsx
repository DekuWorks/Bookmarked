import { CustomShelfSection } from "@/components/library/CustomShelfSection";
import type { CustomShelfGroup } from "@/lib/services/customShelves";

type Props = {
  shelves: CustomShelfGroup[];
  onShelfDeleted?: (shelfId: string) => void;
};

export function CustomShelvesView({ shelves, onShelfDeleted }: Props) {
  if (shelves.length === 0) return null;

  return (
    <div className="space-y-8">
      {shelves.map((shelf) => (
        <CustomShelfSection key={shelf.id} shelf={shelf} onDeleted={onShelfDeleted} />
      ))}
    </div>
  );
}
