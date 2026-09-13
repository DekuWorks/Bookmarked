"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  type CustomMoodTag,
  isBuiltinMoodTag,
  mergeMoodTags,
} from "@bookmarked/utils/customMoodTags";
import {
  renameSessionMood,
  sessionMoodsFromRow,
  toggleSessionMood,
} from "@bookmarked/utils/sessionMoods";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  archiveMoodTag,
  createMoodTag,
  listMyMoodTags,
  renameMoodTag,
} from "@/lib/services/moodTags";
import { cn } from "@/lib/utils/cn";

type Props = {
  value?: string | null;
  values?: string[] | null;
  onChange: (moods: string[]) => void;
  disabled?: boolean;
  className?: string;
};

export function SessionMoodPicker({ value, values, onChange, disabled, className }: Props) {
  const toast = useToast();
  const listId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState<CustomMoodTag[]>([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const selected = values?.length ? values : sessionMoodsFromRow({ mood: value ?? null });

  useEffect(() => {
    void listMyMoodTags()
      .then(setCustom)
      .catch((error) => console.error("[mood-tags] load failed:", error));
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const tags = mergeMoodTags(custom);
  const label =
    selected.length === 0
      ? "Mood Tags"
      : selected.length === 1
        ? `Mood Tags · ${selected[0]}`
        : `Mood Tags · ${selected.length} selected`;

  async function handleCreate() {
    setSaving(true);
    const result = await createMoodTag(draft);
    setSaving(false);
    if (result.error || !result.tag) {
      toast.error(result.error ?? "Could not create mood.");
      return;
    }
    setCustom((prev) => [...prev, result.tag!]);
    setDraft("");
    setCreating(false);
    onChange(toggleSessionMood(selected, result.tag.name));
  }

  async function handleRename(tag: CustomMoodTag) {
    setSaving(true);
    const result = await renameMoodTag(tag.id, editDraft);
    setSaving(false);
    if (result.error || !result.tag) {
      toast.error(result.error ?? "Could not rename mood.");
      return;
    }
    setCustom((prev) => prev.map((row) => (row.id === tag.id ? result.tag! : row)));
    onChange(renameSessionMood(selected, tag.name, result.tag.name));
    setEditingId(null);
  }

  async function handleArchive(tag: CustomMoodTag) {
    setSaving(true);
    const result = await archiveMoodTag(tag.id);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setCustom((prev) =>
      prev.map((row) =>
        row.id === tag.id ? { ...row, archivedAt: new Date().toISOString() } : row
      )
    );
    onChange(selected.filter((item) => item.toLowerCase() !== tag.name.toLowerCase()));
  }

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Mood Tags"
        onClick={() => setOpen((next) => !next)}
        className={cn(
          "flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange",
          disabled && "opacity-50"
        )}
      >
        <span className="min-w-0 truncate font-medium text-text">{label}</span>
        <span aria-hidden className="text-text-muted">
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label="Mood Tags"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-surface p-2 shadow-md"
        >
          {tags.map((feeling) => {
            const active = selected.some((item) => item.toLowerCase() === feeling.toLowerCase());
            const customTag = custom.find(
              (tag) => !tag.archivedAt && tag.name.toLowerCase() === feeling.toLowerCase()
            );
            const canEdit = Boolean(customTag) && !isBuiltinMoodTag(feeling);
            return (
              <div key={feeling} className="flex items-center gap-1">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={disabled}
                  onClick={() => onChange(toggleSessionMood(selected, feeling))}
                  className={cn(
                    "flex min-h-[40px] flex-1 items-center gap-2 rounded-md px-2 text-left text-sm",
                    active
                      ? "bg-puce-red/15 font-semibold text-puce-red"
                      : "text-text hover:bg-background"
                  )}
                >
                  <span aria-hidden className="w-4 text-center">
                    {active ? "✓" : ""}
                  </span>
                  {feeling}
                </button>
                {canEdit && customTag ? (
                  <button
                    type="button"
                    disabled={disabled || saving}
                    aria-label={`Edit ${feeling}`}
                    onClick={() => {
                      setEditingId(customTag.id);
                      setEditDraft(customTag.name);
                    }}
                    className="px-1 text-[10px] text-text-muted hover:text-primary"
                  >
                    ✎
                  </button>
                ) : null}
              </div>
            );
          })}

          <div className="mt-2 border-t border-border pt-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setCreating((next) => !next)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {creating ? "Cancel" : "Create Custom Mood Tag"}
            </button>
            {creating ? (
              <div className="mt-2 flex items-end gap-2">
                <Input
                  label="New mood"
                  hideLabel
                  value={draft}
                  maxLength={32}
                  placeholder="Name this mood"
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={saving}
                  disabled={!draft.trim()}
                  onClick={() => void handleCreate()}
                >
                  Save
                </Button>
              </div>
            ) : null}
            {editingId ? (
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <Input
                  label="Rename mood"
                  hideLabel
                  value={editDraft}
                  maxLength={32}
                  onChange={(e) => setEditDraft(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={saving}
                  onClick={() => {
                    const tag = custom.find((row) => row.id === editingId);
                    if (tag) void handleRename(tag);
                  }}
                >
                  Update
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={() => {
                    const tag = custom.find((row) => row.id === editingId);
                    if (tag) void handleArchive(tag);
                    setEditingId(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SessionMoodChip({ mood }: { mood: string }) {
  return (
    <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-puce-red">
      {mood}
    </span>
  );
}

export function SessionMoodChips({ moods }: { moods: string[] }) {
  if (!moods.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {moods.map((mood) => (
        <SessionMoodChip key={mood} mood={mood} />
      ))}
    </div>
  );
}
