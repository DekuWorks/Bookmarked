export type ShelfStatus = "want_to_read" | "currently_reading" | "read";

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
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  favorite_genres: string[] | null;
  preferred_library_view: LibraryViewMode;
  yearly_reading_goal: number | null;
  shelf_visibility_want_to_read: ShelfVisibility;
  shelf_visibility_currently_reading: ShelfVisibility;
  shelf_visibility_read: ShelfVisibility;
  notify_messages: boolean;
  notify_follows: boolean;
  notify_feed: boolean;
  notify_browser: boolean;
  preferred_language: PreferredLanguage;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  external_source: string | null;
  external_id: string | null;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  page_count: number | null;
  published_date: string | null;
  isbn: string | null;
  publisher: string | null;
  subjects: string[] | null;
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

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type ConversationParticipantWithProfile = ConversationParticipant & {
  profile: MessageProfile;
};

export type ConversationWithParticipants = Conversation & {
  participants: ConversationParticipantWithProfile[];
  viewerPinnedAt?: string | null;
};

export type MessageWithSender = Message & {
  sender: MessageProfile;
};

export type ConversationPreview = Conversation & {
  participants: ConversationParticipantWithProfile[];
  latestMessage: Message | null;
  unreadCount: number;
  pinnedAt: string | null;
};

export type NotificationType = "message" | "follow" | "feed";

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
  created_at: string;
  updated_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
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
  created_at: string;
  updated_at: string;
};

export type PostCommentReplyWithAuthor = PostCommentReply & {
  author: PostAuthor;
};
