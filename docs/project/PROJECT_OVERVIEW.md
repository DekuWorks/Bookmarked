# Bookmarked — Project Overview

## What Bookmarked Is

Bookmarked is a **digital home library** where readers can search, collect, organize, track, review, and visualize their reading life through interactive bookshelves and personalized reading spaces.

It combines the warmth of a cozy bookstore with modern reading tools — from virtual bookshelf views and shelf analytics to a signature **My Reading Room** experience.

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
- Mirror Reading Room, bookshelf, and grid views with the same data
- Not block web MVP delivery

## Core MVP Features

| Feature | Description |
|---------|-------------|
| **Accounts** | Sign up, log in, log out via Supabase Auth |
| **Profiles** | Username, display name, bio, avatar, favorite genres, library view preference |
| **Book search** | Search via Open Library API; cache results in Supabase |
| **Shelves** | Want to read, currently reading, read — with dedicated shelf pages |
| **Library views** | Bookshelf view, grid view, and My Reading Room |
| **Shelf analytics** | Reading stats, streaks, pages read, and per-shelf insights |
| **Reading progress** | Pages read, percent complete, start/finish dates |
| **Reviews** | Ratings, review text, spoiler flags, visibility |
| **Dashboard** | Overview of current reads, quick actions to shelves and search |
| **Responsive UI** | Mobile-first layout that scales to desktop |

## Future Features

- Animated shelf transitions and drag-and-drop book movement
- Horizontal shelf scrolling enhancements
- Social feed and following other readers
- Book clubs and group reads
- Reading streaks and goals
- Recommendations based on shelves and genres
- Supabase Storage for avatars and cover uploads
- Push notifications (mobile)
- Import from Goodreads / CSV
- Public profile pages and shareable lists

## Summary

Bookmarked is a **digital home library** where users can create accounts, search books, manage interactive shelves, track reading progress, write reviews, and visualize their collection in **My Reading Room** — with the same account on a mobile app later. Build order: web app → backend completion → mobile app.
