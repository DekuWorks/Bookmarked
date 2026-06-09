import { SHELF_CONFIG } from "@/lib/constants/shelves";

/** Slugs pre-rendered for static export (GitHub Pages). */
export function getStaticShelfSlugs() {
  return SHELF_CONFIG.map((shelf) => ({ shelf: shelf.slug }));
}
