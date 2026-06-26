export type ShelfStatus = "want_to_read" | "currently_reading" | "read";

export type LibraryViewMode = "bookshelf" | "grid" | "reading_room";

export type ReviewVisibility = "public" | "followers" | "private";

export type ShelfVisibility = "public" | "followers" | "private";

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
