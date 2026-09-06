import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "./Button";
import { StarRatingInput } from "./StarRatingInput";
import { upsertReview, updateReviewVisibility, RATING_EMOJIS } from "../services/reviews";
import type { Review } from "../types";
import { ReviewVisibilityControl } from "./ReviewVisibilityControl";
import {
  parseReviewAudience,
  type ReviewAudience,
} from "../../../../packages/utils/reviewVisibility";

/** Feelings tags exactly as in the rating mockup (IMG_5359). */
const RATING_FEELINGS = [
  "Magical",
  "Enchanted",
  "Melancholic",
  "Joyful",
  "Nostalgic",
  "Mysterious",
  "Romantic",
  "Dark",
  "Whimsical",
];

/**
 * Category rows. Note: the mockup shows "Atmosphere" where the schema stores
 * `world_building`; we surface it as Atmosphere but persist to that column.
 */
const CATEGORIES = [
  { key: "plot", label: "Plot" },
  { key: "characters", label: "Characters" },
  { key: "writingStyle", label: "Writing Style" },
  { key: "worldBuilding", label: "Atmosphere" },
  { key: "pacing", label: "Pacing" },
  { key: "emotionalImpact", label: "Emotional Impact" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

const MAX = 1000;

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  book: { id: string; title: string; author?: string | null; cover_url?: string | null; subjects?: string[] | null };
  userBookId?: string | null;
  existingReview?: Review | null;
  /** Which read this review belongs to (multi-read). Defaults to 1. */
  readNumber?: number;
  onSaved?: () => void;
};

export function RateReviewSheet({
  visible,
  onClose,
  userId,
  book,
  userBookId,
  existingReview,
  readNumber,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [emoji, setEmoji] = useState<string | null>(existingReview?.rating_emoji ?? null);
  const [feelings, setFeelings] = useState<string[]>(existingReview?.feelings ?? []);
  const [body, setBody] = useState(existingReview?.review_body ?? "");
  const [hasSpoilers, setHasSpoilers] = useState(existingReview?.has_spoilers ?? false);
  const [visibility, setVisibility] = useState<ReviewAudience>(
    parseReviewAudience(existingReview?.visibility)
  );
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [categories, setCategories] = useState<Record<CategoryKey, number>>({
    plot: existingReview?.plot ?? 0,
    characters: existingReview?.characters ?? 0,
    writingStyle: existingReview?.writing_style ?? 0,
    worldBuilding: existingReview?.world_building ?? 0,
    pacing: existingReview?.pacing ?? 0,
    emotionalImpact: existingReview?.emotional_impact ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(visible);
  const [hydratedId, setHydratedId] = useState(existingReview?.id ?? null);
  if (visible && (!wasOpen || (existingReview?.id ?? null) !== hydratedId)) {
    setWasOpen(true);
    setHydratedId(existingReview?.id ?? null);
    setRating(existingReview?.rating ?? 0);
    setEmoji(existingReview?.rating_emoji ?? null);
    setFeelings(existingReview?.feelings ?? []);
    setBody(existingReview?.review_body ?? "");
    setHasSpoilers(existingReview?.has_spoilers ?? false);
    setVisibility(parseReviewAudience(existingReview?.visibility));
    setCategories({
      plot: existingReview?.plot ?? 0,
      characters: existingReview?.characters ?? 0,
      writingStyle: existingReview?.writing_style ?? 0,
      worldBuilding: existingReview?.world_building ?? 0,
      pacing: existingReview?.pacing ?? 0,
      emotionalImpact: existingReview?.emotional_impact ?? 0,
    });
  }
  if (!visible && wasOpen) {
    setWasOpen(false);
  }

  function toggleFeeling(feeling: string) {
    setFeelings((prev) =>
      prev.includes(feeling) ? prev.filter((f) => f !== feeling) : [...prev, feeling]
    );
  }

  const hasCategories = Object.values(categories).some((v) => v > 0);

  async function save() {
    setSaving(true);
    const result = await upsertReview(
      userId,
      {
        bookId: book.id,
        userBookId: userBookId ?? null,
        readNumber: existingReview?.read_number ?? readNumber ?? 1,
        rating: rating || null,
        ratingEmoji: emoji,
        reviewBody: body,
        hasSpoilers,
        visibility,
        feelings,
        ratingMode: hasCategories ? "advanced" : "regular",
        plot: categories.plot || null,
        characters: categories.characters || null,
        writingStyle: categories.writingStyle || null,
        worldBuilding: categories.worldBuilding || null,
        pacing: categories.pacing || null,
        emotionalImpact: categories.emotionalImpact || null,
      },
      book
    );
    setSaving(false);
    if (result.error) {
      Alert.alert("Couldn't save review", result.error);
      return;
    }
    onSaved?.();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View className="flex-1 bg-background">
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="flex-row items-center justify-between border-b border-brand-border bg-surface px-4 pb-3"
        >
          <Pressable onPress={onClose} className="active:opacity-70">
            <Text className="text-base text-ink-muted">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-bold text-puce-red">Rate & Review</Text>
          <View className="w-12" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 20 }}>
          <View>
            <Text className="text-lg font-bold text-ink">{book.title}</Text>
            {book.author ? <Text className="text-ink-muted">{book.author}</Text> : null}
          </View>

          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Overall rating
            </Text>
            <View className="flex-row items-center gap-3">
              <StarRatingInput value={rating} onChange={setRating} size={32} />
              <Text className="text-lg font-semibold text-puce-red">
                {rating ? rating.toFixed(1) : ""}
              </Text>
            </View>
          </View>

          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Signature emoji
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {RATING_EMOJIS.map((e) => {
                const selected = emoji === e;
                return (
                  <Pressable
                    key={e}
                    onPress={() => setEmoji((prev) => (prev === e ? null : e))}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className={`h-11 w-11 items-center justify-center rounded-full border-2 ${
                      selected
                        ? "border-puce-red bg-primary/25"
                        : "border-transparent bg-primary/10"
                    }`}
                  >
                    <Text className="text-xl">{e}</Text>
                    {selected ? (
                      <View className="absolute -right-0.5 -top-0.5 h-4 w-4 items-center justify-center rounded-full bg-puce-red">
                        <Text className="text-[9px] font-bold text-white">✓</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
              How did this book make you feel?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {RATING_FEELINGS.map((feeling) => {
                const active = feelings.includes(feeling);
                return (
                  <Pressable
                    key={feeling}
                    onPress={() => toggleFeeling(feeling)}
                    className={`rounded-full px-3 py-2 ${active ? "bg-puce-red" : "bg-primary/15"}`}
                  >
                    <Text className={`text-sm font-medium ${active ? "text-white" : "text-puce-red"}`}>
                      {feeling}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Rate different aspects
            </Text>
            <View className="gap-2">
              {CATEGORIES.map((cat) => (
                <View key={cat.key} className="flex-row items-center justify-between">
                  <Text className="text-ink">{cat.label}</Text>
                  <View className="flex-row items-center gap-2">
                    <StarRatingInput
                      value={categories[cat.key]}
                      onChange={(v) => setCategories((prev) => ({ ...prev, [cat.key]: v }))}
                      size={20}
                    />
                    <Text className="w-8 text-right text-sm text-ink-muted">
                      {categories[cat.key] ? categories[cat.key].toFixed(1) : "–"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
              Review (optional)
            </Text>
            <TextInput
              value={body}
              onChangeText={(t) => setBody(t.slice(0, MAX))}
              placeholder="Share your thoughts…"
              placeholderTextColor="#A99DAE"
              multiline
              className="min-h-[120px] rounded-xl border border-brand-border bg-surface px-3 py-3 text-base text-ink"
              style={{ textAlignVertical: "top" }}
            />
            <Text className="mt-1 text-right text-xs text-ink-muted">
              {body.length}/{MAX}
            </Text>
          </View>

          <View className="flex-row items-center justify-between rounded-xl bg-surface p-3">
            <View className="flex-1 pr-3">
              <Text className="font-medium text-ink">Hide spoilers</Text>
              <Text className="text-xs text-ink-muted">
                Readers tap to reveal your review.
              </Text>
            </View>
            <Switch
              value={hasSpoilers}
              onValueChange={setHasSpoilers}
              trackColor={{ true: "#642F37", false: "#D5C3D7" }}
            />
          </View>

          <ReviewVisibilityControl
            value={visibility}
            disabled={saving || visibilitySaving}
            onChange={(next) => {
              setVisibility(next);
              if (!existingReview?.id || next === visibility) return;
              setVisibilitySaving(true);
              void updateReviewVisibility(existingReview.id, next).then((result) => {
                setVisibilitySaving(false);
                if (result.error) {
                  setVisibility(parseReviewAudience(existingReview.visibility));
                  Alert.alert("Couldn't update visibility", result.error);
                  return;
                }
                onSaved?.();
              });
            }}
          />

          <Button title="Save review" onPress={save} loading={saving} />
        </ScrollView>
      </View>
    </Modal>
  );
}
