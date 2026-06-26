import { createClient } from "@/lib/supabase/client";
import type {
  ConversationPreview,
  ConversationWithParticipants,
  Message,
  MessageProfile,
  MessageWithSender,
} from "@/types";

const PROFILE_SELECT = "id, username, display_name, avatar_url";

type ParticipantRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  last_read_at: string | null;
  profiles: MessageProfile | null;
};

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be signed in.");
  return { supabase, user };
}

function mapParticipant(row: ParticipantRow) {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    user_id: row.user_id,
    role: row.role,
    joined_at: row.joined_at,
    last_read_at: row.last_read_at,
    profile: row.profiles ?? {
      id: row.user_id,
      username: null,
      display_name: null,
      avatar_url: null,
    },
  };
}

async function fetchParticipantsForConversations(
  supabase: ReturnType<typeof createClient>,
  conversationIds: string[]
) {
  if (!conversationIds.length) return new Map<string, ReturnType<typeof mapParticipant>[]>();

  const { data, error } = await supabase
    .from("conversation_participants")
    .select(
      `id, conversation_id, user_id, role, joined_at, last_read_at, profiles!conversation_participants_user_id_profiles_fkey (${PROFILE_SELECT})`
    )
    .in("conversation_id", conversationIds);

  if (error) throw error;

  const map = new Map<string, ReturnType<typeof mapParticipant>[]>();
  for (const row of (data ?? []) as unknown as ParticipantRow[]) {
    const mapped = mapParticipant(row);
    const list = map.get(row.conversation_id) ?? [];
    list.push(mapped);
    map.set(row.conversation_id, list);
  }

  return map;
}

async function findExistingDirectConversation(
  supabase: ReturnType<typeof createClient>,
  userA: string,
  userB: string
): Promise<string | null> {
  const { data: myRows, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userA);

  if (error) throw error;

  const conversationIds = (myRows ?? []).map((row) => row.conversation_id);
  if (!conversationIds.length) return null;

  const { data: directConversations, error: directError } = await supabase
    .from("conversations")
    .select("id")
    .in("id", conversationIds)
    .eq("type", "direct");

  if (directError) throw directError;

  for (const conversation of directConversations ?? []) {
    const { data: participants, error: participantsError } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversation.id);

    if (participantsError) throw participantsError;

    const userIds = (participants ?? []).map((p) => p.user_id).sort();
    if (userIds.length === 2 && userIds.includes(userA) && userIds.includes(userB)) {
      return conversation.id;
    }
  }

  return null;
}

function countUnread(
  messages: Message[],
  lastReadAt: string | null,
  currentUserId: string
): number {
  const lastRead = lastReadAt ? new Date(lastReadAt).getTime() : 0;

  return messages.filter((message) => {
    if (message.sender_id === currentUserId) return false;
    if (message.deleted_at) return false;
    return new Date(message.created_at).getTime() > lastRead;
  }).length;
}

export async function searchProfilesForMessaging(
  query: string,
  excludeUserId: string
): Promise<MessageProfile[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = createClient();
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

export async function getConversations(userId: string): Promise<ConversationPreview[]> {
  const supabase = createClient();

  const { data: memberships, error: membershipError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);

  if (membershipError) throw membershipError;

  const conversationIds = (memberships ?? []).map((row) => row.conversation_id);
  if (!conversationIds.length) return [];

  const lastReadByConversation = new Map(
    (memberships ?? []).map((row) => [row.conversation_id, row.last_read_at])
  );

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("*")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  if (conversationsError) throw conversationsError;

  const participantsByConversation = await fetchParticipantsForConversations(
    supabase,
    conversationIds
  );

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

  return ((conversations ?? []) as ConversationPreview[]).map((conversation) => {
    const participants = participantsByConversation.get(conversation.id) ?? [];
    const latestMessage = latestByConversation.get(conversation.id) ?? null;
    const lastReadAt = lastReadByConversation.get(conversation.id) ?? null;
    const unreadCount = countUnread(
      messagesByConversation.get(conversation.id) ?? [],
      lastReadAt,
      userId
    );

    return {
      ...conversation,
      participants,
      latestMessage,
      unreadCount,
    };
  });
}

export async function getConversation(
  conversationId: string,
  userId: string
): Promise<ConversationWithParticipants | null> {
  const supabase = createClient();

  const { data: membership, error: membershipError } = await supabase
    .from("conversation_participants")
    .select("id")
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

  const participantsByConversation = await fetchParticipantsForConversations(supabase, [
    conversationId,
  ]);

  return {
    ...(conversation as ConversationWithParticipants),
    participants: participantsByConversation.get(conversationId) ?? [],
  };
}

export async function getMessages(conversationId: string): Promise<MessageWithSender[]> {
  const supabase = createClient();

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
  body: string
): Promise<{ message?: Message; error?: string }> {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Message cannot be empty." };

  try {
    const { supabase, user } = await requireUser();

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
    return {
      error: error instanceof Error ? error.message : "Could not send message.",
    };
  }
}

export async function deleteMessage(messageId: string): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser();

    const { error } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId)
      .eq("sender_id", user.id);

    if (error) return { error: error.message };
    return {};
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not delete message.",
    };
  }
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { supabase, user } = await requireUser();

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
    const { supabase, user } = await requireUser();

    if (user.id === targetUserId) {
      return { error: "You cannot message yourself." };
    }

    const existing = await findExistingDirectConversation(supabase, user.id, targetUserId);
    if (existing) return { conversationId: existing };

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (!targetProfile) return { error: "Reader not found." };

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        type: "direct",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      return { error: conversationError?.message ?? "Could not start conversation." };
    }

    const { error: participantsError } = await supabase.from("conversation_participants").insert([
      { conversation_id: conversation.id, user_id: user.id, role: "member" },
      { conversation_id: conversation.id, user_id: targetUserId, role: "member" },
    ]);

    if (participantsError) {
      return { error: participantsError.message };
    }

    return { conversationId: conversation.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not start conversation.",
    };
  }
}

export async function createGroupConversation(
  title: string,
  userIds: string[]
): Promise<{ conversationId?: string; error?: string }> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { error: "Group name is required." };

  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  try {
    const { supabase, user } = await requireUser();

    const memberIds = uniqueIds.filter((id) => id !== user.id);
    if (memberIds.length < 2) {
      return { error: "Select at least two other readers for a group chat." };
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .in("id", memberIds);

    if (profilesError) return { error: profilesError.message };
    if ((profiles ?? []).length !== memberIds.length) {
      return { error: "One or more selected readers were not found." };
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        type: "group",
        title: trimmedTitle,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (conversationError || !conversation) {
      return { error: conversationError?.message ?? "Could not create group." };
    }

    const rows = [
      { conversation_id: conversation.id, user_id: user.id, role: "owner" as const },
      ...memberIds.map((memberId) => ({
        conversation_id: conversation.id,
        user_id: memberId,
        role: "member" as const,
      })),
    ];

    const { error: participantsError } = await supabase
      .from("conversation_participants")
      .insert(rows);

    if (participantsError) {
      return { error: participantsError.message };
    }

    return { conversationId: conversation.id };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create group.",
    };
  }
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
    other.profile.display_name?.trim() ||
    other.profile.username?.trim() ||
    "Reader"
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
