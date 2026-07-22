export const BOOK_EDITION_PRESETS = [
  "Hardcover",
  "Paperback",
  "Kindle",
  "Audible",
  "eBook",
  "Library",
] as const;

export type BookEditionPreset = (typeof BOOK_EDITION_PRESETS)[number];
