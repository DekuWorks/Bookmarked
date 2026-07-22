export type {
  ShelfStatus,
  LibraryViewMode,
  ReviewVisibility,
  ShelfVisibility,
  PreferredLanguage,
  UserShelf,
  Profile,
  SubscriptionTier,
  SubscriptionStatus,
  SubscriptionProvider,
  PremiumFeature,
  UserSubscription,
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
  NotificationType,
  Notification,
  NotificationWithActor,
  NotificationPreferences,
  PostAuthor,
  Post,
  PostDraft,
  PostComment,
  PostCommentWithAuthor,
  PostWithAuthor,
  BookClubVisibility,
  BookClubMemberRole,
  BookClubBook,
  BookClub,
  BookClubMember,
  BookClubMemberWithProfile,
  BookClubPost,
  BookClubPostWithAuthor,
  BookClubSummary,
  BookClubWithDetails,
  ContentReaction,
  ReactionCounts,
  ReviewReply,
  ReviewReplyWithAuthor,
  PostCommentReply,
  PostCommentReplyWithAuthor,
  ReadingSession,
  ReadingNote,
  ReadingNoteCategory,
  BuiltinReadingNoteCategory,
  UserReadingNoteCategory,
  ReadingNoteVisibility,
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
  read_count: number;
  completion_tags: string[];
  dnf: boolean;
  expected_read_date: string | null;
  created_at: string;
  updated_at: string;
  books?: import("../../../../packages/types").Book;
}

export type ReviewRatingMode = "regular" | "advanced";

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  user_book_id: string | null;
  read_number: number;
  rating: number | null;
  review_body: string | null;
  has_spoilers: boolean;
  visibility: import("../../../../packages/types").ReviewVisibility;
  edition: string | null;
  feelings: string[];
  plot: number | null;
  characters: number | null;
  writing_style: number | null;
  world_building: number | null;
  pacing: number | null;
  emotional_impact: number | null;
  rating_mode: ReviewRatingMode;
  rating_emoji: string | null;
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

/** @deprecated Prefer CatalogDoc from `@/lib/services/isbndb` */
export interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  cover_url?: string | null;
  first_publish_year?: number;
  isbn?: string[];
  number_of_pages_median?: number;
  first_sentence?: string[];
  subject?: string[];
  publisher?: string[];
}
