"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FeatureLimitModal } from "@/components/premium/FeatureLimitModal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { NotesBookFilter } from "@/components/notes/NotesBookFilter";
import { QuoteGraphicCard } from "@/components/quotes/QuoteGraphicCard";
import { QuoteGraphicsVault } from "@/components/quotes/QuoteGraphicsVault";
import { getQuoteGraphicsRemaining } from "@/lib/services/usageCounters";
import {
  createQuoteGraphic,
  listQuoteGraphicSources,
  listQuoteGraphics,
} from "@/lib/services/quoteGraphics";
import { isEntitlementLimitError } from "@/lib/utils/subscription";
import {
  QUOTE_GRAPHICS_EMPTY_COPY,
  QUOTE_GRAPHICS_SELECT_BOOK_FIRST,
  QUOTE_GRAPHICS_VAULT_LABEL,
  buildQuoteGraphicAttribution,
  buildQuoteGraphicBookOptions,
  monthlyLimitCopy,
  quotesForSelectedBook,
  type QuoteGraphicSourceNote,
} from "@bookmarked/utils/quoteGraphics";
import type { QuoteGraphic } from "@/types";
import { webFeedComposerHref } from "@bookmarked/utils/feedComposer";

type Props = {
  userId: string;
  unlimited?: boolean;
};

export function QuoteGraphicsStudio({ userId, unlimited = false }: Props) {
  const toast = useToast();
  const [sources, setSources] = useState<QuoteGraphicSourceNote[] | null>(null);
  const [vault, setVault] = useState<QuoteGraphic[] | null>(null);
  const [userBookId, setUserBookId] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);

  const refreshRemaining = useCallback(async () => {
    setRemaining(await getQuoteGraphicsRemaining(userId));
  }, [userId]);

  const loadSources = useCallback(async () => {
    const notes = await listQuoteGraphicSources(userId);
    setSources(notes);
  }, [userId]);

  const loadVault = useCallback(async () => {
    const rows = await listQuoteGraphics(userId);
    setVault(rows);
  }, [userId]);

  useEffect(() => {
    void (async () => {
      await refreshRemaining();
      await loadSources();
      await loadVault();
    })();
  }, [refreshRemaining, loadSources, loadVault]);

  const books = useMemo(
    () => buildQuoteGraphicBookOptions(sources ?? []),
    [sources]
  );
  const quotes = useMemo(
    () => quotesForSelectedBook(sources ?? [], userBookId),
    [sources, userBookId]
  );
  const selectedNote = quotes.find((note) => note.id === noteId) ?? null;
  const attribution = selectedNote ? buildQuoteGraphicAttribution(selectedNote) : "";

  async function handleGenerate() {
    if (!selectedNote) {
      toast.error("Select a book and quote first.");
      return;
    }
    if (remaining === 0) {
      setLimitOpen(true);
      return;
    }
    setSaving(true);
    const result = await createQuoteGraphic({ userId, note: selectedNote });
    setSaving(false);
    if (result.error === "limit" || (result.error && isEntitlementLimitError(result.error))) {
      setLimitOpen(true);
      return;
    }
    if (result.error || !result.graphic) {
      toast.error(result.error ?? "Could not create graphic.");
      return;
    }
    setRemaining(result.remaining ?? remaining);
    setPreview(true);
    setVault((current) => [result.graphic!, ...(current ?? [])]);
    toast.success(
      result.remaining == null
        ? "Graphic saved to your Quote Graphics Vault."
        : `Graphic saved to your Quote Graphics Vault. ${result.remaining} remaining this month.`
    );
  }

  if (sources && sources.length === 0) {
    return (
      <section className="surface-card space-y-4 p-5 sm:p-6">
        <h2 className="text-center font-display text-xl text-puce-red">Quote Graphics</h2>
        <p className="text-center text-sm text-text-muted">{QUOTE_GRAPHICS_EMPTY_COPY}</p>
        <p className="text-center">
          <Link href="/notes/" className="text-sm font-medium text-primary hover:underline">
            Open Reading Notes
          </Link>
        </p>
        <div className="flex justify-center">
          <Button type="button" variant="ghost" onClick={() => setVaultOpen((open) => !open)}>
            {QUOTE_GRAPHICS_VAULT_LABEL}
          </Button>
        </div>
        {vaultOpen ? (
          <QuoteGraphicsVault
            items={vault ?? []}
            shareHref={(id) => webFeedComposerHref({ quoteGraphicId: id })}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className="surface-card space-y-4 p-5 sm:p-6">
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Quote graphics"
        limitMessage="Free members can create 3 quote graphics per month. Upgrade to Bookmarked Plus for unlimited graphics."
      />

      <h2 className="text-center font-display text-xl text-puce-red">Quote Graphics</h2>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-text-muted">{monthlyLimitCopy(unlimited)}</p>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-puce-red">
          {remaining == null ? "…" : `${remaining} left this month`}
        </span>
      </div>

      <NotesBookFilter
        options={books}
        selectedUserBookId={userBookId}
        onSelect={(next) => {
          setUserBookId(next);
          setNoteId(null);
          setPreview(false);
        }}
      />

      <label className="block text-sm font-medium text-text">
        Quote
        <select
          className="mt-1.5 w-full min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2 disabled:opacity-60"
          disabled={!userBookId}
          value={noteId ?? ""}
          aria-label="Quote"
          aria-disabled={!userBookId}
          onChange={(event) => {
            setNoteId(event.target.value || null);
            setPreview(false);
          }}
        >
          <option value="">
            {userBookId ? "Choose a saved quote…" : QUOTE_GRAPHICS_SELECT_BOOK_FIRST}
          </option>
          {quotes.map((note) => (
            <option key={note.id} value={note.id}>
              {note.quote!.trim().slice(0, 80)}
            </option>
          ))}
        </select>
      </label>

      {selectedNote ? (
        <p className="text-sm text-text-muted">Attribution: {attribution || "—"}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!selectedNote}
          onClick={() => setPreview(true)}
        >
          Preview
        </Button>
        <Button
          type="button"
          variant="secondary"
          loading={saving}
          disabled={!selectedNote}
          onClick={() => void handleGenerate()}
        >
          Generate
        </Button>
        <Button type="button" variant="ghost" onClick={() => setVaultOpen((open) => !open)}>
          {QUOTE_GRAPHICS_VAULT_LABEL}
        </Button>
      </div>

      {preview && selectedNote ? (
        <QuoteGraphicCard quote={selectedNote.quote ?? ""} attribution={attribution} />
      ) : null}

      {vaultOpen ? (
        <QuoteGraphicsVault
          items={vault ?? []}
          shareHref={(id) => webFeedComposerHref({ quoteGraphicId: id })}
        />
      ) : null}
    </section>
  );
}
