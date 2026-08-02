# Book Club QA Checklist

Community Hub acceptance testing for web + native iOS. Android out of scope.

## Club creation

- [ ] Create public club → creator is owner; appears in My Clubs; redirects to club
- [ ] Create private club
- [ ] Create invite-only club
- [ ] Validation: required name, length limits, image type/size
- [ ] Similar-name warning
- [ ] Safe URL validation for meeting links
- [ ] Post-create invite step
- [ ] Share to Feed offered for public only; blocked for private/invite-only

## Invitations

- [ ] Invite follower / search user
- [ ] Multi-select + optional message
- [ ] Prevent duplicate pending invitation
- [ ] Accept → active membership + My Clubs + private access + club chat
- [ ] Decline / cancel invitation
- [ ] Blocked users excluded

## Membership

- [ ] Join public open club
- [ ] Request private/request_approval club
- [ ] Approve / decline request (owner/host)
- [ ] Leave club
- [ ] Remove member / ban member
- [ ] Transfer ownership (confirmation required)
- [ ] Owner cannot leave without transfer or delete
- [ ] Client cannot self-promote

## Discussions

- [ ] Create discussion (title, body, optional book/chapter/page, spoiler)
- [ ] Reply, edit/delete own
- [ ] Pin / lock (authorized)
- [ ] Spoiler hiding
- [ ] Search + filters
- [ ] Non-member cannot view private discussions
- [ ] Locked: readable, no new replies

## Schedule

- [ ] Create / edit / delete event (no duplicate on edit)
- [ ] List view: upcoming + past
- [ ] Calendar: month nav, today, sparkle indicators, day opens events
- [ ] Meeting link HTTPS + Copy + Join
- [ ] RSVP Going/Maybe/Not Going; cannot edit others’ RSVP
- [ ] Reminder opt-in/out; no duplicate reminders
- [ ] RSVPs preserved across edit

## Bookshelf

- [ ] Add / remove club book (does not affect personal library)
- [ ] Change category; set current read
- [ ] Previous read preserved in history
- [ ] Discussions/events for old current read retained

## Sharing

- [ ] Share public club to Feed with preview card
- [ ] Reject private/invite-only public share
- [ ] Preview opens club; no raw URL
- [ ] Visibility change to private redacts protected feed preview

## Permissions / RLS

- [ ] Member cannot edit restricted event
- [ ] Non-member cannot view private discussions/chat/meeting links
- [ ] Host can manage allowed features
- [ ] Removed/banned loses access immediately
- [ ] Direct API tests for IDOR and role escalation

## Club chat

- [ ] Message the Club opens linked group conversation
- [ ] New members added; leavers/removed lose access
- [ ] Separate from forum discussions

## Responsive / theme / a11y

- [ ] Desktop, tablet, mobile Safari
- [ ] Small/large iPhone; portrait/landscape
- [ ] Light + Dark mode contrast
- [ ] Keyboard nav (web), VoiceOver (iOS), 44×44 targets
- [ ] Reduced motion; focus trap on modals
- [ ] Horizontal tab scroll without clipped labels

## Builds

- [ ] TypeScript
- [ ] ESLint
- [ ] Unit / integration / RLS tests
- [ ] Production web build
- [ ] iOS build validation
