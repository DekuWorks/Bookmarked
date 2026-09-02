"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { OverviewQuickAction, OverviewQuickActionIcon } from "@bookmarked/utils/overviewQuickActions";
import { cn } from "@/lib/utils/cn";

function LibraryIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 19.5V6.75A1.75 1.75 0 015.75 5h2.5A1.75 1.75 0 0110 6.75V19.5M10 19.5V8.75A1.75 1.75 0 0111.75 7h2.5A1.75 1.75 0 0116 8.75V19.5M16 19.5V7.75A1.75 1.75 0 0117.75 6h1.5A1.75 1.75 0 0121 7.75V19.5M3 19.5h18"
      />
    </svg>
  );
}

function ClubsIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 19v-1.5A3.5 3.5 0 0012.5 14h-1A3.5 3.5 0 008 17.5V19M12 12.5a3 3 0 100-6 3 3 0 000 6zM20 19v-1.25a2.75 2.75 0 00-2-2.645M16.5 7.35a2.5 2.5 0 010 4.8M4 19v-1.25A2.75 2.75 0 016 15.105M7.5 7.35a2.5 2.5 0 010 4.8"
      />
    </svg>
  );
}

function ChallengesIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 21h8M12 17.5V21M7.5 4h9v5.5a4.5 4.5 0 01-9 0V4zM7.5 4H5.75A1.75 1.75 0 004 5.75V7.5A3.5 3.5 0 007.5 11M16.5 4h1.75A1.75 1.75 0 0120 5.75V7.5A3.5 3.5 0 0116.5 11"
      />
    </svg>
  );
}

const ICONS: Record<OverviewQuickActionIcon, () => ReactNode> = {
  library: LibraryIcon,
  clubs: ClubsIcon,
  challenges: ChallengesIcon,
};

type Props = {
  action: OverviewQuickAction;
  onNavigate?: () => void;
};

export function QuickActionCard({ action, onNavigate }: Props) {
  const Icon = ICONS[action.icon];

  return (
    <Link
      href={action.webHref}
      onClick={onNavigate}
      className={cn(
        "flex min-h-[108px] w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-black/10 px-3 py-3 text-center shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        "active:translate-y-0 active:opacity-90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2"
      )}
      style={{ backgroundColor: action.color, color: action.textColor }}
    >
      <Icon />
      <span className="text-sm font-semibold leading-snug">{action.label}</span>
    </Link>
  );
}
