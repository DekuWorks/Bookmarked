import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { profileInitials } from "@/lib/utils/messaging";
import type { MessageProfile } from "@/types";

type Props = {
  profile: Pick<MessageProfile, "display_name" | "username" | "avatar_url">;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-2xl",
} as const;

const SIZE_PX = {
  sm: 36,
  md: 44,
  lg: 80,
  xl: 112,
} as const;

export function ProfileAvatar({ profile, size = "md", className }: Props) {
  const label = profile.display_name?.trim() || profile.username?.trim() || "Reader";

  if (profile.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt={`${label}'s profile photo`}
        width={SIZE_PX[size]}
        height={SIZE_PX[size]}
        className={cn("rounded-full object-cover", SIZE_CLASSES[size], className)}
        unoptimized
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary/20 font-semibold text-puce-red",
        SIZE_CLASSES[size],
        className
      )}
      aria-label={label}
    >
      {profileInitials(profile)}
    </div>
  );
}
