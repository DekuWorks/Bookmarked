"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useToast } from "@/components/ui/Toast";
import { sendInvitations } from "@/lib/services/bookClubs";
import { searchProfilesForMessaging } from "@/lib/services/messages";
import type { MessageProfile } from "@/types";

type Props = {
  open: boolean;
  onClose: () => void;
  clubId: string;
  viewerId: string;
  existingMemberIds: string[];
  onInvited?: () => void;
};

function profileLabel(profile: MessageProfile): string {
  return profile.display_name?.trim() || profile.username?.trim() || "Reader";
}

export function ClubInviteModal({
  open,
  onClose,
  clubId,
  viewerId,
  existingMemberIds,
  onInvited,
}: Props) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageProfile[]>([]);
  const [selected, setSelected] = useState<MessageProfile[]>([]);
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const memberSet = new Set(existingMemberIds);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setSelected([]);
    setMessage("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    const handle = window.setTimeout(() => {
      void searchProfilesForMessaging(trimmed, viewerId)
        .then((rows) =>
          setResults(rows.filter((profile) => !memberSet.has(profile.id) && profile.id !== viewerId))
        )
        .finally(() => setSearching(false));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [query, viewerId, open, existingMemberIds]);

  function toggle(profile: MessageProfile) {
    setSelected((current) => {
      const exists = current.some((item) => item.id === profile.id);
      if (exists) return current.filter((item) => item.id !== profile.id);
      return [...current, profile];
    });
  }

  async function handleInvite() {
    if (!selected.length) {
      toast.error("Select at least one reader to invite.");
      return;
    }
    setSubmitting(true);
    const result = await sendInvitations(
      clubId,
      selected.map((profile) => profile.id),
      message
    );
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      selected.length === 1 ? "Invitation sent." : `${selected.length} invitations sent.`
    );
    onInvited?.();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite members" className="max-w-lg">
      <div className="space-y-4">
        <Input
          label="Search readers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or username"
          autoComplete="off"
        />

        {selected.length ? (
          <ul className="flex flex-wrap gap-2">
            {selected.map((profile) => (
              <li key={profile.id}>
                <button
                  type="button"
                  onClick={() => toggle(profile)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-sm text-puce-red"
                >
                  {profileLabel(profile)}
                  <span aria-hidden>×</span>
                  <span className="sr-only">Remove {profileLabel(profile)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
          {searching ? (
            <p className="px-3 py-4 text-sm text-text-muted">Searching…</p>
          ) : query.trim().length < 2 ? (
            <p className="px-3 py-4 text-sm text-text-muted">Type at least 2 characters to search.</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-text-muted">No readers found.</p>
          ) : (
            <ul>
              {results.map((profile) => {
                const isSelected = selected.some((item) => item.id === profile.id);
                return (
                  <li key={profile.id}>
                    <button
                      type="button"
                      onClick={() => toggle(profile)}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-background ${
                        isSelected ? "bg-primary/10" : ""
                      }`}
                    >
                      <ProfileAvatar profile={profile} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-text">
                          {profileLabel(profile)}
                        </span>
                        {profile.username ? (
                          <span className="block truncate text-xs text-text-muted">
                            @{profile.username}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <span className="text-xs font-medium text-primary">Selected</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Textarea
          label="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Come read with us…"
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            disabled={!selected.length}
            onClick={() => void handleInvite()}
          >
            Send invites
          </Button>
        </div>
      </div>
    </Modal>
  );
}
