import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import type { MessageProfile } from "@/types";

type Props = {
  profile: MessageProfile;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function UserAvatar({ profile, size = "md", className }: Props) {
  return <ProfileAvatar profile={profile} size={size} className={className} />;
}
