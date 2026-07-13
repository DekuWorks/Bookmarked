import type {
  Profile as SharedProfile,
  Book as SharedBook,
  ShelfStatus as SharedShelfStatus,
  LibraryViewMode as SharedLibraryViewMode,
} from "../../../../packages/types";

export type Profile = SharedProfile;
export type Book = SharedBook;
export type ShelfStatus = SharedShelfStatus;
export type LibraryViewMode = SharedLibraryViewMode;

// Book Clubs — shared shapes so mobile matches web + Supabase RLS tables.
export type {
  BookClub,
  BookClubBook,
  BookClubMember,
  BookClubMemberRole,
  BookClubMemberWithProfile,
  BookClubPost,
  BookClubPostWithAuthor,
  BookClubSummary,
  BookClubVisibility,
  BookClubWithDetails,
  MessageProfile,
  PostAuthor,
} from "../../../../packages/types";

export type AuthStackParamList = {
  login: undefined;
  signup: undefined;
  "forgot-password": undefined;
  "profile-setup": undefined;
};
