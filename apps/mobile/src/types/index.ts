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

export type AuthStackParamList = {
  login: undefined;
  signup: undefined;
  "forgot-password": undefined;
  "profile-setup": undefined;
};
