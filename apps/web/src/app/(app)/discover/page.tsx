"use client";

import Link from "next/link";
import { DISCOVER_DESTINATIONS } from "@bookmarked/utils/discoverDestinations";

export default function DiscoverPage() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-6 py-2">
      <header>
        <h1 className="font-display text-4xl font-semibold text-puce-red">Discover</h1>
        <p className="mt-2 text-sm text-text-muted">Library, search, clubs, events, and messages.</p>
      </header>
      <ul className="overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-sm">
        {DISCOVER_DESTINATIONS.map((item) => (
          <li key={item.id} className="border-b border-border last:border-b-0">
            <Link
              href={item.webHref}
              className="flex min-h-14 flex-col justify-center px-4 py-3 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange"
            >
              <span className="font-semibold text-puce-red">{item.label}</span>
              <span className="text-sm text-text-muted">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
