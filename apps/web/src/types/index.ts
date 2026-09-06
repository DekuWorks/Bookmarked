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
  FeatureKey,
  PremiumFeature,
  UserSubscription,
  Book,
  ConversationType,
  ConversationParticipantRole,
  MessageProfile,
  Conversation,
  ConversationParticipant,
  Message,
  MessageSharePayload,
  MessageReaction,
  MessageReactionSummary,
  MessageReplyPreview,
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
  BookClubJoinPolicy,
  BookClubStatus,
  BookClubMemberRole,
  BookClubMembershipStatus,
  BookClubInvitationStatus,
  BookClubJoinRequestStatus,
  BookClubEventType,
  BookClubMeetingPlatform,
  BookClubRsvpStatus,
  BookClubBookCategory,
  BookClubNotificationLevel,
  BookClubBook,
  BookClub,
  BookClubMember,
  BookClubMemberWithProfile,
  BookClubPost,
  BookClubDiscussion,
  BookClubDiscussionWithAuthor,
  BookClubPostWithAuthor,
  BookClubDiscussionReply,
  BookClubDiscussionReplyWithAuthor,
  BookClubInvitation,
  BookClubInvitationWithDetails,
  BookClubJoinRequest,
  BookClubJoinRequestWithDetails,
  BookClubSummary,
  BookClubWithDetails,
  BookClubEvent,
  BookClubEventWithClub,
  BookClubEventAttendee,
  BookClubAnnouncement,
  BookClubAnnouncementWithAuthor,
  BookClubShelfBook,
  BookClubCurrentRead,
  BookClubSettings,
  BookClubStats,
  ContentReaction,
  ReactionCounts,
  ModerationMeta,
  ReportableContentType,
  ContentReportReason,
  ContentReportStatus,
  ContentReport,
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
  listening_progress_seconds?: number;
  tracking_format?: "book" | "audiobook" | null;
  audiobook_duration_seconds?: number | null;
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
  is_favorite: boolean;
  read_count: number;
  completion_tags: string[];
  dnf: boolean;
  expected_read_date: string | null;
  total_pages?: number | null;
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
  would_recommend?: boolean | null;
  reread_likelihood?: number | null;
  reread_likelihood_scale?: string | null;
  favorite_chapter_number?: number | null;
  favorite_chapter_label?: string | null;
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
