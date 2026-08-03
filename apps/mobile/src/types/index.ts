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

export type {
  SubscriptionTier,
  SubscriptionStatus,
  SubscriptionProvider,
  FeatureKey,
  PremiumFeature,
  UserSubscription,
} from "../../../../packages/types";

export type {
  UserBook,
  Review,
  ReviewRatingMode,
  ReviewVisibility,
  ShelfVisibility,
  UserShelf,
  ReadingSession,
  ReadingNote,
  ReadingNoteCategory,
  BuiltinReadingNoteCategory,
  UserReadingNoteCategory,
  ReadingNoteVisibility,
  Conversation,
  ConversationPreview,
  ConversationWithParticipants,
  ConversationParticipantWithProfile,
  Message,
  MessageSharePayload,
  MessageWithSender,
  MessageReactionSummary,
  MessageReplyPreview,
  Notification,
  NotificationType,
  NotificationWithActor,
  Post,
  PostDraft,
  PostComment,
  PostCommentWithAuthor,
  PostCommentReply,
  PostCommentReplyWithAuthor,
  PostWithAuthor,
  ContentReaction,
  ReactionCounts,
} from "../../../../packages/types";

// Book Clubs — shared shapes so mobile matches web + Supabase RLS tables.
export type {
  BookClub,
  BookClubAnnouncement,
  BookClubAnnouncementWithAuthor,
  BookClubBook,
  BookClubBookCategory,
  BookClubCurrentRead,
  BookClubDiscussion,
  BookClubDiscussionReply,
  BookClubDiscussionReplyWithAuthor,
  BookClubDiscussionWithAuthor,
  BookClubEvent,
  BookClubEventAttendee,
  BookClubEventType,
  BookClubEventWithClub,
  BookClubInvitation,
  BookClubInvitationWithDetails,
  BookClubJoinPolicy,
  BookClubJoinRequest,
  BookClubJoinRequestWithDetails,
  BookClubMeetingPlatform,
  BookClubMember,
  BookClubMemberRole,
  BookClubMembershipStatus,
  BookClubMemberWithProfile,
  BookClubPost,
  BookClubPostWithAuthor,
  BookClubRsvpStatus,
  BookClubShelfBook,
  BookClubStats,
  BookClubStatus,
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
