/** Bookmarked-controlled Home → Overview labels (not user-generated book copy). */

export const OVERVIEW_SECTION_TITLES = {
  currentlyReading: "Currently Reading",
  recentlyFinished: "Recently Finished",
  favorites: "Favorites",
  quickActions: "Quick Actions",
  recentActivity: "Recent Activity",
} as const;

export const OVERVIEW_QUICK_ACTIONS = {
  searchBooks: "Search Books",
  continueReading: "Continue Reading",
  openLibrary: "Open Library",
  trail: "Trail",
} as const;

export const OVERVIEW_ACTIVITY_VIEW_ALL = "View all activity";

export const CURRENTLY_READING_ADD_COPY = {
  cardLabel: "Add Book to Currently Reading",
  chooseFromTbr: "Choose from TBR",
  searchForABook: "Search for a Book",
  tbrEmpty: "Your TBR is empty.",
  addingBanner: "Adding to Currently Reading",
} as const;
