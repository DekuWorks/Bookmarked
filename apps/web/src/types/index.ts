export type {
  ShelfStatus,
  LibraryViewMode,
  ReviewVisibility,
  ShelfVisibility,
  Profile,
  Book,
  ConversationType,
  ConversationParticipantRole,
  MessageProfile,
  Conversation,
  ConversationParticipant,
  Message,
  ConversationParticipantWithProfile,
  ConversationWithParticipants,
  MessageWithSender,
  ConversationPreview,
} from "../../../../packages/types";

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  shelf_status: import("../../../../packages/types").ShelfStatus;
  progress_pages: number;
  progress_percent: number;
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  books?: import("../../../../packages/types").Book;
}

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number | null;
  review_body: string | null;
  has_spoilers: boolean;
  visibility: import("../../../../packages/types").ReviewVisibility;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string | null; username: string | null };
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

export interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  isbn?: string[];
  number_of_pages_median?: number;
  first_sentence?: string[];
  subject?: string[];
  publisher?: string[];
}
