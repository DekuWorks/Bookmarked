/** Bookmarked-controlled Home → Overview labels (not user-generated book copy). */

export const OVERVIEW_SECTION_TITLES = {
  currentlyReading: "Currently Reading",
  recentlyFinished: "Recently Finished",
  favorites: "Favorites",
  quickActions: "Quick Actions",
  recentActivity: "Recent Activity",
} as const;

export const OVERVIEW_QUICK_ACTIONS = {
  openLibrary: "Open Library",
  bookClubs: "Book Clubs",
  readingChallenges: "Reading Challenges",
} as const;

export const OVERVIEW_ACTIVITY_VIEW_ALL = "View All Activity";

export const OVERVIEW_SHELF_ACTIONS = {
  viewAll: "View All",
  viewShelf: "View Shelf",
} as const;

export const FAVORITES_LISTING = {
  title: "Favorites",
  description: "Books you've starred from their detail page.",
  empty: "Star books from their detail page to collect favorites here.",
  webPath: "/library/favorites/",
  mobilePath: "/library/favorites",
} as const;

export const CURRENTLY_READING_ADD_COPY = {
  cardLabel: "Add Book to Currently Reading",
  chooseFromTbr: "Choose from TBR",
  searchForABook: "Search for a Book",
  tbrEmpty: "Your TBR is empty.",
  addingBanner: "Adding to Currently Reading",
} as const;
