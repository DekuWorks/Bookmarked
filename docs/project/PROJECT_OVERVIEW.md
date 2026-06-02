# Bookmarked — Project Overview

## What Bookmarked Is

Bookmarked is a web-first reading platform where readers can discover books, organize personal shelves, track reading progress, write reviews, and share their reading journey with others. It combines the warmth of a cozy bookstore with modern, social reading tools.

## Who It Is For

- **Avid readers** who want one place to track what they read, want to read, and are currently reading
- **Book club members** who share reviews and recommendations
- **Casual readers** looking for a simple, beautiful way to log books without friction
- **Future mobile users** who will use the same account on iOS and Android

## Web-First Approach

Bookmarked is built **web-first**:

1. **Website / Web App** — Primary experience: landing page, auth, dashboard, library, search, reviews
2. **Shared Backend** — Supabase + PostgreSQL powers both web and future mobile
3. **Mobile App Later** — React Native + Expo will share auth, data, and types with the web app

The web app ships first so users can sign up, search books, manage shelves, and track progress in the browser. Mobile extends the same account and data later.

## Mobile App Later

The mobile app (React Native + Expo + TypeScript) is Phase 3. It will:

- Use the same Supabase backend and shared types in `packages/types`
- Support login, dashboard, library, reviews, and sync with web data
- Not block web MVP delivery

## Core MVP Features

| Feature | Description |
|---------|-------------|
| **Accounts** | Sign up, log in, log out via Supabase Auth |
| **Profiles** | Username, display name, bio, avatar, favorite genres |
| **Book search** | Search via Open Library API; cache results in Supabase |
| **Shelves** | Want to read, currently reading, read |
| **Reading progress** | Pages read, percent complete, start/finish dates |
| **Reviews** | Ratings, review text, spoiler flags, visibility |
| **Dashboard** | Overview of current reads, recent activity, quick actions |
| **Responsive UI** | Mobile-first layout that scales to desktop |

## Future Features

- Social feed and following other readers
- Book clubs and group reads
- Reading streaks and goals
- Recommendations based on shelves and genres
- Supabase Storage for avatars and cover uploads
- Push notifications (mobile)
- Import from Goodreads / CSV
- Public profile pages and shareable lists

## Summary

Bookmarked is a **web-first reading platform** where users can create accounts, search books, manage shelves, track reading progress, write reviews, and later use the **same account on a mobile app**. Build order: web app → backend completion → mobile app.
