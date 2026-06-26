import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { profileInitials } from "@/lib/utils/messaging";
import type { MessageProfile } from "@/types";

type Props = {
  profile: MessageProfile;
  size?: "sm" | "md";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
};

export function UserAvatar({ profile, size = "md", className }: Props) {
  const label = profile.display_name?.trim() || profile.username || "Reader";

  if (profile.avatar_url) {
    return (
      <Image
        src={profile.avatar_url}
        alt=""
        width={size === "sm" ? 36 : 44}
        height={size === "sm" ? 36 : 44}
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
      aria-hidden
    >
      {profileInitials(profile)}
    </div>
  );
}
