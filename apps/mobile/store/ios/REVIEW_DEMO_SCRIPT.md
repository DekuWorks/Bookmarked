# App Review Screen Recording Script

Record on a **physical iPhone** using Control Center → Screen Recording. Portrait orientation. Allow ~8–12 minutes total.

**Before you start:** Install build 7 from TestFlight (or the build you are submitting). Enable Do Not Disturb to avoid notification banners.

---

## How to run the app

### Recommended — TestFlight on a physical iPhone (use this for recording)

Apple reviewers and your demo video should use the **production build**, not a local simulator build.

1. Install **build 7** from TestFlight on your iPhone.
2. Open Bookmarked and sign in with the demo account below.
3. Record with Control Center → Screen Recording.

Production `.ipa` files from EAS are **device-only** — they cannot be installed on the iOS Simulator.

### Optional — iOS Simulator (local development only)

Use the simulator only for quick UI checks. The simulator runs a **debug build** that loads JavaScript from Metro on your Mac; it is not the same binary as TestFlight build 7.

From `apps/mobile`:

```bash
npm install
cp .env.example .env   # once — fill in Supabase keys (same as apps/web)
npm run ios            # starts Metro, builds, installs, and opens the simulator
```

If the app is **already installed** on the simulator, start Metro first and keep that terminal open:

```bash
cd apps/mobile
npm run start
# Press `i` to open iOS simulator, or tap the Bookmarked icon in the simulator
```

### Troubleshooting — red screen: "No script URL provided"

**Root cause:** A debug build was opened without the Metro bundler running. The native app has no embedded JS bundle in debug mode — it expects Metro at `http://localhost:8081`.

**Fix:**

1. In a terminal: `cd apps/mobile && npm run start` (leave it running).
2. Relaunch Bookmarked in the simulator (`npm run ios` does both steps in one command).

**Do not:**

- Tap the simulator app icon or press Run in Xcode without Metro running.
- Install the EAS production `.ipa` on the simulator (won't work — use TestFlight on a device).
- Run `expo start --dev-client` — this project does not use `expo-dev-client`.

---

**Demo credentials (moderation flows only — do not delete this account):**
- Email: `appreview@bookmarked.online`
- Password: `BookmarkedReview2026!`

---

## Part A — Terms / EULA (~2 min)

| Step | Action | What reviewers should see |
|------|--------|---------------------------|
| A1 | Open Bookmarked | Splash → login screen |
| A2 | If signed in: **Profile** tab → **Settings** → **Log out** | Returns to login |
| A3 | Tap **Create account** / sign-up link | Sign-up form |
| A4 | Point at the **checkbox** (unchecked) | Sign up button is disabled |
| A5 | Tap **Terms of Service** link | Safari opens `bookmarked.online/terms` |
| A6 | Return to app; tap **Community Guidelines** link | Safari opens terms community section |
| A7 | Check the checkbox | Checkbox shows checked state |
| A8 | *(Optional)* Show Sign up is now enabled — then go back to login | Button enabled only when checked |

**Narration tip:** "Users must accept Terms and Community Guidelines before creating an account."

---

## Part B — Sign in & profanity filter (~2 min)

| Step | Action | What reviewers should see |
|------|--------|---------------------------|
| B1 | Log in with demo account | Home / Feed loads |
| B2 | **Feed** tab → tap **compose** (+) or create-post entry | Compose screen |
| B3 | Type a profane word (e.g. a common four-letter expletive) | Text appears in field |
| B4 | Tap **Post** / submit | Alert: profanity not allowed; post blocked |
| B5 | Clear text; cancel compose | Back to feed |
| B6 | Scroll feed — if any blurred text visible, tap overlay | Frosted blur on flagged content |

**Narration tip:** "Profanity is blocked at compose time and blurred in existing content."

---

## Part C — Report content (~1.5 min)

| Step | Action | What reviewers should see |
|------|--------|---------------------------|
| C1 | **Feed** tab — find a post from another user | Post card with author |
| C2 | Tap **⋯** on the post | Action sheet: Report content, Block user |
| C3 | Tap **Report content** | Reason picker |
| C4 | Select **Harassment or hate** (or any reason) | — |
| C5 | — | Alert: "Report submitted… reviewed within 24 hours" |

**Alternate path (optional cut):** Messages tab → open a thread → long-press a message → **Report**.

---

## Part D — Block user (~1.5 min)

| Step | Action | What reviewers should see |
|------|--------|---------------------------|
| D1 | On a feed post, tap the **author avatar** or **@username** | Reader profile opens |
| D2 | Tap **⋯** (top right) | Action sheet |
| D3 | Tap **Block [name]** | Confirmation dialog |
| D4 | Tap **Block** | Alert: "User blocked" |
| D5 | Navigate back to Feed | Blocked user's posts no longer appear |

**Narration tip:** "Blocking removes content immediately and auto-files a report for our team."

---

## Part E — Account deletion (~3 min)

> **Do not delete `appreview@bookmarked.online`.** Use a throwaway account for this section.

| Step | Action | What reviewers should see |
|------|--------|---------------------------|
| E1 | Log out: **Profile** → **Settings** → **Log out** | Login screen |
| E2 | **Sign up** with a new email (e.g. `reviewdelete+DATE@yourdomain.com`) | — |
| E3 | Check terms checkbox → complete sign-up → set username | Lands in app |
| E4 | **Profile** tab → **Settings** (gear, top right) | Account settings |
| E5 | Scroll to red **Delete account** section | Description + "Delete my account" |
| E6 | Tap **Delete my account** | DELETE text field appears |
| E7 | Type `DELETE` | Field accepts text |
| E8 | Tap **Permanently delete account** | System confirmation alert |
| E9 | Tap **Delete account** (destructive) | Deletion runs → login screen |

**Narration tip:** "Account deletion is fully in-app with no website or email required."

---

## After recording

1. Stop screen recording; trim start/end if needed.
2. App Store Connect → **Bookmarked** → **App Review Information** → attach video (or add link if using Notes field).
3. Paste review notes from `metadata/review_information/notes.txt`.
4. Paste Resolution Center reply from `APP_REVIEW_REPLY.md`.
5. Select **build 7** and submit for review.

---

## Checklist

- [ ] Terms checkbox shown (disabled until checked)
- [ ] Terms / Community Guidelines links open in browser
- [ ] Profanity blocked on compose
- [ ] Report flow completed with confirmation
- [ ] Block flow completed with confirmation
- [ ] Account deletion shown on throwaway account (demo account intact)
- [ ] Video attached to App Review Information
- [ ] Build 7 selected in ASC
