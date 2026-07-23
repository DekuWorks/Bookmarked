"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BookCover } from "@/components/books/BookCover";
import { BookPickerModal } from "@/components/clubs/BookPickerModal";
import { CircleAvatarUpload } from "@/components/ui/CircleAvatarUpload";
import { useToast } from "@/components/ui/Toast";
import { createClub } from "@/lib/services/bookClubs";
import { uploadClubAvatar } from "@/lib/services/entityAvatar";
import { clubDetailPath } from "@/lib/routes/clubs";
import type { BookClubVisibility } from "@/types";
import type { BookSearchResult } from "@/lib/services/feedSearch";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
};

export function CreateClubModal({ open, onClose, currentUserId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<BookClubVisibility>("public");
  const [currentBook, setCurrentBook] = useState<BookSearchResult | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setVisibility("public");
    setCurrentBook(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
  }, [open]);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Give your club a name.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createClub({
      name,
      description,
      visibility,
      currentBookId: currentBook?.id ?? null,
    });
    setSubmitting(false);

    if (result.error || !result.clubId) {
      setError(result.error ?? "Could not create club.");
      toast.error(result.error ?? "Could not create club.");
      return;
    }

    if (avatarFile) {
      const avatarResult = await uploadClubAvatar(result.clubId, avatarFile);
      if (avatarResult.error) {
        toast.error(avatarResult.error);
      }
    }

    toast.success("Club created!");
    onClose();
    router.push(clubDetailPath(result.clubId));
  }

  return (
    <Modal open={open} onClose={onClose} title="Start a book club" className="max-w-lg">
      <div className="space-y-4">
        <CircleAvatarUpload
          imageUrl={avatarPreview}
          fallbackLabel={name || "Club"}
          disabled={submitting}
          onFileSelect={async (file) => {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
          }}
          onRemove={async () => {
            setAvatarFile(null);
            setAvatarPreview(null);
          }}
        />

        <Input
          label="Club name"
          name="club-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Fantasy Fanatics, Cozy Mystery Crew…"
          className="mb-0"
        />

        <Textarea
          label="Description"
          name="club-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this club about? What are you reading together?"
          className="mb-0 min-h-[90px]"
        />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-text">Who can join?</span>
          <div className="flex rounded-lg border border-border bg-background p-1">
            {(["public", "private"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setVisibility(option)}
                className={cn(
                  "min-h-[44px] flex-1 rounded-md px-3 text-sm font-medium transition",
                  visibility === option
                    ? "bg-puce-red text-white"
                    : "text-text-muted hover:text-text"
                )}
              >
                {option === "public" ? "Public" : "Private"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-text-muted">
            {visibility === "public"
              ? "Anyone can discover this club and join the discussion."
              : "Only people you add can see and join this club."}
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-text">Current book (optional)</span>
          {currentBook ? (
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <div className="h-16 w-11 shrink-0 overflow-hidden rounded-md">
                <BookCover
                  title={currentBook.title}
                  author={currentBook.author}
                  coverUrl={currentBook.cover_url}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text">{currentBook.title}</p>
                {currentBook.author ? (
                  <p className="truncate text-xs text-text-muted">{currentBook.author}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCurrentBook(null)}
              >
                Remove
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              Pick a book
            </Button>
          )}
        </div>

        {error ? <p className="text-sm text-rust">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            loading={submitting}
            disabled={!name.trim()}
          >
            Create club
          </Button>
        </div>
      </div>

      <BookPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        viewerId={currentUserId}
        title="Set the current book"
        onSelect={setCurrentBook}
      />
    </Modal>
  );
}
