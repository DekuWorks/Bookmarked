/**
 * Centralized stacking-order scale for apps/web.
 *
 * Import these tokens instead of hardcoding `z-*` utilities so nav,
 * dropdowns, modals, and toasts stay in a predictable, non-overlapping
 * order across the app:
 *
 *   Page content            0–10
 *   Sticky sub-headers      20–30
 *   Primary navigation      40
 *   Dropdowns / popovers    50–60
 *   Modal backdrop          70
 *   Modal / sheet           80–90
 *   Toast                   100
 *
 * Local, purely decorative stacking within a single component (e.g. an
 * absolutely-positioned highlight pill behind sibling tab labels) doesn't
 * need a token — only layers that can visually collide with nav, menus,
 * modals, or toasts should use this scale.
 */
export const Z_LAYERS = {
  page: 0,
  raisedContent: 10,
  stickyHeader: 20,
  stickyHeaderRaised: 30,
  navigation: 40,
  dropdown: 50,
  popover: 60,
  modalBackdrop: 70,
  modal: 80,
  sheet: 90,
  toast: 100,
} as const;

export type ZLayerName = keyof typeof Z_LAYERS;

/**
 * Tailwind arbitrary-value classes matching {@link Z_LAYERS}. Written as
 * literal strings (not composed at runtime) so Tailwind's content scanner
 * can find and generate them.
 */
export const Z_CLASS: Record<ZLayerName, string> = {
  page: "z-0",
  raisedContent: "z-[10]",
  stickyHeader: "z-[20]",
  stickyHeaderRaised: "z-[30]",
  navigation: "z-[40]",
  dropdown: "z-[50]",
  popover: "z-[60]",
  modalBackdrop: "z-[70]",
  modal: "z-[80]",
  sheet: "z-[90]",
  toast: "z-[100]",
};
