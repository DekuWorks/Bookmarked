"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BookCover } from "@/components/books/BookCover";
import { BookPickerModal } from "@/components/clubs/BookPickerModal";
import { InviteMembersModal } from "@/components/clubs/InviteMembersModal";
import { CircleAvatarUpload } from "@/components/ui/CircleAvatarUpload";
import { useToast } from "@/components/ui/Toast";
import { FeatureLimitModal } from "@/components/premium/FeatureLimitModal";
import { createClub, shareClubToFeed } from "@/lib/services/bookClubs";
import { uploadClubAvatar } from "@/lib/services/entityAvatar";
import { clubDetailPath } from "@/lib/routes/clubs";
import { ENTITLEMENT_LIMIT_MESSAGES, isEntitlementLimitError } from "@/lib/utils/subscription";
import {
  CLUB_GENRE_OPTIONS,
  canShareClubToFeed,
} from "@bookmarked/utils/clubPermissions";
import type { BookClubJoinPolicy, BookClubVisibility } from "@/types";
import type { BookSearchResult } from "@/lib/services/feedSearch";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
};

type Step = 1 | 2 | 3;

const MEETING_FREQUENCY_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "Weekly", label: "Weekly" },
  { value: "Biweekly", label: "Every two weeks" },
  { value: "Monthly", label: "Monthly" },
  { value: "As scheduled", label: "As scheduled" },
] as const;

const VISIBILITY_OPTIONS: {
  value: BookClubVisibility;
  label: string;
  hint: string;
}[] = [
  {
    value: "public",
    label: "Public",
    hint: "Anyone can discover this club and join when the policy allows.",
  },
  {
    value: "private",
    label: "Private",
    hint: "Hidden from discovery. Members join by request or invite.",
  },
  {
    value: "invite_only",
    label: "Invite only",
    hint: "Only people you invite can join.",
  },
];

function defaultJoinPolicy(visibility: BookClubVisibility): BookClubJoinPolicy {
  if (visibility === "public") return "open";
  if (visibility === "invite_only") return "invitation_only";
  return "request_approval";
}

const JOIN_POLICY_OPTIONS: {
  value: BookClubJoinPolicy;
  label: string;
}[] = [
  { value: "open", label: "Open join" },
  { value: "request_approval", label: "Request approval" },
  { value: "invitation_only", label: "Invitation only" },
];

export function CreateClubModal({ open, onClose, currentUserId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<BookClubVisibility>("public");
  const [joinPolicy, setJoinPolicy] = useState<BookClubJoinPolicy>("open");
  const [genres, setGenres] = useState<string[]>([]);
  const [meetingFrequency, setMeetingFrequency] = useState("");
  const [currentBook, setCurrentBook] = useState<BookSearchResult | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createdClubId, setCreatedClubId] = useState<string | null>(null);
  const [shareToFeed, setShareToFeed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setName("");
    setDescription("");
    setVisibility("public");
    setJoinPolicy("open");
    setGenres([]);
    setMeetingFrequency("");
    setCurrentBook(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    setCreatedClubId(null);
    setShareToFeed(true);
    setInviteOpen(false);
    setError(null);
    setLimitOpen(false);
  }, [open]);

  function handleVisibilityChange(next: BookClubVisibility) {
    setVisibility(next);
    setJoinPolicy(defaultJoinPolicy(next));
    if (next !== "public") setShareToFeed(false);
    else setShareToFeed(true);
  }

  function toggleGenre(genre: string) {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }

  function validateStep1(): boolean {
    if (!name.trim()) {
      setError("Give your club a name.");
      return false;
    }
    setError(null);
    return true;
  }

  async function handleCreate() {
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createClub({
      name,
      description,
      visibility,
      joinPolicy,
      genreTags: genres,
      meetingFrequency: meetingFrequency || null,
      currentBookId: currentBook?.id ?? null,
    });

    if (result.error || !result.clubId) {
      setSubmitting(false);
      if (result.error && isEntitlementLimitError(result.error)) {
        setLimitOpen(true);
        return;
      }
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

    setCreatedClubId(result.clubId);
    setSubmitting(false);
    setStep(3);
    toast.success("Club created!");
  }

  async function handleFinish() {
    if (!createdClubId) return;

    setSubmitting(true);
    setError(null);

    if (shareToFeed && canShareClubToFeed(visibility)) {
      const shareResult = await shareClubToFeed(createdClubId);
      if (shareResult.error) {
        toast.error(shareResult.error);
      } else {
        toast.success("Shared to your feed.");
      }
    }

    setSubmitting(false);
    onClose();
    router.push(clubDetailPath(createdClubId));
  }

  const stepTitle =
    step === 1 ? "Start a book club" : step === 2 ? "Reading setup" : "Invite & share";

  return (
    <>
      <Modal open={open} onClose={onClose} title={stepTitle} className="max-w-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2" aria-label={`Step ${step} of 3`}>
            {([1, 2, 3] as const).map((n) => (
              <span
                key={n}
                className={cn(
                  "h-2 w-8 rounded-full transition",
                  n <= step ? "bg-primary" : "bg-border"
                )}
              />
            ))}
          </div>

          {step === 1 ? (
            <>
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
                <span className="mb-1.5 block text-sm font-medium text-text">Visibility</span>
                <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-1 sm:flex-row">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleVisibilityChange(option.value)}
                      className={cn(
                        "min-h-[44px] flex-1 rounded-md px-3 text-sm font-medium transition",
                        visibility === option.value
                          ? "bg-puce-red text-white"
                          : "text-text-muted hover:text-text"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-text-muted">
                  {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.hint}
                </p>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-text">Join policy</span>
                <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-1 sm:flex-row">
                  {JOIN_POLICY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setJoinPolicy(option.value)}
                      className={cn(
                        "min-h-[44px] flex-1 rounded-md px-2 text-sm font-medium transition",
                        joinPolicy === option.value
                          ? "bg-puce-red text-white"
                          : "text-text-muted hover:text-text"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-text">Genres</span>
                <div className="flex flex-wrap gap-2">
                  {CLUB_GENRE_OPTIONS.map((genre) => {
                    const active = genres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition",
                          active
                            ? "bg-primary/20 text-puce-red"
                            : "bg-background text-text-muted hover:text-text"
                        )}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-text">
                  Current book (optional)
                </span>
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPickerOpen(true)}
                  >
                    Pick a book
                  </Button>
                )}
              </div>

              <div>
                <label
                  htmlFor="meeting-frequency"
                  className="mb-1.5 block text-sm font-medium text-text"
                >
                  Meeting frequency (optional)
                </label>
                <select
                  id="meeting-frequency"
                  value={meetingFrequency}
                  onChange={(e) => setMeetingFrequency(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text"
                >
                  {MEETING_FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value || "none"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          {step === 3 && createdClubId ? (
            <>
              <p className="text-sm text-text-muted">
                <span className="font-medium text-text">{name.trim()}</span> is ready. Invite
                readers now, or skip and do it later from the club page.
              </p>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setInviteOpen(true)}
              >
                Invite members
              </Button>

              {canShareClubToFeed(visibility) ? (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={shareToFeed}
                    onChange={(e) => setShareToFeed(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-text">Share to Feed</span>
                    <span className="mt-0.5 block text-xs text-text-muted">
                      Post this public club so followers can discover it.
                    </span>
                  </span>
                </label>
              ) : (
                <p className="text-xs text-text-muted">
                  Only public clubs can be shared to the feed.
                </p>
              )}
            </>
          ) : null}

          {error ? <p className="text-sm text-rust">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-2">
            {step === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  disabled={!name.trim()}
                >
                  Continue
                </Button>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleCreate()}
                  loading={submitting}
                >
                  Create club
                </Button>
              </>
            ) : null}

            {step === 3 ? (
              <Button
                type="button"
                onClick={() => void handleFinish()}
                loading={submitting}
              >
                Open club
              </Button>
            ) : null}
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

      {createdClubId ? (
        <InviteMembersModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          clubId={createdClubId}
          currentUserId={currentUserId}
          clubName={name.trim() || undefined}
        />
      ) : null}

      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Book clubs"
        limitMessage={ENTITLEMENT_LIMIT_MESSAGES.joined_book_clubs}
      />
    </>
  );
}
