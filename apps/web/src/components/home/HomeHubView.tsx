"use client";

import Link from "next/link";
import { HOME_HUB_NAV_LABEL, HOME_MEMBERSHIP_LABEL } from "@bookmarked/utils/bookMap";
import { CONCIERGE_COPY } from "@bookmarked/utils/homeConcierge";

const LINKS = [
  { href: "/book-map/", title: "Book Map", body: "Independent bookstores, libraries, and explicit reading cafés." },
  { href: "/reader-map/", title: "Reader Map", body: "Opt-in, coarse local discovery. Never live tracking." },
  { href: "/events/", title: "Experiences", body: "Author Q&As, virtual events, 24-hour sprints, and meetups." },
  { href: "/reading-dna/", title: "Reading DNA", body: "Deterministic identity and explainable personality." },
  { href: "/concierge/", title: "Concierge", body: CONCIERGE_COPY.featureRequestBlurb },
];

export function HomeHubView() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        {HOME_HUB_NAV_LABEL} is the {HOME_MEMBERSHIP_LABEL} dashboard. It does not replace Overview
        or the primary Home tab.
      </p>
      <ul className="grid gap-3 md:grid-cols-2">
        {LINKS.map((link) => (
          <li key={link.href} className="surface-card p-5">
            <Link href={link.href} className="font-semibold text-puce-red underline-offset-2 hover:underline">
              {link.title}
            </Link>
            <p className="mt-2 text-sm text-text-muted">{link.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
