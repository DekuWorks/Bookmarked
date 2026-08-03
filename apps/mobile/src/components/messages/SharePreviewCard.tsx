import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Avatar } from "../Avatar";
import { resolveSharePreview } from "../../services/sharePreviewResolve";
import { sharePreviewHref } from "../../utils/shareNavigation";
import { SANS_FONT, SANS_FONT_BOLD, SANS_FONT_MEDIUM } from "../../constants/theme";
import { useThemeColors } from "../../store/themeStore";
import {
  cardModelFromSnapshot,
  shareContentTypeLabel,
  type MessageSharePayload,
  type SharePreviewCardModel,
} from "../../../../../packages/utils/sharePreview";

type Props = {
  payload: MessageSharePayload;
  viewerId?: string | null;
  isOwn?: boolean;
};

export function SharePreviewCard({ payload, viewerId, isOwn = false }: Props) {
  const router = useRouter();
  const colors = useThemeColors();
  const [model, setModel] = useState<SharePreviewCardModel>(() =>
    cardModelFromSnapshot(payload)
  );

  useEffect(() => {
    setModel(cardModelFromSnapshot(payload));
    if (!viewerId) return;
    let cancelled = false;
    void resolveSharePreview(payload, viewerId).then((resolved) => {
      if (!cancelled) setModel(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [payload, viewerId]);

  if (model.unavailable) {
    return (
      <View
        className="max-w-[280px] rounded-xl border border-dashed border-brand-border px-3 py-3"
        style={{ backgroundColor: isOwn ? "rgba(255,255,255,0.08)" : colors.background }}
        accessibilityRole="text"
        accessibilityLabel="This content is no longer available"
      >
        <Text style={{ fontFamily: SANS_FONT, color: colors.inkMuted, fontSize: 13 }}>
          This content is no longer available.
        </Text>
      </View>
    );
  }

  const label = `${shareContentTypeLabel(model.contentType)}: ${model.title}`;
  const muted = isOwn ? "rgba(255,255,255,0.7)" : colors.inkMuted;
  const ink = isOwn ? "#fff" : colors.ink;
  const titleColor = isOwn ? "#fff" : colors.puceRed;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => router.push(sharePreviewHref(payload) as never)}
      className="max-w-[280px] rounded-xl border border-brand-border p-3 active:opacity-80"
      style={{
        backgroundColor: isOwn ? "rgba(255,255,255,0.1)" : colors.background,
        borderColor: isOwn ? "rgba(255,255,255,0.25)" : colors.border,
      }}
    >
      <Text
        style={{
          fontFamily: SANS_FONT_BOLD,
          color: muted,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 8,
        }}
      >
        {shareContentTypeLabel(model.contentType)}
      </Text>

      <View className="flex-row gap-3">
        {model.thumbnailUrl ? (
          <Image
            source={{ uri: model.thumbnailUrl }}
            style={{ width: 48, height: 64, borderRadius: 6, backgroundColor: colors.surface }}
            accessibilityIgnoresInvertColors
          />
        ) : null}

        <View className="min-w-0 flex-1">
          {(model.posterName || model.posterAvatarUrl) && (
            <View className="mb-1 flex-row items-center gap-2">
              <Avatar url={model.posterAvatarUrl} name={model.posterName} size={18} />
              <Text
                numberOfLines={1}
                style={{ fontFamily: SANS_FONT_MEDIUM, color: muted, fontSize: 12, flex: 1 }}
              >
                {model.posterName}
              </Text>
            </View>
          )}

          <Text
            numberOfLines={2}
            style={{ fontFamily: SANS_FONT_BOLD, color: titleColor, fontSize: 14 }}
          >
            {model.title}
          </Text>

          {model.subtitle && model.subtitle !== model.posterName ? (
            <Text
              numberOfLines={1}
              style={{ fontFamily: SANS_FONT, color: muted, fontSize: 12, marginTop: 2 }}
            >
              {model.subtitle}
            </Text>
          ) : null}

          {model.description ? (
            <Text
              numberOfLines={3}
              style={{ fontFamily: SANS_FONT, color: ink, fontSize: 12, marginTop: 4, lineHeight: 16 }}
            >
              {model.description}
            </Text>
          ) : null}

          <View className="mt-2 flex-row flex-wrap items-center gap-2">
            {model.rating != null ? (
              <Text style={{ fontFamily: SANS_FONT_MEDIUM, color: "#E08A3E", fontSize: 11 }}>
                {"★".repeat(Math.min(5, Math.max(0, Math.round(model.rating))))}
              </Text>
            ) : null}
            {model.spoiler ? (
              <Text
                style={{
                  fontFamily: SANS_FONT_BOLD,
                  color: "#B54A3C",
                  fontSize: 10,
                  textTransform: "uppercase",
                }}
              >
                Spoilers
              </Text>
            ) : null}
            {model.edited ? (
              <Text style={{ fontFamily: SANS_FONT, color: muted, fontSize: 10 }}>Edited</Text>
            ) : null}
          </View>

          {model.tags.length ? (
            <View className="mt-2 flex-row flex-wrap gap-1">
              {model.tags.map((tag) => (
                <View
                  key={tag}
                  className="rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: isOwn ? "rgba(255,255,255,0.15)" : `${colors.primary}26`,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: SANS_FONT_MEDIUM,
                      color: isOwn ? "#fff" : colors.puceRed,
                      fontSize: 10,
                    }}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
