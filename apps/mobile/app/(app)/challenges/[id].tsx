import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button } from "../../../src/components/Button";
import { FeatureLimitModal } from "../../../src/components/FeatureLimitModal";
import { LoadingState } from "../../../src/components/LoadingState";
import { ScreenHeader } from "../../../src/components/ScreenHeader";
import {
  getChallengeDetail,
  inviteToChallenge,
  joinChallenge,
  leaveChallenge,
  respondToChallengeInvite,
  type ChallengeDetailModel,
} from "../../../src/services/challenges/ChallengeService";
import { searchReaders } from "../../../src/services/feedSearch";
import { useAuthStore } from "../../../src/store/authStore";
import { formatChallengeAmount, formatChallengeListeningTime } from "../../../../../packages/utils/challengeDisplay";
import { challengeVisibilityLabel } from "../../../../../packages/utils";
import { isEntitlementLimitError } from "../../../../../packages/utils/subscription";
import { originBackHref } from "../../../../../packages/utils/navigationOrigin";

export default function ChallengeDetailRoute() {
  const { id, origin } = useLocalSearchParams<{ id: string; origin?: string }>();
  const userId = useAuthStore((s) => s.user?.id);
  const [detail, setDetail] = useState<ChallengeDetailModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteQuery, setInviteQuery] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setDetail(await getChallengeDetail(id));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState message="Loading challenge…" />;
  if (!detail) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="Challenge" backHref={originBackHref(origin, "mobile") ?? "/challenges"} />
        <Text className="p-4 text-ink-muted">This challenge is not available.</Text>
      </View>
    );
  }

  const { challenge, progress, membershipStatus, completed } = detail;

  async function act(fn: () => Promise<{ error?: string }>, ok: string) {
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (result.error) {
      if (isEntitlementLimitError(result.error)) {
        setLimitOpen(true);
        return;
      }
      setMessage(result.error);
      return;
    }
    setMessage(ok);
    void load();
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={challenge.title}
        backHref={originBackHref(origin, "mobile") ?? "/challenges"}
      />
      <FeatureLimitModal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        featureLabel="Reading challenges"
        limitMessage="Free members can join 3 reading challenges per year. Subscribe in this app for unlimited challenges."
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text className="text-xs uppercase text-ink-muted">
          {challenge.category ?? "Challenge"} · {challengeVisibilityLabel(challenge.visibility)}
        </Text>
        {challenge.description ? (
          <Text className="mt-2 text-ink-muted">{challenge.description}</Text>
        ) : null}
        {progress ? (
          <Text
            className="mt-3 text-sm text-ink-muted"
            accessibilityLabel={`${challenge.title}, ${progress.percent} percent`}
          >
            {formatChallengeAmount(progress.current, progress.unit)} of{" "}
            {formatChallengeAmount(progress.target, progress.unit)} · {progress.percent}%
          </Text>
        ) : null}
        {membershipStatus === "active" ? (
          <Button title="Leave" variant="ghost" loading={busy} onPress={() => void act(() => leaveChallenge(challenge.id), "Left challenge.")} />
        ) : completed ? (
          <Text className="mt-3 font-medium text-puce-red">Completed</Text>
        ) : (
          <Button title="Join" loading={busy} onPress={() => void act(() => joinChallenge(challenge.id), "Joined challenge.")} />
        )}
        {message ? <Text className="mt-2 text-sm text-puce-red">{message}</Text> : null}

        <Text className="mt-6 font-semibold text-puce-red">Checklist</Text>
        {detail.objectives.map((item: (typeof detail.objectives)[number]) => (
          <Text key={item.objectiveId} className="mt-1 text-sm text-ink" accessibilityLabel={item.completed ? `${item.title}, complete` : `${item.title}, incomplete`}>
            {item.completed ? "Complete" : "Incomplete"} — {item.title}
          </Text>
        ))}

        <Text className="mt-6 font-semibold text-puce-red">Books that counted</Text>
        {detail.contributions.length === 0 ? (
          <Text className="mt-1 text-sm text-ink-muted">No qualifying books yet.</Text>
        ) : (
          detail.contributions.map((row) => (
            <View key={`${row.userBookId}-${row.qualifyingDate}`} className="mt-2 rounded-xl border border-brand-border bg-surface p-3">
              <Text className="font-medium text-ink">{row.bookTitle}</Text>
              <Text className="text-sm text-ink-muted">{row.reason}</Text>
            </View>
          ))
        )}

        <Text className="mt-6 font-semibold text-puce-red">Participants</Text>
        <Text className="text-xs text-ink-muted">Progress only — no rankings.</Text>
        {detail.participants.map((row) => (
          <Text key={row.userId} className="mt-1 text-sm text-ink">
            {row.displayName}: {row.books} books, {row.pages} pages, {formatChallengeListeningTime(row.listeningSeconds)} listening
          </Text>
        ))}

        {userId && (membershipStatus === "active" || challenge.created_by === userId) ? (
          <View className="mt-6">
            <Text className="font-semibold text-puce-red">Invite a friend</Text>
            <TextInput
              className="mt-2 rounded-xl border border-brand-border bg-surface px-3 py-2 text-ink"
              placeholder="Search People"
              value={inviteQuery}
              onChangeText={setInviteQuery}
            />
            <Button
              title="Invite"
              onPress={() => {
                void (async () => {
                  const readers = await searchReaders(inviteQuery.trim(), userId, 5);
                  const target = readers.find((row) => !row.isSelf);
                  if (!target) {
                    setMessage("No matching reader in Search People.");
                    return;
                  }
                  await act(() => inviteToChallenge(challenge.id, target.id), "Invitation sent.");
                })();
              }}
            />
            {detail.invites
              .filter((invite) => invite.status === "pending" && invite.inviteeId === userId)
              .map((invite) => (
                <Button
                  key={invite.id}
                  title="Accept invite"
                  onPress={() => void act(() => respondToChallengeInvite(invite.id, true), "Joined challenge.")}
                />
              ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
