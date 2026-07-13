import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { AttachmentImage } from "./AttachmentImage";
import { GifPicker } from "./GifPicker";
import { MentionText } from "./MentionText";
import {
  addComment,
  deleteComment,
  listPostComments,
} from "../services/posts";
import {
  addPostCommentReply,
  deletePostCommentReply,
  dislikePostComment,
  getPostCommentReactionCounts,
  likePostComment,
  listPostCommentReplies,
  removePostCommentReaction,
  type ReplyNode,
} from "../services/postCommentEngagement";
import { pickImageFromLibrary, uploadCommentAttachment } from "../services/storage";
import { useAuthStore } from "../store/authStore";
import { timeAgo } from "../utils";
import type { PostCommentWithAuthor, ReactionCounts } from "../types";

type Props = {
  postId: string;
  visible: boolean;
  onClose: () => void;
  onChanged?: () => void;
};

type ReplyTarget = { commentId: string; parentReplyId: string | null; label: string } | null;

function authorName(a: { display_name: string | null; username: string | null }): string {
  return a.display_name?.trim() || a.username?.trim() || "Reader";
}

export function PostCommentsSheet({ postId, visible, onClose, onChanged }: Props) {
  const insets = useSafeAreaInsets();
  const viewerId = useAuthStore((s) => s.user?.id);
  const [comments, setComments] = useState<PostCommentWithAuthor[]>([]);
  const [reactions, setReactions] = useState<Map<string, ReactionCounts>>(new Map());
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, ReplyNode[]>>({});
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [gifOpen, setGifOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await listPostComments(postId);
    setComments(list);
    if (list.length) {
      const counts = await getPostCommentReactionCounts(
        list.map((c) => c.id),
        viewerId ?? null
      );
      setReactions(counts);
    } else {
      setReactions(new Map());
    }
    setLoading(false);
  }, [postId, viewerId]);

  useEffect(() => {
    if (visible) {
      setBody("");
      setAttachment(null);
      setReplyTarget(null);
      setExpanded({});
      void reload();
    }
  }, [visible, reload]);

  async function loadReplies(commentId: string) {
    if (expanded[commentId]) {
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      return;
    }
    const replies = await listPostCommentReplies(commentId);
    setExpanded((prev) => ({ ...prev, [commentId]: replies }));
  }

  async function attachImage() {
    const result = await pickImageFromLibrary();
    if (result.canceled) return;
    if (result.error || !result.image) {
      Alert.alert("Couldn't attach image", result.error ?? "Please try again.");
      return;
    }
    setUploading(true);
    const upload = await uploadCommentAttachment(result.image);
    setUploading(false);
    if (upload.error || !upload.url) {
      Alert.alert("Upload failed", upload.error ?? "Please try again.");
      return;
    }
    setAttachment(upload.url);
  }

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed && !attachment) return;
    setSending(true);
    const result = replyTarget
      ? await addPostCommentReply(
          replyTarget.commentId,
          trimmed,
          replyTarget.parentReplyId,
          attachment
        )
      : await addComment(postId, trimmed, attachment);
    setSending(false);
    if ("error" in result && result.error) {
      Alert.alert("Couldn't post", result.error);
      return;
    }
    setBody("");
    setAttachment(null);
    const target = replyTarget;
    setReplyTarget(null);
    await reload();
    if (target) {
      const replies = await listPostCommentReplies(target.commentId);
      setExpanded((prev) => ({ ...prev, [target.commentId]: replies }));
    }
    onChanged?.();
  }

  async function toggleReaction(commentId: string, reaction: "like" | "dislike") {
    const current = reactions.get(commentId)?.viewer_reaction ?? null;
    const result =
      current === reaction
        ? await removePostCommentReaction(commentId)
        : reaction === "like"
          ? await likePostComment(commentId)
          : await dislikePostComment(commentId);
    if (result.counts) {
      setReactions((prev) => new Map(prev).set(commentId, result.counts!));
    }
  }

  async function removeComment(commentId: string) {
    const result = await deleteComment(commentId);
    if (result.error) {
      Alert.alert("Couldn't delete", result.error);
      return;
    }
    await reload();
    onChanged?.();
  }

  async function removeReply(commentId: string, replyId: string) {
    const result = await deletePostCommentReply(replyId);
    if (result.error) {
      Alert.alert("Couldn't delete", result.error);
      return;
    }
    const replies = await listPostCommentReplies(commentId);
    setExpanded((prev) => ({ ...prev, [commentId]: replies }));
  }

  function renderReply(commentId: string, node: ReplyNode, depth: number) {
    const mine = node.user_id === viewerId;
    return (
      <View key={node.id} style={{ marginLeft: 12 + depth * 12 }} className="mt-2">
        <View className="flex-row items-center">
          <Avatar url={node.author.avatar_url} name={authorName(node.author)} size={20} />
          <Text className="ml-2 text-xs font-semibold text-ink">{authorName(node.author)}</Text>
          <Text className="ml-2 text-[11px] text-ink-muted">{timeAgo(node.created_at)}</Text>
        </View>
        {node.body ? <MentionText body={node.body} className="mt-1 text-sm text-ink" /> : null}
        {node.attachment_url ? (
          <View className="mt-1 w-40">
            <AttachmentImage url={node.attachment_url} compact />
          </View>
        ) : null}
        <View className="mt-1 flex-row gap-4">
          <Pressable
            onPress={() =>
              setReplyTarget({
                commentId,
                parentReplyId: node.id,
                label: authorName(node.author),
              })
            }
          >
            <Text className="text-xs font-medium text-primary-dark">Reply</Text>
          </Pressable>
          {mine ? (
            <Pressable onPress={() => removeReply(commentId, node.id)}>
              <Text className="text-xs text-rust">Delete</Text>
            </Pressable>
          ) : null}
        </View>
        {node.children.map((child) => renderReply(commentId, child, depth + 1))}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View style={{ maxHeight: "88%" }} className="rounded-t-3xl bg-surface">
          <View className="flex-row items-center justify-between border-b border-brand-border px-4 py-3">
            <Text className="text-base font-bold text-puce-red">Comments</Text>
            <Pressable onPress={onClose} className="active:opacity-70">
              <Text className="text-sm text-ink-muted">Close</Text>
            </Pressable>
          </View>

          {loading ? (
            <View className="py-10">
              <ActivityIndicator color="#642F37" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
              {comments.length === 0 ? (
                <Text className="py-8 text-center text-sm text-ink-muted">
                  No comments yet. Start the conversation.
                </Text>
              ) : (
                comments.map((comment) => {
                  const counts = reactions.get(comment.id);
                  const mine = comment.user_id === viewerId;
                  const replies = expanded[comment.id];
                  return (
                    <View key={comment.id} className="mb-4 border-b border-brand-border pb-3">
                      <View className="flex-row items-center">
                        <Avatar
                          url={comment.author.avatar_url}
                          name={authorName(comment.author)}
                          size={26}
                        />
                        <Text className="ml-2 text-sm font-semibold text-ink">
                          {authorName(comment.author)}
                        </Text>
                        <Text className="ml-2 text-[11px] text-ink-muted">
                          {timeAgo(comment.created_at)}
                        </Text>
                      </View>
                      {comment.body ? (
                        <MentionText body={comment.body} className="mt-1 text-sm text-ink" />
                      ) : null}
                      {comment.attachment_url ? (
                        <View className="mt-2 w-48">
                          <AttachmentImage url={comment.attachment_url} compact />
                        </View>
                      ) : null}
                      <View className="mt-2 flex-row items-center gap-5">
                        <Pressable
                          className="flex-row items-center gap-1"
                          onPress={() => toggleReaction(comment.id, "like")}
                        >
                          <Text>{counts?.viewer_reaction === "like" ? "👍" : "👍🏻"}</Text>
                          <Text className="text-xs text-ink-muted">{counts?.like_count ?? 0}</Text>
                        </Pressable>
                        <Pressable
                          className="flex-row items-center gap-1"
                          onPress={() => toggleReaction(comment.id, "dislike")}
                        >
                          <Text style={{ opacity: counts?.viewer_reaction === "dislike" ? 1 : 0.5 }}>
                            👎
                          </Text>
                          <Text className="text-xs text-ink-muted">
                            {counts?.dislike_count ?? 0}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            setReplyTarget({
                              commentId: comment.id,
                              parentReplyId: null,
                              label: authorName(comment.author),
                            })
                          }
                        >
                          <Text className="text-xs font-medium text-primary-dark">Reply</Text>
                        </Pressable>
                        {mine ? (
                          <Pressable onPress={() => removeComment(comment.id)}>
                            <Text className="text-xs text-rust">Delete</Text>
                          </Pressable>
                        ) : null}
                      </View>

                      <Pressable onPress={() => loadReplies(comment.id)} className="mt-2">
                        <Text className="text-xs font-medium text-ink-muted">
                          {replies ? "Hide replies" : "View replies"}
                        </Text>
                      </Pressable>
                      {replies?.map((node) => renderReply(comment.id, node, 0))}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Composer */}
          <View
            className="border-t border-brand-border px-3 pt-2"
            style={{ paddingBottom: insets.bottom + 8 }}
          >
            {replyTarget ? (
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-xs text-ink-muted">Replying to {replyTarget.label}</Text>
                <Pressable onPress={() => setReplyTarget(null)}>
                  <Text className="text-xs text-rust">Cancel</Text>
                </Pressable>
              </View>
            ) : null}
            {attachment ? (
              <View className="mb-2 flex-row items-center gap-2">
                <Image
                  source={{ uri: attachment }}
                  style={{ width: 56, height: 56, borderRadius: 8 }}
                />
                <Pressable onPress={() => setAttachment(null)}>
                  <Text className="text-xs text-rust">Remove</Text>
                </Pressable>
              </View>
            ) : null}
            <View className="flex-row items-end gap-2">
              <Pressable
                onPress={attachImage}
                disabled={uploading || Boolean(attachment)}
                className="h-10 w-10 items-center justify-center rounded-full bg-primary/15 active:opacity-70"
              >
                <Text className="text-base">🖼️</Text>
              </Pressable>
              <Pressable
                onPress={() => setGifOpen(true)}
                disabled={Boolean(attachment)}
                className="h-10 items-center justify-center rounded-full bg-primary/15 px-3 active:opacity-70"
              >
                <Text className="text-xs font-bold text-puce-red">GIF</Text>
              </Pressable>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder={replyTarget ? "Write a reply…" : "Add a comment…"}
                placeholderTextColor="#A99DAE"
                multiline
                className="max-h-24 flex-1 rounded-2xl border border-brand-border bg-background px-3 py-2 text-sm text-ink"
              />
              <Pressable
                onPress={submit}
                disabled={sending || uploading || (!body.trim() && !attachment)}
                className={`h-10 items-center justify-center rounded-full px-4 ${
                  body.trim() || attachment ? "bg-puce-red" : "bg-primary/40"
                }`}
              >
                <Text className="font-semibold text-white">{uploading ? "…" : "Send"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <GifPicker visible={gifOpen} onClose={() => setGifOpen(false)} onSelect={setAttachment} />
    </Modal>
  );
}
