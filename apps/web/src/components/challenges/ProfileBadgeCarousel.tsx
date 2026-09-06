"use client";

import { useEffect, useState } from "react";
import { badgeA11yLabel } from "@bookmarked/utils/challengeBadges";
import { listUserBadges, setBadgeFeatured } from "@/lib/services/challenges/ChallengeBadgeService";

type Badge = {
  id: string;
  badgeKey: string;
  title: string;
  description: string;
  featured: boolean;
  awardedAt: string;
};

export function ProfileBadgeCarousel({
  userId,
  isOwner,
  featuredOnly = false,
}: {
  userId: string;
  isOwner: boolean;
  featuredOnly?: boolean;
}) {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    void listUserBadges(userId, featuredOnly && !isOwner).then(setBadges);
  }, [userId, featuredOnly, isOwner]);

  if (!badges.length) return null;

  return (
    <section className="mt-6 text-left">
      <h2 className="text-lg font-semibold text-puce-red">Badges</h2>
      <div
        className="mt-3 flex gap-3 overflow-x-auto pb-2"
        tabIndex={0}
        aria-label="Badge carousel"
      >
        {badges.map((badge) => (
          <article
            key={badge.id}
            className="min-w-[10rem] rounded-xl border border-border bg-surface p-3"
            aria-label={badgeA11yLabel(badge.title, badge.featured)}
          >
            <p className="font-medium text-puce-red">{badge.title}</p>
            <p className="mt-1 text-xs text-text-muted">{badge.description}</p>
            {isOwner ? (
              <button
                type="button"
                className="mt-2 text-xs font-medium text-primary hover:underline"
                onClick={() => {
                  void setBadgeFeatured(badge.id, !badge.featured).then(() =>
                    setBadges((current) =>
                      current.map((row) =>
                        row.id === badge.id ? { ...row, featured: !row.featured } : row
                      )
                    )
                  );
                }}
              >
                {badge.featured ? "Unfeature" : "Feature"}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
