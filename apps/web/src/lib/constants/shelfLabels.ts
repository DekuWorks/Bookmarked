import type { ShelfStatus } from "@/types";

export const SHELF_LABELS: Record<ShelfStatus, string> = {
  want_to_read: "TBR",
  currently_reading: "Currently Reading",
  read: "Finished",
  dnf: "DNF",
};

export function getShelfLabel(status: ShelfStatus): string {
  return SHELF_LABELS[status];
}

export function isShelfStatus(value: string): value is ShelfStatus {
  return (
    value === "want_to_read" ||
    value === "currently_reading" ||
    value === "read" ||
    value === "dnf"
  );
}
