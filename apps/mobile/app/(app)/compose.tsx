import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Avatar } from "../../src/components/Avatar";
import { GifPicker } from "../../src/components/GifPicker";
import { RepostPreview } from "../../src/components/RepostPreview";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { createPost, getPostById, repostPost } from "../../src/services/posts";
import { deleteDraft, listDrafts, saveDraft } from "../../src/services/postDrafts";
import { searchProfiles, type ProfileSearchResult } from "../../src/services/profile";
import { pickImageFromLibrary, uploadPostImage } from "../../src/services/storage";
import { activeMentionQuery } from "../../src/utils/mentions";
import { useAuthStore } from "../../src/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import type { PostDraft, PostWithAuthor } from "../../src/types";

const MAX = 1000;

export default function ComposeRoute() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { repostOf } = useLocalSearchParams<{ repostOf?: string }>();
  const viewerId = useAuthStore((s) => s.user?.id);

  const [body, setBody] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [gifOpen, setGifOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [original, setOriginal] = useState<PostWithAuthor | null>(null);

  const [mentionResults, setMentionResults] = useState<ProfileSearchResult[]>([]);
  const mentionDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isQuote = Boolean(repostOf);

  useEffect(() => {
    if (!repostOf) return;
    let active = true;
    getPostById(String(repostOf), viewerId ?? "").then((p) => active && setOriginal(p));
    return () => {
      active = false;
    };
  }, [repostOf, viewerId]);

  useEffect(() => {
    listDrafts().then(setDrafts);
  }, []);

  const mentionQuery = useMemo(
    () => activeMentionQuery(body.slice(0, selection.start)),
    [body, selection.start]
  );

  useEffect(() => {
    if (mentionQuery == null || mentionQuery.length < 1) {
      setMentionResults([]);
      return;
    }
    if (mentionDebounce.current) clearTimeout(mentionDebounce.current);
    mentionDebounce.current = setTimeout(() => {
      searchProfiles(mentionQuery, undefined, 6)
        .then(setMentionResults)
        .catch(() => setMentionResults([]));
    }, 250);
    return () => {
      if (mentionDebounce.current) clearTimeout(mentionDebounce.current);
    };
  }, [mentionQuery]);

  function insertMention(username: string) {
    const before = body.slice(0, selection.start);
    const after = body.slice(selection.start);
    const replacedBefore = before.replace(/@([a-zA-Z0-9_]*)$/, `@${username} `);
    setBody((replacedBefore + after).slice(0, MAX));
    setMentionResults([]);
  }

  async function attachImage() {
    const result = await pickImageFromLibrary();
    if (result.canceled) return;
    if (result.error || !result.image) {
      Alert.alert("Couldn't attach image", result.error ?? "Please try again.");
      return;
    }
    setUploading(true);
    const upload = await uploadPostImage(result.image);
    setUploading(false);
    if (upload.error || !upload.url) {
      Alert.alert("Upload failed", upload.error ?? "Please try again.");
      return;
    }
    setImageUrl(upload.url);
  }

  const canSubmit = (body.trim().length > 0 || Boolean(imageUrl) || isQuote) && !uploading;

  async function share() {
    if (!canSubmit) return;
    setSaving(true);
    const result = isQuote
      ? await repostPost(String(repostOf), { body, imageUrl })
      : await createPost({ body, imageUrl });
    setSaving(false);
    if (result.error) {
      Alert.alert("Couldn't post", result.error);
      return;
    }
    if (draftId) await deleteDraft(draftId);
    queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    router.replace("/feed");
  }

  async function persistDraft() {
    if (!body.trim() && !imageUrl) {
      Alert.alert("Nothing to save", "Add some text or an image first.");
      return;
    }
    setSaving(true);
    const result = await saveDraft({ id: draftId, body, imageUrl });
    setSaving(false);
    if (result.error || !result.draft) {
      Alert.alert("Couldn't save draft", result.error ?? "Please try again.");
      return;
    }
    setDraftId(result.draft.id);
    setDrafts(await listDrafts());
    Alert.alert("Draft saved", "You can finish this post later.");
  }

  function resumeDraft(draft: PostDraft) {
    setDraftId(draft.id);
    setBody(draft.body);
    setImageUrl(draft.image_url);
    setDraftsOpen(false);
  }

  async function removeDraft(id: string) {
    await deleteDraft(id);
    setDrafts(await listDrafts());
    if (draftId === id) setDraftId(null);
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={isQuote ? "Quote post" : "Create"}
        right={
          !isQuote ? (
            <Pressable onPress={() => setDraftsOpen((v) => !v)} className="px-2 active:opacity-70">
              <Text className="text-sm font-medium text-puce-red">
                Drafts{drafts.length ? ` (${drafts.length})` : ""}
              </Text>
            </Pressable>
          ) : null
        }
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {draftsOpen && drafts.length ? (
            <View className="rounded-2xl border border-brand-border bg-surface p-3">
              <Text className="mb-2 text-sm font-semibold text-puce-red">Saved drafts</Text>
              {drafts.map((draft) => (
                <View
                  key={draft.id}
                  className="mb-1 flex-row items-center gap-2 rounded-xl bg-primary/10 p-2"
                >
                  <Pressable className="flex-1" onPress={() => resumeDraft(draft)}>
                    <Text className="text-sm text-ink" numberOfLines={2}>
                      {draft.body || "(image only)"}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => removeDraft(draft.id)}>
                    <Text className="text-xs text-rust">Delete</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <View className="rounded-2xl border border-brand-border bg-surface p-4">
            <Text className="mb-2 text-sm font-semibold text-puce-red">
              {isQuote ? "Add your thoughts" : "Share a post"}
            </Text>
            <TextInput
              value={body}
              onChangeText={(t) => setBody(t.slice(0, MAX))}
              onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              placeholder={isQuote ? "Say something about this…" : "What are you reading?"}
              placeholderTextColor="#A99DAE"
              multiline
              className="min-h-[110px] rounded-xl border border-brand-border bg-background px-3 py-3 text-base text-ink"
              style={{ textAlignVertical: "top" }}
            />

            {mentionResults.length ? (
              <View className="mt-1 rounded-xl border border-brand-border bg-surface">
                {mentionResults.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => insertMention(p.username ?? "")}
                    disabled={!p.username}
                    className="flex-row items-center gap-2 border-b border-brand-border px-3 py-2 active:bg-primary/10"
                  >
                    <Avatar url={p.avatar_url} name={p.display_name ?? p.username ?? ""} size={24} />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-ink">
                        {p.display_name?.trim() || p.username}
                      </Text>
                      {p.username ? (
                        <Text className="text-xs text-ink-muted">@{p.username}</Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {imageUrl ? (
              <View className="mt-3">
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: "100%", height: 200, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => setImageUrl(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1"
                >
                  <Text className="text-xs font-semibold text-white">Remove</Text>
                </Pressable>
              </View>
            ) : null}

            {isQuote && original ? <RepostPreview original={original} /> : null}

            <View className="mt-3 flex-row items-center gap-3">
              <Pressable
                onPress={attachImage}
                disabled={uploading || Boolean(imageUrl)}
                className="h-10 w-10 items-center justify-center rounded-full bg-primary/15 active:opacity-70"
              >
                {uploading ? <ActivityIndicator color="#642F37" /> : <Text>🖼️</Text>}
              </Pressable>
              <Pressable
                onPress={() => setGifOpen(true)}
                disabled={Boolean(imageUrl)}
                className="h-10 items-center justify-center rounded-full bg-primary/15 px-3 active:opacity-70"
              >
                <Text className="text-xs font-bold text-puce-red">GIF</Text>
              </Pressable>
              <View className="flex-1" />
              <Text className="text-xs text-ink-muted">
                {body.length}/{MAX}
              </Text>
            </View>

            <View className="mt-3 flex-row gap-2">
              {!isQuote ? (
                <Pressable
                  onPress={persistDraft}
                  disabled={saving}
                  className="flex-1 items-center justify-center rounded-xl border border-brand-border py-3 active:opacity-70"
                >
                  <Text className="font-semibold text-puce-red">Save draft</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={share}
                disabled={!canSubmit || saving}
                className={`flex-1 items-center justify-center rounded-xl py-3 ${
                  canSubmit ? "bg-puce-red" : "bg-primary/40"
                }`}
              >
                <Text className="font-semibold text-white">
                  {saving ? "…" : isQuote ? "Repost" : "Share"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <GifPicker visible={gifOpen} onClose={() => setGifOpen(false)} onSelect={setImageUrl} />
    </View>
  );
}
