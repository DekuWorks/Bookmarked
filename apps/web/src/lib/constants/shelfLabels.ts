import type { ShelfStatus } from "@/types";

export const SHELF_LABELS: Record<ShelfStatus, string> = {
  want_to_read: "Want to Read",
  currently_reading: "Currently Reading",
  read: "Finished",
};

export function getShelfLabel(status: ShelfStatus): string {
  return SHELF_LABELS[status];
}

export function isShelfStatus(value: string): value is ShelfStatus {
  return value === "want_to_read" || value === "currently_reading" || value === "read";
}
