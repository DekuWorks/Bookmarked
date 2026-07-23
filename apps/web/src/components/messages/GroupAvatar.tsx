import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-20 w-20 text-xl",
} as const;

const SIZE_PX = {
  sm: 36,
  md: 44,
  lg: 80,
} as const;

export function GroupAvatar({ title, avatarUrl, size = "md", className }: Props) {
  const label = title.trim() || "Group";

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={`${label} avatar`}
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
        "flex items-center justify-center rounded-full bg-royal-orange/20 font-bold text-puce-red",
        SIZE_CLASSES[size],
        className
      )}
      aria-label={label}
    >
      {label.slice(0, 2).toUpperCase()}
    </div>
  );
}
