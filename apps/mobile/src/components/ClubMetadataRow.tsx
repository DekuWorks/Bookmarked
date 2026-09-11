import { Text, View } from "react-native";
import { roleLabel, visibilityLabel } from "../../../../packages/utils/clubPermissions";
import type { BookClubMemberRole, BookClubVisibility } from "../types";

type Props = {
  memberCount: number;
  visibility: BookClubVisibility;
  viewerRole?: BookClubMemberRole | null;
  onDark?: boolean;
};

export function ClubMetadataRow({
  memberCount,
  visibility,
  viewerRole,
  onDark,
}: Props) {
  const memberLabel = `${memberCount} member${memberCount === 1 ? "" : "s"}`;
  const muted = onDark ? "text-white/90" : "text-ink-muted";
  const chip = onDark
    ? "rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-semibold uppercase text-white"
    : "rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-puce-red";

  return (
    <View className="mt-1 flex-row flex-wrap items-center gap-2">
      <Text className={`text-sm ${muted}`}>{memberLabel}</Text>
      <Text className={chip}>{visibilityLabel(visibility)}</Text>
      {viewerRole ? <Text className={chip}>{roleLabel(viewerRole)}</Text> : null}
    </View>
  );
}
