"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { LoadingState } from "@/components/ui/LoadingState";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { formatEventDateTime, listUpcomingEvents } from "@/lib/services/clubEvents";
import { clubDetailPath, clubsPath } from "@/lib/routes/clubs";
import type { BookClubEventWithClub } from "@/types";
import { layout } from "@/lib/constants/layout";

function EventsPageContent() {
  const [events, setEvents] = useState<BookClubEventWithClub[] | null>(null);

  useEffect(() => {
    void listUpcomingEvents()
      .then(setEvents)
      .catch((err) => {
        console.error("[events] load failed:", err);
        setEvents([]);
      });
  }, []);

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
