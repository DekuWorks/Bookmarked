# App Review Resolution Center Reply

Copy the text below into App Store Connect → your app → Resolution Center when resubmitting build **7** (version 1.0.0).

---

Hello App Review Team,

Thank you for your feedback on Bookmarked (version 1.0, build 5). We have addressed both issues in **build 7** and updated our App Review Information with a demo account and step-by-step instructions.

## Guideline 1.2 — User-Generated Content

We have implemented the following moderation features:

1. **Terms of Service / EULA** — New users must check a required box agreeing to our Terms of Service and Community Guidelines (including zero tolerance for objectionable content) before the Sign Up button is enabled. Links open our published terms at https://bookmarked.online/terms.

2. **Profanity filter** — Offensive language is blocked at compose time (posts, comments, direct messages) with a clear alert. Existing content containing profanity is shown with a frosted blur overlay in feeds and profiles.

3. **Report mechanism** — Users can report posts (⋯ menu), comments (Report link), and messages (long-press → Report). Each report captures a reason and is stored in our `content_reports` table for admin review.

4. **Block user** — Users can block others from feed post menus or reader profiles (⋯). Blocking immediately removes that user's content from the blocker's feed and automatically files a report for developer review.

5. **24-hour review policy** — All reports are reviewed by our team within 24 hours, with blocking and content removal actions taken as needed. This policy is stated in our Community Guidelines.

A screen recording on a physical device demonstrating these flows (terms checkbox, profanity block, report, block) is attached to App Review Information.

## Guideline 5.1.1(v) — Account Deletion

Bookmarked now includes a fully in-app account deletion flow:

**Profile tab → Settings → Delete account → type DELETE → Permanently delete account → confirm.**

Deletion permanently removes the user's profile, library, reviews, posts, messages, and all associated data. No website visit or email request is required.

The screen recording also demonstrates this flow using a temporary test account (the shared demo account is preserved for your review).

## Demo Account

We have provided credentials in App Review Information:

- **Email:** appreview@bookmarked.online
- **Password:** BookmarkedReview2026!
- **Username:** @appreview

Please use this account for moderation feature testing. For account deletion, please create a temporary test account as noted in the review notes so the demo account remains available.

## Build

Please review **build 7** (version 1.0.0), which includes all compliance changes listed above.

Thank you for your time. We are happy to provide any additional information.

Best regards,
Bookmarked Team
Deku Works LLC
