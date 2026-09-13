import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../src/components/Button";
import { FeatureLimitModal } from "../../src/components/FeatureLimitModal";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { NotesBookFilterButton, NotesBookFilterSheet } from "../../src/components/reading-room/NotesBookFilterSheet";
import { getQuoteGraphicsRemaining } from "../../src/services/usageCounters";
import {
  createQuoteGraphic,
  listQuoteGraphicSources,
  listQuoteGraphics,
} from "../../src/services/quoteGraphics";
import { useAuthStore } from "../../src/store/authStore";
import { isEntitlementLimitError } from "../../src/utils/subscription";
import {
  QUOTE_GRAPHICS_EMPTY_COPY,
  QUOTE_GRAPHICS_PAGE_SUBTITLE,
  QUOTE_GRAPHICS_SELECT_BOOK_FIRST,
  QUOTE_GRAPHICS_VAULT_LABEL,
  buildQuoteGraphicAttribution,
  buildQuoteGraphicBookOptions,
  monthlyLimitCopy,
  quoteGraphicSnippet,
  quotesForSelectedBook,
  type QuoteGraphicSourceNote,
} from "../../../../packages/utils/quoteGraphics";
import { mobileComposeHref } from "../../../../packages/utils/feedComposer";
import type { QuoteGraphic } from "../../src/types";
import { SANS_FONT, SANS_FONT_BOLD, SERIF_DISPLAY_FONT } from "../../src/constants/theme";
import { useThemeColors } from "../../src/store/themeStore";
import { TAB_BAR_SPACE } from "../../src/navigation/TabBarScroll";

export default function QuoteGraphicsRoute() {
  const router = useRouter();
  const colors = useThemeColors();
  const userId = useAuthStore((s) => s.user?.id);
  const [sources, setSources] = useState<QuoteGraphicSourceNote[] | null>(null);
  const [vault, setVault] = useState<QuoteGraphic[]>([]);
  const [userBookId, setUserBookId] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [quotePickerOpen, setQuotePickerOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshRemaining = useCallback(async () => {
    if (!userId) return;
    setRemaining(await getQuoteGraphicsRemaining(userId));
  }, [userId]);

  useEffect(() => {
    void refreshRemaining();
    if (!userId) return;
    void listQuoteGraphicSources(userId).then(setSources);
    void listQuoteGraphics(userId).then(setVault);
  }, [refreshRemaining, userId]);

  const books = useMemo(() => buildQuoteGraphicBookOptions(sources ?? []), [sources]);
  const quotes = useMemo(
    () => quotesForSelectedBook(sources ?? [], userBookId),
    [sources, userBookId]
  );
  const selectedNote = quotes.find((note) => note.id === noteId) ?? null;
  const attribution = selectedNote ? buildQuoteGraphicAttribution(selectedNote) : "";

  async function handleGenerate() {
    if (!userId || !selectedNote) {
      setMessage("Select a book and quote first.");
      return;
    }
    if (remaining === 0) {
      setLimitOpen(true);
      return;
    }
    setSaving(true);
    setMessage(null);
    const result = await createQuoteGraphic({ userId, note: selectedNote });
    setSaving(false);
    if (result.error === "limit" || (result.error && isEntitlementLimitError(result.error))) {
      setLimitOpen(true);
      return;
    }
    if (result.error || !result.graphic) {
      setMessage(result.error ?? "Could not create graphic.");
      return;
    }
    setRemaining(result.remaining ?? remaining);
    setPreview(true);
    setVault((current) => [result.graphic!, ...current]);
    setMessage(`Saved to Vault. ${result.remaining} left this month.`);
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Quote graphics" />
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Quote graphics"
        limitMessage="Free members can create 3 quote graphics per month. Upgrade to Bookmarked Plus for unlimited graphics."
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SPACE }}>
        <Text style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
          {QUOTE_GRAPHICS_PAGE_SUBTITLE}
        </Text>
        <Text className="mt-3 text-center text-xl text-puce-red" style={{ fontFamily: SERIF_DISPLAY_FONT }}>
          Quote Graphics
        </Text>
        <Text className="mt-2 text-xs text-ink-muted">{monthlyLimitCopy(false)}</Text>
        <Text className="mt-2 text-xs font-semibold text-puce-red" style={{ fontFamily: SANS_FONT_BOLD }}>
          {remaining == null ? "…" : `${remaining} left this month`}
        </Text>

        {sources && sources.length === 0 ? (
          <>
            <Text className="mt-6 text-sm text-ink-muted">{QUOTE_GRAPHICS_EMPTY_COPY}</Text>
            <View className="mt-4">
              <Button
                title={QUOTE_GRAPHICS_VAULT_LABEL}
                variant="ghost"
                onPress={() => setVaultOpen((open) => !open)}
              />
            </View>
          </>
        ) : (
          <>
            <View className="mt-5">
              <NotesBookFilterButton
                options={books}
                selectedUserBookId={userBookId}
                onPress={() => setPickerOpen(true)}
              />
            </View>
            <Pressable
              disabled={!userBookId}
              onPress={() => userBookId && setQuotePickerOpen(true)}
              accessibilityLabel="Quote"
              className={`mt-4 min-h-[44px] justify-center rounded-xl border border-brand-border bg-surface px-3 ${
                userBookId ? "" : "opacity-60"
              }`}
            >
              <Text className="text-sm text-ink">
                {selectedNote
                  ? quoteGraphicSnippet(selectedNote.quote ?? "")
                  : userBookId
                    ? "Choose a saved quote…"
                    : QUOTE_GRAPHICS_SELECT_BOOK_FIRST}
              </Text>
            </Pressable>
            {selectedNote ? (
              <Text className="mt-2 text-sm text-ink-muted">Attribution: {attribution || "—"}</Text>
            ) : null}
            <View className="mt-4 gap-2">
              <Button
                title="Preview"
                variant="secondary"
                onPress={() => setPreview(Boolean(selectedNote))}
              />
              <Button title="Generate" loading={saving} onPress={() => void handleGenerate()} />
              <Button
                title={QUOTE_GRAPHICS_VAULT_LABEL}
                variant="ghost"
                onPress={() => setVaultOpen((open) => !open)}
              />
              <Button title="Back to notes" variant="ghost" onPress={() => router.push("/(app)/notes")} />
            </View>
          </>
        )}

        {message ? (
          <Text className="mt-3 text-sm" style={{ fontFamily: SANS_FONT, color: colors.inkMuted }}>
            {message}
          </Text>
        ) : null}

        {preview && selectedNote ? (
          <View className="mt-5 rounded-2xl bg-puce-red p-5">
            <Text className="text-xl leading-7 text-white" style={{ fontFamily: SERIF_DISPLAY_FONT }}>
              “{selectedNote.quote?.trim()}”
            </Text>
            {attribution ? (
              <Text className="mt-3 text-sm text-white/85" style={{ fontFamily: SANS_FONT }}>
                — {attribution}
              </Text>
            ) : null}
            <Text className="mt-6 text-[11px] uppercase tracking-widest text-white/70">Bookmarked</Text>
          </View>
        ) : null}

        {vaultOpen
          ? vault.map((graphic) => (
              <View key={graphic.id} className="mt-4 rounded-2xl border border-brand-border p-3">
                <View className="rounded-2xl bg-puce-red p-4">
                  <Text className="text-lg text-white" style={{ fontFamily: SERIF_DISPLAY_FONT }}>
                    “{graphic.quote_text}”
                  </Text>
                  {graphic.attribution ? (
                    <Text className="mt-2 text-sm text-white/85">— {graphic.attribution}</Text>
                  ) : null}
                </View>
                <Text className="mt-2 text-xs text-ink-muted">
                  {graphic.book?.title ?? "Quote graphic"}
                </Text>
                <Button
                  title="Share to Feed"
                  variant="ghost"
                  onPress={() =>
                    router.push(mobileComposeHref({ quoteGraphicId: graphic.id, bookId: graphic.book_id }))
                  }
                />
              </View>
            ))
          : null}
      </ScrollView>

      <NotesBookFilterSheet
        visible={pickerOpen}
        options={books}
        selectedUserBookId={userBookId}
        onClose={() => setPickerOpen(false)}
        onSelect={(next) => {
          setUserBookId(next);
          setNoteId(null);
          setPickerOpen(false);
        }}
      />
      {quotePickerOpen ? (
        <View className="absolute inset-0 bg-background px-4 pt-16">
          <Pressable onPress={() => setQuotePickerOpen(false)} className="mb-3 min-h-[44px] justify-center">
            <Text className="text-sm font-semibold text-primary-dark">Done</Text>
          </Pressable>
          {quotes.map((note) => (
            <Pressable
              key={note.id}
              onPress={() => {
                setNoteId(note.id);
                setQuotePickerOpen(false);
              }}
              className="min-h-[44px] justify-center border-b border-brand-border py-3"
            >
              <Text className="text-sm text-ink">{note.quote}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
