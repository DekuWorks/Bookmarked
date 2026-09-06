"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { SPRINT_NO_STAY_ONLINE_COPY } from "@bookmarked/utils/eventAccess";
import { LoadingState } from "@/components/ui/LoadingState";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { formatEventDateTime, listUpcomingEvents } from "@/lib/services/clubEvents";
import { listHomeExperiences } from "@/lib/services/homeExperiences";
import { clubDetailPath, clubsPath } from "@/lib/routes/clubs";
import type { BookClubEventWithClub, HomeExperience } from "@/types";
import { layout } from "@/lib/constants/layout";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useSubscription } from "@/lib/hooks/useSubscription";

function EventsPageContent() {
  const user = useAuthUser();
  const { canAccess } = useSubscription(user?.id);
  const hasHome = canAccess("home_experiences");
  const [events, setEvents] = useState<BookClubEventWithClub[] | null>(null);
  const [experiences, setExperiences] = useState<HomeExperience[]>([]);

  useEffect(() => {
    void listUpcomingEvents()
      .then(setEvents)
      .catch((err) => {
        console.error("[events] load failed:", err);
        setEvents([]);
      });
  }, []);

  useEffect(() => {
    if (!hasHome) return;
    void listHomeExperiences()
      .then(setExperiences)
      .catch(() => setExperiences([]));
  }, [hasHome]);

  return (
    <div className={layout.pageStack}>
      <div className="-mx-4 feed-header-gradient px-4 pb-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <header className={layout.pageHeader}>
          <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Events</h1>
          <p className="mx-auto mt-1 max-w-xl text-pretty text-text-muted">
            Upcoming read-alongs, meetups, and club gatherings from public clubs and clubs you belong to.
          </p>
        </header>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href={clubsPath()} variant="secondary">
            Browse clubs
          </ButtonLink>
        </div>
      </div>

      {hasHome && experiences.length ? (
        <section className="mx-auto max-w-2xl space-y-3">
          <h2 className="text-lg font-semibold text-puce-red">Home experiences</h2>
          <p className="text-sm text-text-muted">{SPRINT_NO_STAY_ONLINE_COPY}</p>
          <ul className="space-y-3">
            {experiences.map((item) => (
              <li key={item.id} className="surface-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs uppercase tracking-wide text-text-muted">{item.kind}</p>
                  {item.is_beta ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-puce-red">
                      Beta
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-1 font-semibold text-puce-red">{item.title}</h3>
                {item.description ? (
                  <p className="mt-2 text-sm text-text">{item.description}</p>
                ) : null}
                {item.venue_kind === "arbitrary_address" ? (
                  <p className="mt-2 text-xs text-rust">
                    Prefer a public venue. Meeting at a private address is allowed only with a safety
                    warning.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {events === null ? (
        <LoadingState message="Loading events…" />
      ) : events.length === 0 ? (
        <div className="surface-card mx-auto max-w-2xl px-6 py-12 text-center">
          <p className="font-medium text-puce-red">No upcoming events</p>
          <p className="mt-2 text-sm text-text-muted">
            Join a book club and schedule a meetup to see it here.
          </p>
          <ButtonLink href={clubsPath()} variant="primary" className="mt-6">
            Find a club
          </ButtonLink>
        </div>
      ) : (
        <ul className="mx-auto max-w-2xl space-y-4">
          {events.map((event) => (
            <li key={event.id} className="surface-card p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                {formatEventDateTime(event.starts_at)}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-puce-red">{event.title}</h2>
              <Link
                href={clubDetailPath(event.club.id)}
                className="mt-1 inline-block text-sm text-primary hover:underline"
              >
                {event.club.name}
              </Link>
              {event.location ? (
                <p className="mt-2 text-sm text-text-muted">{event.location}</p>
              ) : null}
              {event.description ? (
                <p className="mt-2 text-sm text-text">{event.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading events…" />}>
      <EventsPageContent />
    </Suspense>
  );
}
