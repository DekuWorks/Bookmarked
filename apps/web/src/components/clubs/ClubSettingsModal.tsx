"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  getMemberNotificationLevel,
  setClubBanner,
  setMemberNotificationLevel,
  updateClub,
} from "@/lib/services/bookClubs";
import { uploadClubBanner } from "@/lib/services/entityAvatar";
import { canManageMembers, CLUB_GENRE_OPTIONS } from "@bookmarked/utils/clubPermissions";
import {
  DEFAULT_BOOK_CLUB_BANNER_MODE,
  parseBookClubBannerMode,
  type BookClubBannerMode,
} from "@bookmarked/utils/clubBanner";
import type {
  BookClubJoinPolicy,
  BookClubNotificationLevel,
  BookClubVisibility,
  BookClubWithDetails,
} from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  club: BookClubWithDetails;
  /** When false, only notification prefs (and banner for hosts) are editable. */
  canEditClub?: boolean;
  onSaved?: () => void;
};

export function ClubSettingsModal({
  open,
  onClose,
  club,
  canEditClub = true,
  onSaved,
}: Props) {
  const toast = useToast();
  const canManageBanner = canManageMembers(club.viewer_role);
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description ?? "");
  const [visibility, setVisibility] = useState<BookClubVisibility>(club.visibility);
  const [joinPolicy, setJoinPolicy] = useState<BookClubJoinPolicy>(club.join_policy);
  const [meetingFrequency, setMeetingFrequency] = useState(club.meeting_frequency ?? "");
  const [genreTags, setGenreTags] = useState<string[]>(club.genre_tags ?? []);
  const [bannerMode, setBannerMode] = useState<BookClubBannerMode>(
    parseBookClubBannerMode(club.banner_mode ?? DEFAULT_BOOK_CLUB_BANNER_MODE)
  );
  const [bannerUrl, setBannerUrl] = useState(club.banner_url ?? "");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [notifyLevel, setNotifyLevel] = useState<BookClubNotificationLevel>("important");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(club.name);
    setDescription(club.description ?? "");
    setVisibility(club.visibility);
    setJoinPolicy(club.join_policy);
    setMeetingFrequency(club.meeting_frequency ?? "");
    setGenreTags(club.genre_tags ?? []);
    setBannerMode(parseBookClubBannerMode(club.banner_mode ?? DEFAULT_BOOK_CLUB_BANNER_MODE));
    setBannerUrl(club.banner_url ?? "");
    void getMemberNotificationLevel(club.id)
      .then(setNotifyLevel)
      .catch(() => setNotifyLevel("important"));
  }, [open, club]);

  function toggleGenre(genre: string) {
    setGenreTags((current) =>
      current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre]
    );
  }

  async function handleBannerFile(file: File | null) {
    if (!file) return;
    setBannerUploading(true);
    const uploaded = await uploadClubBanner(club.id, file);
    setBannerUploading(false);
    if (uploaded.error || !uploaded.url) {
      toast.error(uploaded.error ?? "Could not upload banner.");
      return;
    }
    setBannerMode("custom");
    setBannerUrl(uploaded.url);
    toast.success("Banner uploaded. Save to apply.");
  }

  async function handleSave() {
    setSubmitting(true);

    const notifyResult = await setMemberNotificationLevel(club.id, notifyLevel);
    if (notifyResult.error) {
      setSubmitting(false);
      toast.error(notifyResult.error);
      return;
    }

    if (canManageBanner) {
      const bannerResult = await setClubBanner(club.id, {
        mode: bannerMode,
        bannerUrl: bannerMode === "custom" ? bannerUrl.trim() || null : null,
      });
      if (bannerResult.error) {
        setSubmitting(false);
        toast.error(bannerResult.error);
        return;
      }
    }

    if (canEditClub) {
      const result = await updateClub(club.id, {
        name,
        description,
        visibility,
        joinPolicy,
        meetingFrequency: meetingFrequency || null,
        genreTags,
      });
      setSubmitting(false);
      if (result.error) {
        toast.error(result.error);
        return;
      }
    } else {
      setSubmitting(false);
    }

    toast.success("Club settings updated.");
    onSaved?.();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Club settings" className="max-w-lg">
      <div className="space-y-4">
        {canEditClub ? (
          <>
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What does this club read together?"
            />

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-text">Visibility</legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["public", "Public"],
                    ["private", "Private"],
                    ["invite_only", "Invite only"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setVisibility(value);
                      if (value === "public") setJoinPolicy("open");
                      if (value === "invite_only") setJoinPolicy("invitation_only");
                      if (value === "private" && joinPolicy === "open") {
                        setJoinPolicy("request_approval");
                      }
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium",
                      visibility === value
                        ? "border-primary bg-primary/15 text-puce-red"
                        : "border-border text-text-muted hover:border-primary/40"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block text-sm font-medium text-text">
              Join policy
              <select
                value={joinPolicy}
                onChange={(e) => setJoinPolicy(e.target.value as BookClubJoinPolicy)}
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
              >
                <option value="open">Open — anyone can join</option>
                <option value="request_approval">Request approval</option>
                <option value="invitation_only">Invitation only</option>
              </select>
            </label>

            <Input
              label="Meeting frequency (optional)"
              value={meetingFrequency}
              onChange={(e) => setMeetingFrequency(e.target.value)}
              placeholder="Monthly, biweekly…"
            />

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-text">Genres</legend>
              <div className="flex flex-wrap gap-2">
                {CLUB_GENRE_OPTIONS.map((genre) => {
                  const active = genreTags.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => toggleGenre(genre)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-medium",
                        active
                          ? "border-primary bg-primary/15 text-puce-red"
                          : "border-border text-text-muted hover:border-primary/40"
                      )}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </>
        ) : null}

        {canManageBanner ? (
          <fieldset className="space-y-3 rounded-xl border border-border p-3">
            <legend className="px-1 text-sm font-medium text-text">Club banner</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["current_read", "Match Current Read"],
                  ["custom", "Upload Banner Image"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBannerMode(value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium",
                    bannerMode === value
                      ? "border-primary bg-primary/15 text-puce-red"
                      : "border-border text-text-muted hover:border-primary/40"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {bannerMode === "current_read" ? (
              <p className="text-xs text-text-muted">
                Matches your current read cover (colour wash on web, cover image on mobile). Falls
                back to the Bookmarked default when no current read is set. A previously uploaded
                custom image is kept if you switch back.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">
                  Upload image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="mt-1 block w-full text-sm"
                    disabled={bannerUploading}
                    onChange={(e) => void handleBannerFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <Input
                  label="Or paste image URL"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://…"
                  type="url"
                />
              </div>
            )}
          </fieldset>
        ) : null}

        <label className="block text-sm font-medium text-text">
          Club notifications
          <select
            value={notifyLevel}
            onChange={(e) => setNotifyLevel(e.target.value as BookClubNotificationLevel)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text"
            aria-describedby="club-notify-help"
          >
            <option value="all">All</option>
            <option value="important">Important only</option>
            <option value="mentions">Mentions and replies</option>
            <option value="off">Off</option>
          </select>
        </label>
        <p id="club-notify-help" className="text-xs text-text-muted">
          Does not override your global notification preferences.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            disabled={canEditClub && !name.trim()}
            onClick={() => void handleSave()}
          >
            Save settings
          </Button>
        </div>
      </div>
    </Modal>
  );
}
