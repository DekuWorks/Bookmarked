import { supabase } from "./supabase";
import type {
  ConversationPreview,
  ConversationWithParticipants,
  Message,
  MessageProfile,
  MessageWithSender,
} from "../types";

/**
 * Mobile messages service. Mirrors the web service
 * (apps/web/src/lib/services/messages.ts) against the same `conversations`,
 * `conversation_participants`, and `messages` tables + RLS, using batched
 * `.in(...)` hydration. Group management/attachments are out of scope for the
 * mobile foundation; direct + group threads read + send are supported.
 */

const PROFILE_SELECT = "id, username, display_name, avatar_url";

type ParticipantRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  last_read_at: string | null;
  pinned_at: string | null;
  profiles: MessageProfile | null;
};

async function requireUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("You must be signed in.");
  return user;
}

function mapParticipant(row: ParticipantRow) {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    user_id: row.user_id,
    role: row.role,
    joined_at: row.joined_at,
    last_read_at: row.last_read_at,
    pinned_at: row.pinned_at,
    profile: row.profiles ?? {
      id: row.user_id,
      username: null,
      display_name: null,
      avatar_url: null,
    },
  };
}

async function fetchParticipants(conversationIds: string[]) {
  const map = new Map<string, ReturnType<typeof mapParticipant>[]>();
  if (!conversationIds.length) return map;

  const { data, error } = await supabase
    .from("conversation_participants")
    .select(
      `id, conversation_id, user_id, role, joined_at, last_read_at, pinned_at, profiles!conversation_participants_user_id_profiles_fkey (${PROFILE_SELECT})`
    )
    .in("conversation_id", conversationIds);

  if (error) throw error;

  for (const row of (data ?? []) as unknown as ParticipantRow[]) {
    const list = map.get(row.conversation_id) ?? [];
    list.push(mapParticipant(row));
    map.set(row.conversation_id, list);
  }
  return map;
}

function countUnread(
  messages: Message[],
  lastReadAt: string | null,
  currentUserId: string
): number {
  const lastRead = lastReadAt ? new Date(lastReadAt).getTime() : 0;
  return messages.filter((m) => {
    if (m.sender_id === currentUserId) return false;
    if (m.deleted_at) return false;
    return new Date(m.created_at).getTime() > lastRead;
  }).length;
}

function sortConversations(conversations: ConversationPreview[]): ConversationPreview[] {
  return [...conversations].sort((a, b) => {
    const aPinned = a.pinnedAt ? 1 : 0;
    const bPinned = b.pinnedAt ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    if (a.pinnedAt && b.pinnedAt) {
      return new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime();
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export async function getConversations(userId: string): Promise<ConversationPreview[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at, pinned_at")
    .eq("user_id", userId);

  if (membershipError) throw membershipError;

  const conversationIds = (memberships ?? []).map((row) => row.conversation_id);
  if (!conversationIds.length) return [];

  const lastReadByConversation = new Map(
    (memberships ?? []).map((row) => [row.conversation_id, row.last_read_at])
  );
  const pinnedByConversation = new Map(
    (memberships ?? []).map((row) => [row.conversation_id, row.pinned_at])
  );

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("*")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  if (conversationsError) throw conversationsError;

  const participantsByConversation = await fetchParticipants(conversationIds);

  const { data: allMessages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (messagesError) throw messagesError;

  const latestByConversation = new Map<string, Message>();
  const messagesByConversation = new Map<string, Message[]>();
  for (const message of (allMessages ?? []) as Message[]) {
    if (!latestByConversation.has(message.conversation_id)) {
      latestByConversation.set(message.conversation_id, message);
    }
    const list = messagesByConversation.get(message.conversation_id) ?? [];
    list.push(message);
    messagesByConversation.set(message.conversation_id, list);
  }

  return sortConversations(
    ((conversations ?? []) as ConversationPreview[]).map((conversation) => ({
      ...conversation,
      participants: participantsByConversation.get(conversation.id) ?? [],
      latestMessage: latestByConversation.get(conversation.id) ?? null,
      unreadCount: countUnread(
        messagesByConversation.get(conversation.id) ?? [],
        lastReadByConversation.get(conversation.id) ?? null,
        userId
      ),
      pinnedAt: pinnedByConversation.get(conversation.id) ?? null,
    }))
  );
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const conversations = await getConversations(userId);
  return conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
}

export async function getConversation(
  conversationId: string,
  userId: string
): Promise<ConversationWithParticipants | null> {
  const { data: membership, error: membershipError } = await supabase
    .from("conversation_participants")
    .select("id, pinned_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership) return null;

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError) throw conversationError;
  if (!conversation) return null;

  const participantsByConversation = await fetchParticipants([conversationId]);

  return {
    ...(conversation as ConversationWithParticipants),
    participants: participantsByConversation.get(conversationId) ?? [],
    viewerPinnedAt: membership.pinned_at ?? null,
  };
}

export async function getMessages(conversationId: string): Promise<MessageWithSender[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(`*, profiles!messages_sender_id_profiles_fkey (${PROFILE_SELECT})`)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as Array<Message & { profiles: MessageProfile | null }>).map((row) => ({
    id: row.id,
    conversation_id: row.conversation_id,
    sender_id: row.sender_id,
    body: row.body,
    attachment_url: row.attachment_url ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    sender: row.profiles ?? {
      id: row.sender_id,
      username: null,
      display_name: null,
      avatar_url: null,
    },
  }));
}

export async function sendMessage(
  conversationId: string,
  body: string,
  attachmentUrl?: string | null
): Promise<{ message?: Message; error?: string }> {
  const trimmed = body.trim();
  const attachment = attachmentUrl?.trim() || null;
  if (!trimmed && !attachment) return { error: "Message cannot be empty." };

  try {
    const user = await requireUser();

    const { data: membership } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) return { error: "You are not part of this conversation." };

    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: trimmed,
        attachment_url: attachment,
      })
      .select("*")
      .single();

    if (messageError) return { error: messageError.message };

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    return { message: message as Message };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not send message." };
  }
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const user = await requireUser();
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);
}

export async function createDirectConversation(
  targetUserId: string
): Promise<{ conversationId?: string; error?: string }> {
  try {
    const user = await requireUser();
    if (user.id === targetUserId) return { error: "You cannot message yourself." };

    const { data: myRows } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    const conversationIds = (myRows ?? []).map((row) => row.conversation_id);
    if (conversationIds.length) {
      const { data: directConversations } = await supabase
        .from("conversations")
        .select("id")
        .in("id", conversationIds)
        .eq("type", "direct");

      for (const conversation of directConversations ?? []) {
        const { data: participants } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conversation.id);
        const userIds = (participants ?? []).map((p) => p.user_id);
        if (
          userIds.length === 2 &&
          userIds.includes(user.id) &&
          userIds.includes(targetUserId)
        ) {
          return { conversationId: conversation.id };
        }
      }
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({ type: "direct", created_by: user.id })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      return { error: conversationError?.message ?? "Could not start conversation." };
    }

    const { error: participantsError } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: conversation.id, user_id: user.id, role: "member" },
        { conversation_id: conversation.id, user_id: targetUserId, role: "member" },
      ]);

    if (participantsError) return { error: participantsError.message };
    return { conversationId: conversation.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not start conversation.",
    };
  }
}

export async function searchProfilesForMessaging(
  query: string,
  excludeUserId: string
): Promise<MessageProfile[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const pattern = `%${trimmed.replace(/[%_]/g, "")}%`;
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .neq("id", excludeUserId)
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(12);

  if (error) throw error;
  return (data ?? []) as MessageProfile[];
}

export function conversationDisplayName(
  conversation: Pick<ConversationPreview, "type" | "title" | "participants">,
  currentUserId: string
): string {
  if (conversation.type === "group") {
    return conversation.title?.trim() || "Group chat";
  }
  const other = conversation.participants.find((p) => p.user_id !== currentUserId);
  if (!other) return "Direct message";
  return (
    other.profile.display_name?.trim() || other.profile.username?.trim() || "Reader"
  );
}

export function formatMessageTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
