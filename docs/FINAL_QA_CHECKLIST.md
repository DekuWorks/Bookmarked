# Final QA Checklist

Use this checklist for every release candidate. Record the build, device/browser versions, and any exceptions in the release notes.

## Product surfaces

- [ ] Cross-browser: Chrome, Safari, Firefox, and Edge complete sign-in, library, reading, feed, and billing flows.
- [ ] Responsive: test 320px, 375px, 768px, 1024px, and desktop navigation, modals, tables, and sticky controls.
- [ ] iPhone: validate current iOS on a small device and a notched device; check safe areas, keyboard, deep links, and IAP restore.
- [ ] Accessibility: keyboard navigation, visible focus, semantic labels, screen-reader names, color contrast, text scaling, and reduced motion.
- [ ] Dark mode: verify all screens, overlays, image fallbacks, and third-party checkout handoffs.
- [ ] Performance: capture Web Vitals, cold-start mobile timing, image loading, and slow-network behavior for large libraries and feeds.
- [ ] Animations: verify reduced-motion behavior, no layout shifts, and gestures remain responsive.

## Data and subscriptions

- [ ] Migrations: apply to a clean database and an upgrade database; validate RLS, indexes, constraints, and rollback strategy.
- [ ] Subscriptions: test Free, Plus, and Home feature gates; Stripe checkout/webhook/portal, Apple purchase/restore, expiry, cancellation, and cross-platform sync.
- [ ] Membership copy: Free, Bookmarked Plus, and Bookmarked Home feature matrices are accurate on web and iOS.
- [ ] Reading DNA: verify free top three traits; Plus dashboard, AI-insight, and book-match hooks; Home monthly-update, DNA Match %, and Reader Map filter stubs.

## Sprint 2 + 5 feedback (web + iOS)

- [ ] Like sparkles: unliked→liked only; brand lilac particles; reduced-motion uses button glow (no particles); taps/scroll unaffected.
- [ ] Discovery carousels: equal card heights with/without ratings; covers align; swipe/scroll smooth.
- [ ] Saved badge: flush top-left on covers (web + iOS); fully visible; save/unsave unchanged.
- [ ] Notes location: `Page 48 • Chapter 2` (never bare `Page 48 • 2`).
- [ ] Note tags: all categories (incl. custom) show colored pill backgrounds in light + dark.
- [ ] Home Notes: exactly 5 newest; **Open Full Notes Page** above the list.
- [ ] Full Notes: **Return to Home Notes** at bottom opens Reading Room Notes tab (`/reading-room/?tab=notes` / `/?tab=notes`).

## Reading and community regression

- [ ] Feed stress: load long feeds, discovery cards, likes, comments, reposts, media, empty states, and retry/error states.
- [ ] CSV import: test valid Goodreads exports, malformed rows, duplicates, missing page counts, and large imports.
- [ ] Audiobook: validate progress, duration/page-count fallback, completion, reviews, and stats.
- [ ] Series: validate ordering, edition changes, re-reads, shelf changes, and series navigation.
- [ ] Regression: exercise sign-up, profile, search, book detail, shelves, Reading Room, notes, reviews, clubs/events, messages, notifications, and account settings on both web and mobile.

## Production deploy

- [ ] Confirm production environment variables, Stripe product/price IDs, webhook secrets, Apple settings, and Supabase Edge Function secrets.
- [ ] Run typecheck, unit tests, lint, build/static export, and migration verification from a clean checkout.
- [ ] Review error tracking, analytics, CSP/headers, robots/sitemap, and production auth redirect URLs.
- [ ] Deploy migrations before clients that require them; verify live health checks and one real Free-to-paid activation.
- [ ] Publish iOS build only after TestFlight smoke test; monitor checkout, auth, feed, and Edge Function errors after release.
- [ ] Document the release version, migration IDs, known issues, owner, and rollback path.
