# Bookmarked — Project Overview

## What Bookmarked Is

Bookmarked is a **digital home library** where readers can search, collect, organize, track, review, and visualize their reading life through interactive bookshelves.

It combines the warmth of a cozy bookstore with modern reading tools — virtual bookshelf views, per-shelf analytics, and a grid layout for traditional browsing.

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
- Mirror bookshelf and grid library views with the same data
- Not block web MVP delivery

## Core MVP Features

| Feature | Description |
|---------|-------------|
| **Accounts** | Sign up, log in, log out via Supabase Auth |
| **Profiles** | Username, display name, bio, avatar, favorite genres, library view preference |
| **Book search** | Search via Open Library API; cache results in Supabase |
| **Shelves** | Want to read, currently reading, read — with dedicated shelf pages |
| **Library views** | Bookshelf view and grid view (preference saved to profile) |
| **Shelf analytics** | Per-shelf stats on dedicated shelf pages |
| **Reading progress** | Pages read, percent complete, start/finish dates |
| **Reviews** | Ratings, review text, spoiler flags, visibility |
| **Dashboard** | Overview of current reads, quick actions to shelves and search |
| **Responsive UI** | Mobile-first layout that scales to desktop |

## Book metadata & covers

Book search and catalog metadata come primarily from **[Open Library](https://openlibrary.org/)**. Cover images use this order:

1. Open Library cover ID (`cover_i`) when available  
2. Open Library ISBN cover URL when an ISBN is known  
3. **Google Books API** as a fallback for newer titles without Open Library art  
4. A branded **Bookmarked placeholder** (title, author, purple/orange styling) when no cover is found  

Some newer books may not have covers in Open Library immediately; fallback handling keeps the library looking polished rather than showing broken images.

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
