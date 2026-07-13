"use client";

import { Suspense, useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import { ClubCard } from "@/components/clubs/ClubCard";
import { CreateClubModal } from "@/components/clubs/CreateClubModal";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { discoverClubs, getMyClubs } from "@/lib/services/bookClubs";
import type { BookClubSummary } from "@/types";
import { layout } from "@/lib/constants/layout";
import { cn } from "@/lib/utils/cn";

type ClubsTab = "discover" | "yours";

function ClubsPageContent() {
  const user = useAuthUser();
  const [tab, setTab] = useState<ClubsTab>("discover");
  const [discover, setDiscover] = useState<BookClubSummary[] | null>(null);
  const [mine, setMine] = useState<BookClubSummary[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  async function load() {
    if (!user) return;
    const [discovered, owned] = await Promise.all([
      discoverClubs(user.id),
      getMyClubs(user.id),
    ]);
    setDiscover(discovered);
    setMine(owned);
  }

  useEffect(() => {
    if (!user) return;
    void load().catch((err) => {
      console.error("[clubs] load failed:", err);
      setDiscover([]);
      setMine([]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (user === undefined) {
    return <LoadingState message="Loading book clubs…" />;
  }

  if (!user) return null;

  const tabOptions: { id: ClubsTab; label: string }[] = [
    { id: "discover", label: "Discover" },
    { id: "yours", label: "Your clubs" },
  ];

  const activeList = tab === "discover" ? discover : mine;

  return (
    <div className={layout.pageStack}>
      <div className="-mx-4 feed-header-gradient px-4 pb-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <header className={layout.pageHeader}>
          <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Book Clubs</h1>
          <p className="mx-auto mt-1 max-w-xl text-pretty text-text-muted">
            Find your people, read together, and dive into discussions around the books you love.
          </p>
        </header>

        <div className="mt-6 flex justify-center">
          <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>
            Start a club
          </Button>
        </div>
      </div>

      <div className="pill-tabs" role="tablist" aria-label="Book clubs">
        {tabOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={tab === option.id}
            data-active={tab === option.id ? "true" : "false"}
            className={cn("pill-tab")}
            onClick={() => setTab(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {!activeList ? (
        <LoadingState message="Loading book clubs…" />
      ) : activeList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background px-6 py-12 text-center">
          {tab === "discover" ? (
            <>
              <p className="font-medium text-puce-red">No public clubs yet</p>
              <p className="mt-2 text-sm text-text-muted">
                Be the first to start a book club and invite readers to join the conversation.
              </p>
              <div className="mt-6">
                <Button type="button" variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                  Start a club
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-puce-red">You haven&apos;t joined any clubs</p>
              <p className="mt-2 text-sm text-text-muted">
                Browse the Discover tab to find a club, or start your own.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button type="button" variant="primary" size="sm" onClick={() => setTab("discover")}>
                  Discover clubs
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                  Start a club
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {activeList.map((club) => (
            <li key={club.id}>
              <ClubCard club={club} />
            </li>
          ))}
        </ul>
      )}

      <CreateClubModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        currentUserId={user.id}
      />
    </div>
  );
}

export default function ClubsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading book clubs…" />}>
      <ClubsPageContent />
    </Suspense>
  );
}
