"use client";

import { useEffect, useState } from "react";
import {
  type CustomMoodTag,
  isBuiltinMoodTag,
  mergeMoodTags,
} from "@bookmarked/utils/customMoodTags";
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
  value: string | null;
  onChange: (mood: string | null) => void;
  disabled?: boolean;
  className?: string;
};

export function SessionMoodPicker({ value, onChange, disabled, className }: Props) {
  const toast = useToast();
  const [custom, setCustom] = useState<CustomMoodTag[]>([]);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  useEffect(() => {
    void listMyMoodTags()
      .then(setCustom)
      .catch((error) => console.error("[mood-tags] load failed:", error));
  }, []);

  const tags = mergeMoodTags(custom);

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
    onChange(result.tag.name);
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
    if (value === tag.name) onChange(result.tag.name);
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
    if (value === tag.name) onChange(null);
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-text-muted">Mood</p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setCreating((open) => !open)}
          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
        >
          {creating ? "Cancel" : "+ Create"}
        </button>
      </div>
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
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {tags.map((feeling) => {
          const active = value === feeling;
          const customTag = custom.find(
            (tag) => !tag.archivedAt && tag.name.toLowerCase() === feeling.toLowerCase()
          );
          const canEdit = Boolean(customTag) && !isBuiltinMoodTag(feeling);
          return (
            <span key={feeling} className="inline-flex items-center gap-0.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(active ? null : feeling)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium transition",
                  active
                    ? "border-puce-red bg-puce-red text-white"
                    : "border-border bg-background text-text-muted hover:border-primary disabled:opacity-50"
                )}
              >
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
                  className="text-[10px] text-text-muted hover:text-primary"
                >
                  ✎
                </button>
              ) : null}
            </span>
          );
        })}
      </div>
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
  );
}

export function SessionMoodChip({ mood }: { mood: string }) {
  return (
    <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-puce-red">
      {mood}
    </span>
  );
}
