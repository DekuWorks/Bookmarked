"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IosSubscribePanel } from "@/components/challenges/IosSubscribePanel";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { layout } from "@/lib/constants/layout";
import { challengeDetailPath, challengesPath } from "@/lib/routes/challenges";
import { createChallenge } from "@/lib/services/challenges/ChallengeService";
import { uploadChallengeCover } from "@/lib/services/entityAvatar";
import { originBackLink } from "@bookmarked/utils/navigationOrigin";
import {
  CHALLENGE_GOAL_TYPES,
  CHALLENGE_VISIBILITIES,
  isChallengeGoalType,
  isChallengeVisibility,
  type ChallengeGoalType,
  type ChallengeVisibility,
} from "@bookmarked/utils/challengeTypes";
import { visibilityLabel as challengeVisibilityLabel } from "@bookmarked/utils/challengeDisplay";

export default function CreateChallengePage() {
  const user = useAuthUser();
  const { isPremium } = useSubscription(user?.id);
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const back = originBackLink(searchParams.get("origin"), "web", {
    href: challengesPath(),
    label: "← Back to Challenges",
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState<ChallengeGoalType>("BOOK_COUNT");
  const [goalAmount, setGoalAmount] = useState("12");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [visibility, setVisibility] = useState<ChallengeVisibility>("private");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onCover(file: File | null) {
    if (!file) return;
    const uploaded = await uploadChallengeCover(file);
    if (uploaded.error) {
      toast.error(uploaded.error);
      return;
    }
    setCoverUrl(uploaded.url ?? null);
  }

  async function onSubmit() {
    if (!isPremium) return;
    setSaving(true);
    const result = await createChallenge({
      title,
      description,
      coverUrl,
      goalType,
      goalAmount: Number(goalAmount) || 1,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      visibility,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.id) router.push(challengeDetailPath(result.id));
  }

  return (
    <div className={layout.pageStack}>
      <Link href={back.href} className="text-sm font-medium text-primary hover:underline">
        {back.label}
      </Link>
      <header className={layout.pageHeader}>
        <h1 className="text-3xl font-bold text-puce-red">Create Challenge</h1>
      </header>

      {!isPremium ? (
        <IosSubscribePanel title="Create Challenge is Plus on iOS" />
      ) : (
        <form
          className={`${layout.formPanel} space-y-3`}
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <Textarea
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <label className="block text-left text-sm font-medium text-text">
            Cover
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
              onChange={(event) => void onCover(event.target.files?.[0] ?? null)}
            />
          </label>
          <label className="block text-left text-sm font-medium text-text">
            Goal type
            <select
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2"
              value={goalType}
              onChange={(event) => {
                if (isChallengeGoalType(event.target.value)) setGoalType(event.target.value);
              }}
            >
              {CHALLENGE_GOAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Goal amount"
            type="number"
            min={1}
            value={goalAmount}
            onChange={(event) => setGoalAmount(event.target.value)}
          />
          <Input label="Starts" type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
          <Input label="Ends" type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
          <label className="block text-left text-sm font-medium text-text">
            Visibility
            <select
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2"
              value={visibility}
              onChange={(event) => {
                if (isChallengeVisibility(event.target.value)) setVisibility(event.target.value);
              }}
            >
              {CHALLENGE_VISIBILITIES.map((value) => (
                <option key={value} value={value}>
                  {challengeVisibilityLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" loading={saving}>
            Create Challenge
          </Button>
        </form>
      )}
    </div>
  );
}
