/** Stable database keys for the four built-in library shelves. */
export type ShelfStatus = "want_to_read" | "currently_reading" | "read" | "dnf";

export type LibraryViewMode = "bookshelf" | "grid" | "reading_room";

export type ReviewVisibility = "public" | "followers" | "private";

export type ShelfVisibility = "public" | "followers" | "private";

export type PreferredLanguage = "en" | "es" | "fr" | "de";

export interface UserShelf {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  genre: string | null;
  visibility: ShelfVisibility;
  /** Stable custom icon key (`custom_icon_1`…`custom_icon_5`). Null uses documented fallback. */
  icon_key: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ModerationMeta = {
  status: "allow" | "warn" | "block";
  categories: string[];
  spans: Array<{
    start: number;
    end: number;
    category: string;
    severity: "warn" | "block";
    treatment: "blur_until_reveal";
  }>;
  reasonCode: string;
  moderationVersion: string;
};

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  moderation_meta?: ModerationMeta | null;
  avatar_url: string | null;
  favorite_genres: string[] | null;
  preferred_library_view: LibraryViewMode;
  yearly_reading_goal: number | null;
  shelf_visibility_want_to_read: ShelfVisibility;
  shelf_visibility_currently_reading: ShelfVisibility;
  shelf_visibility_read: ShelfVisibility;
  shelf_visibility_dnf: ShelfVisibility;
  notify_messages: boolean;
  notify_follows: boolean;
  notify_feed: boolean;
  notify_likes: boolean;
  notify_comments: boolean;
  notify_mentions: boolean;
  notify_browser: boolean;
  preferred_language: PreferredLanguage;
  created_at: string;
  updated_at: string;
}

/** Paid memberships are tiered; Plus supersedes the former Premium plan. */
export type SubscriptionTier = "free" | "plus" | "home";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "expired"
  | "grace_period";

export type SubscriptionProvider = "stripe" | "apple" | "google" | "manual";

/**
 * Canonical gated capability keys (Free limits + Plus/Home unlocks).
 * Use with `canAccessFeature` / `ENTITLEMENTS` in `@bookmarked/utils`.
 */
export type FeatureKey =
  | "custom_shelves"
  | "saved_quotes"
  | "quote_graphics"
  | "joined_book_clubs"
  | "reading_challenges"
  | "advanced_reading_insights"
  | "reading_speed"
  | "reading_time"
  | "pages_by_week"
  | "pages_by_month"
  | "reading_habits"
  | "favorite_authors"
  | "mood_analytics"
  | "year_over_year_comparison"
  | "advanced_reading_goals"
  | "reading_heatmaps"
  | "monthly_wrapped"
  | "ai_reading_companion"
  | "quote_scanner"
  | "advanced_reviews"
  | "club_polls"
  | "club_analytics"
  | "full_reading_dna"
  | "reading_dna_ai_insights"
  | "reading_dna_book_matches"
  | "reading_dna_year_comparison";

/**
 * @deprecated Prefer `FeatureKey`. Kept as a union alias plus legacy string keys
 * so existing call sites compile while migrating.
 */
export type PremiumFeature =
  | FeatureKey
  | "tracker"
  | "library"
  | "goals"
  | "feed"
  | "reviews"
  | "custom_shelf"
  | "basic_ai"
  | "stats"
  | "reading_dna_traits"
  | "reading_insights"
  | "heatmaps"
  | "ai_companion"
  | "quote_vault"
  | "unlimited_quotes"
  | "unlimited_clubs"
  | "unlimited_challenges"
  | "reading_dna_dashboard"
  | "book_matches"
  | "book_map"
  | "reader_map"
  | "reading_dna_match"
  | "premium_events"
  | "concierge"
  | "priority_support"
  | "advanced_analytics"
  | "ai_insights";

export interface UserSubscription {
  user_id: string;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_provider: SubscriptionProvider | null;
  subscription_expires_at: string | null;
  stripe_customer_id?: string | null;
  apple_original_transaction_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  external_source: string | null;
  external_id: string | null;
  /** `audiobook` tracks progress by listening time instead of pages. */
  format?: "book" | "ebook" | "audiobook";
  audiobook_duration_seconds?: number | null;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  page_count: number | null;
  published_date: string | null;
  isbn: string | null;
  publisher: string | null;
  subjects: string[] | null;
  /** Phase 3: series UI not yet implemented */
  series_name?: string | null;
  /** Phase 3: series UI not yet implemented */
  series_position?: number | null;
  created_at: string;
}

export type ConversationType = "direct" | "group";

export type ConversationParticipantRole = "owner" | "member";

export interface MessageProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ConversationParticipantRole;
  joined_at: string;
  last_read_at: string | null;
  pinned_at: string | null;
}

/** Structured DM share card payload (see packages/utils/sharePreview). */
export type MessageSharePayload = {
  contentType:
    | "post"
    | "review"
    | "book"
    | "club"
    | "reading_list"
    | "reading_dna"
    | "author"
    | "profile"
    | "activity";
  contentId: string;
  snapshot: {
    title: string;
    subtitle?: string | null;
    description?: string | null;
    thumbnailUrl?: string | null;
    posterName?: string | null;
    posterAvatarUrl?: string | null;
    rating?: number | null;
    tags?: string[];
    timestamp?: string | null;
    spoiler?: boolean;
    edited?: boolean;
    destinationPath: string;
  };
};

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachment_url: string | null;
  reply_to_id: string | null;
  share_payload: MessageSharePayload | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export type MessageReactionSummary = {
  emoji: string;
  count: number;
  user_ids: string[];
  viewer_reacted: boolean;
};

export type MessageReplyPreview = {
  id: string;
  sender_id: string;
  body: string;
  attachment_url: string | null;
  deleted_at: string | null;
  sender: MessageProfile;
};

export type ConversationParticipantWithProfile = ConversationParticipant & {
  profile: MessageProfile;
};

export type ConversationWithParticipants = Conversation & {
  participants: ConversationParticipantWithProfile[];
  viewerPinnedAt?: string | null;
};

export type MessageWithSender = Message & {
  sender: MessageProfile;
  reply_to?: MessageReplyPreview | null;
  reactions?: MessageReactionSummary[];
};

export type ConversationPreview = Conversation & {
  participants: ConversationParticipantWithProfile[];
  latestMessage: Message | null;
  unreadCount: number;
  pinnedAt: string | null;
};

export type NotificationType = "message" | "follow" | "feed" | "club";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  actor_id: string | null;
  link_url: string | null;
  metadata_json: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export type NotificationWithActor = Notification & {
  actor: MessageProfile | null;
};

export type NotificationPreferences = {
  notify_messages: boolean;
  notify_follows: boolean;
  notify_feed: boolean;
  notify_likes: boolean;
  notify_comments: boolean;
  notify_mentions: boolean;
  notify_clubs: boolean;
  notify_browser: boolean;
};

export type PostAuthor = MessageProfile;

export interface Post {
  id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  book_id: string | null;
  repost_of_post_id: string | null;
  moderation_meta?: ModerationMeta | null;
  created_at: string;
  updated_at: string;
}

export interface PostDraft {
  id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  book_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  attachment_url: string | null;
  moderation_meta?: ModerationMeta | null;
  created_at: string;
  updated_at: string;
}

export type PostCommentWithAuthor = PostComment & {
  author: PostAuthor;
};

export type PostWithAuthor = Post & {
  author: PostAuthor;
  book?: {
    id: string;
    title: string;
    author: string | null;
    cover_url: string | null;
  } | null;
  repost_of?: PostWithAuthor | null;
  like_count: number;
  comment_count: number;
  viewer_has_liked: boolean;
  viewer_has_reposted: boolean;
  comments?: PostCommentWithAuthor[];
};

export type BookClubVisibility = "public" | "private" | "invite_only";

export type BookClubJoinPolicy = "open" | "request_approval" | "invitation_only";

export type BookClubStatus = "active" | "archived";

export type BookClubMemberRole = "owner" | "host" | "moderator" | "member";

export type BookClubMembershipStatus =
  | "active"
  | "invited"
  | "requested"
  | "declined"
  | "removed"
  | "left"
  | "banned";

export type BookClubInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "canceled";

export type BookClubJoinRequestStatus =
  | "pending"
  | "approved"
  | "declined"
  | "canceled";

export type BookClubEventType =
  | "reading_deadline"
  | "discussion"
  | "meeting"
  | "readathon"
  | "announcement"
  | "other";

export type BookClubMeetingPlatform =
  | "zoom"
  | "google_meet"
  | "microsoft_teams"
  | "other";

export type BookClubRsvpStatus = "going" | "maybe" | "not_going";

export type BookClubBookCategory =
  | "current_read"
  | "upcoming"
  | "previous"
  | "suggested"
  | "optional";

export type BookClubNotificationLevel = "all" | "important" | "mentions" | "off";

/** Lightweight book summary used across club UI (current book, discussion attach). */
export type BookClubBook = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
};

export interface BookClub {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  moderation_meta?: ModerationMeta | null;
  image_url: string | null;
  banner_url: string | null;
  current_book_id: string | null;
  visibility: BookClubVisibility;
  join_policy: BookClubJoinPolicy;
  status: BookClubStatus;
  genre_tags: string[];
  meeting_frequency: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface BookClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: BookClubMemberRole;
  membership_status: BookClubMembershipStatus;
  invited_by: string | null;
  joined_at: string;
  updated_at: string;
}

export type BookClubMemberWithProfile = BookClubMember & {
  profile: MessageProfile;
};

/** @deprecated Use BookClubDiscussion — kept for feed moderation content_type compat naming. */
export interface BookClubPost {
  id: string;
  club_id: string;
  user_id: string;
  body: string;
  book_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookClubDiscussion {
  id: string;
  club_id: string;
  user_id: string;
  created_by: string;
  title: string;
  body: string;
  moderation_meta?: ModerationMeta | null;
  book_id: string | null;
  related_book_id: string | null;
  chapter_reference: string | null;
  page_reference: string | null;
  contains_spoilers: boolean;
  is_pinned: boolean;
  is_locked: boolean;
  reply_count: number;
  latest_activity_at: string;
  created_at: string;
  updated_at: string;
}

export type BookClubDiscussionWithAuthor = BookClubDiscussion & {
  author: PostAuthor;
  book?: BookClubBook | null;
};

export type BookClubPostWithAuthor = BookClubPost & {
  author: PostAuthor;
  book?: BookClubBook | null;
};

export interface BookClubDiscussionReply {
  id: string;
  discussion_id: string;
  club_id: string;
  user_id: string;
  body: string;
  contains_spoilers: boolean;
  moderation_meta?: ModerationMeta | null;
  created_at: string;
  updated_at: string;
}

export type BookClubDiscussionReplyWithAuthor = BookClubDiscussionReply & {
  author: PostAuthor;
};

export interface BookClubInvitation {
  id: string;
  club_id: string;
  inviter_id: string;
  invitee_id: string;
  message: string | null;
  status: BookClubInvitationStatus;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

export type BookClubInvitationWithDetails = BookClubInvitation & {
  club: Pick<BookClub, "id" | "name" | "image_url" | "visibility" | "description">;
  inviter: MessageProfile;
};

export interface BookClubJoinRequest {
  id: string;
  club_id: string;
  user_id: string;
  message: string | null;
  status: BookClubJoinRequestStatus;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

export type BookClubJoinRequestWithDetails = BookClubJoinRequest & {
  club?: Pick<BookClub, "id" | "name" | "image_url">;
  requester: MessageProfile;
};

/** A club annotated with membership/count info for the viewer (discover + lists). */
export type BookClubSummary = BookClub & {
  viewer_is_member: boolean;
  viewer_role: BookClubMemberRole | null;
  current_book?: BookClubBook | null;
  latest_activity_at?: string | null;
  next_event_at?: string | null;
};

export type BookClubWithDetails = BookClubSummary & {
  members: BookClubMemberWithProfile[];
};

export interface BookClubEvent {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  description: string | null;
  location: string | null;
  meeting_url: string | null;
  event_type: BookClubEventType;
  timezone: string;
  reading_assignment: string | null;
  meeting_platform: BookClubMeetingPlatform | null;
  reminder_config: Record<string, unknown>;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BookClubEventWithClub = BookClubEvent & {
  club: Pick<BookClub, "id" | "name" | "visibility">;
  viewer_rsvp?: BookClubRsvpStatus | null;
  rsvp_counts?: Partial<Record<BookClubRsvpStatus, number>>;
};

export interface BookClubEventAttendee {
  id: string;
  event_id: string;
  club_id: string;
  user_id: string;
  rsvp_status: BookClubRsvpStatus;
  reminder_at: string | null;
  reminder_canceled: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookClubAnnouncement {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  body: string;
  linked_event_id: string | null;
  related_book_id: string | null;
  is_pinned: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export type BookClubAnnouncementWithAuthor = BookClubAnnouncement & {
  author: MessageProfile;
};

export interface BookClubShelfBook {
  id: string;
  club_id: string;
  book_id: string;
  category: BookClubBookCategory;
  added_by: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  book?: BookClubBook | null;
}

export interface BookClubCurrentRead {
  id: string;
  club_id: string;
  book_id: string;
  started_at: string | null;
  target_finish_at: string | null;
  chapters_assigned: string | null;
  pages_assigned: string | null;
  is_current: boolean;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  book?: BookClubBook | null;
}

export interface BookClubSettings {
  club_id: string;
  allow_member_suggestions: boolean;
  hosts_can_approve_requests: boolean;
  default_notification_level: BookClubNotificationLevel;
  created_at: string;
  updated_at: string;
}

export interface BookClubStats {
  total_members: number;
  active_members: number;
  discussions_created: number;
  replies_posted: number;
  events_created: number;
  rsvp_participation: number;
  books_completed: number;
  member_growth_30d: number;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  shelf_status: ShelfStatus;
  progress_pages: number;
  progress_percent: number;
  /** Reader-owned page count for their selected edition. */
  total_pages?: number | null;
  /** Reader-owned format for this edition. Catalog `books.format` is fallback only. */
  tracking_format?: "book" | "audiobook" | null;
  listening_progress_seconds?: number;
  /** Reader-owned audiobook length in seconds. Catalog duration is fallback only. */
  audiobook_duration_seconds?: number | null;
  started_at: string | null;
  finished_at: string | null;
  rating: number | null;
  is_favorite: boolean;
  read_count: number;
  completion_tags: string[];
  /** Reader explicitly marked this book as did-not-finish (a real DNF state). */
  dnf: boolean;
  /** Target/expected date the reader plans to read this book ("Date to Read"). */
  expected_read_date: string | null;
  created_at: string;
  updated_at: string;
  books?: Book;
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
  visibility: ReviewVisibility;
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

export type ContentReaction = "like" | "dislike";

export type ReactionCounts = {
  like_count: number;
  dislike_count: number;
  viewer_reaction: ContentReaction | null;
};

export type ReviewReply = {
  id: string;
  review_id: string;
  user_id: string;
  parent_reply_id: string | null;
  body: string;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewReplyWithAuthor = ReviewReply & {
  author: PostAuthor;
};

export type PostCommentReply = {
  id: string;
  comment_id: string;
  user_id: string;
  parent_reply_id: string | null;
  body: string;
  attachment_url: string | null;
  moderation_meta?: ModerationMeta | null;
  created_at: string;
  updated_at: string;
};

export type PostCommentReplyWithAuthor = PostCommentReply & {
  author: PostAuthor;
};

export type PageCountStatus = "known" | "user_entered" | "missing";

export type PageCountSource = "edition" | "canonical_book" | "user" | "unavailable";

export interface ReadingSession {
  id: string;
  user_id: string;
  user_book_id: string;
  page_start: number;
  page_end: number;
  pages_read: number;
  percent_complete: number;
  note: string | null;
  mood: string | null;
  read_number: number;
  total_pages: number | null;
  page_count_status: PageCountStatus | null;
  page_count_source: PageCountSource | null;
  edition_id: string | null;
  completed_at: string | null;
  session_format?: "book" | "audiobook";
  listening_start_seconds?: number | null;
  listening_end_seconds?: number | null;
  listening_seconds?: number | null;
  created_at: string;
}

export type BuiltinReadingNoteCategory =
  | "favorite_quote"
  | "character_development"
  | "important_plot_point"
  | "theory"
  | "favorite_scene"
  | "emotional_moment"
  | "general_note";

export type ReadingNoteCategory = BuiltinReadingNoteCategory | `custom:${string}`;

export interface UserReadingNoteCategory {
  id: string;
  user_id: string;
  label: string;
  emoji: string | null;
  created_at: string;
}

export type ReadingNoteVisibility = "private" | "friends_only" | "public";

export interface ReadingNote {
  id: string;
  user_id: string;
  user_book_id: string;
  page_number: number | null;
  chapter: string | null;
  title: string | null;
  note: string | null;
  quote: string | null;
  category: ReadingNoteCategory;
  visibility: ReadingNoteVisibility;
  created_at: string;
  updated_at: string;
}

export type ReportableContentType =
  | "post"
  | "comment"
  | "message"
  | "review"
  | "club_post"
  | "club_discussion"
  | "club_reply"
  | "club"
  | "profile";

export type ContentReportReason =
  | "hate_discrimination"
  | "harassment_bullying"
  | "threats_violence"
  | "sexual_inappropriate"
  | "spam"
  | "impersonation"
  | "other"
  /** @deprecated Use harassment_bullying */
  | "harassment"
  /** @deprecated Use sexual_inappropriate */
  | "inappropriate"
  /** @deprecated Use hate_discrimination */
  | "hate_speech";

export type ContentReportStatus =
  | "pending"
  | "reviewing"
  | "resolved"
  | "dismissed"
  /** @deprecated Use resolved */
  | "reviewed"
  /** @deprecated Use resolved */
  | "actioned";

export interface ContentReport {
  id: string;
  reporter_id: string;
  content_type: ReportableContentType;
  content_id: string;
  reported_user_id: string | null;
  reason: ContentReportReason;
  details: string | null;
  status: ContentReportStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface UserBlock {
  blocker_id: string;
  blocked_id: string;
  report_id: string | null;
  created_at: string;
}
