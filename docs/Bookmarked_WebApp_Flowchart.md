# Bookmarked — Web App Flowcharts

Standalone architecture and user-flow diagrams for the Bookmarked web application.  
**Live:** https://bookmarked.online

---

## 1. User Journey (Signup → Social)

```mermaid
flowchart TD
    Start([Visitor lands on /]) --> AuthChoice{Has account?}
    AuthChoice -->|No| Signup[/signup/]
    AuthChoice -->|Yes| Login[/login/]
    Signup --> SupaAuth[Supabase Auth: create user]
    Login --> SupaSession[Supabase Auth: session + Remember me]
    SupaAuth --> ProfileSetup[/profile/setup/]
    SupaSession --> Guard{Profile complete?}
    Guard -->|No| ProfileSetup
    Guard -->|Yes| Dashboard[/dashboard/]
    ProfileSetup --> Dashboard

    Dashboard --> Search[/search/]
    Dashboard --> Library[/library/]
    Dashboard --> ReadingRoom[/reading-room/]

    Search --> OL[Open Library API search]
    OL --> EditionPick{Multiple editions?}
    EditionPick -->|Yes| Picker[Edition picker modal]
    EditionPick -->|No| AddShelf[Add to shelf]
    Picker --> AddShelf
    AddShelf --> BookPage[/book/?id=uuid/]

    BookPage --> Progress[Reading progress panel]
    BookPage --> Review[Write review]
    BookPage --> Journal[Reading journal / sessions]
    BookPage --> Notes[Reading notes & quotes]

    Library --> Shelves[Want to read / Reading / Read / Custom]
    Shelves --> BookPage
    ReadingRoom --> Analytics[Charts, streaks, goals]
    ReadingRoom --> NotesRoom[Notes & quote highlights]
    ReadingRoom --> Recs[Because you read recommendations]

    Dashboard --> Feed[/feed/]
    Feed --> Post[Compose post: text, images, GIFs, @mentions]
    Feed --> Discover[For You / Following tabs]
    Post --> Notify[Notifications]

    Dashboard --> ReaderProfile[/reader/?username=/]
    ReaderProfile --> Follow[Follow / unfollow]
    ReaderProfile --> Message[Start DM]
    ReaderProfile --> ReaderLib[/reader-library/?username=/]
    Message --> Thread[/messages/thread/?id=/]

    Dashboard --> Profile[/profile/]
    Profile --> Import[Goodreads CSV import]
    Profile --> Avatar[Avatar upload → Supabase Storage]
    Profile --> Privacy[Shelf privacy controls]
    Profile --> NotifPrefs[Notification preferences]

    NotesGlobal[/notes/] --> SearchNotes[Search all reading notes]
```

---

## 2. App Navigation Map (Main Routes)

```mermaid
flowchart LR
    subgraph Public["Public (no auth)"]
        Landing["/"]
        Privacy["/privacy"]
        Terms["/terms"]
        Login["/login"]
        Signup["/signup"]
    end

    subgraph AppNav["Authenticated — Navbar"]
        Dashboard["/dashboard"]
        Feed["/feed"]
        ReadingRoom["/reading-room"]
        Notes["/notes"]
        Library["/library"]
        Search["/search"]
        Messages["/messages"]
        Profile["/profile"]
    end

    subgraph LibraryRoutes["Library sub-routes"]
        LibMain["/library"]
        Want["/library/want-to-read"]
        Reading["/library/reading"]
        Read["/library/read"]
        Custom["/library/custom"]
        ShelfDyn["/library/:shelf"]
    end

    subgraph DetailRoutes["Detail & social routes"]
        Book["/book/?id="]
        Author["/author/?key="]
        Reader["/reader/?username="]
        ReaderLib["/reader-library/?username="]
        Thread["/messages/thread/?id="]
        Notifications["/notifications"]
        Setup["/profile/setup"]
    end

    Landing --> Login
    Landing --> Signup
    Login --> Dashboard
    Signup --> Setup
    Setup --> Dashboard

    Dashboard --- Feed
    Feed --- ReadingRoom
    ReadingRoom --- Notes
    Notes --- LibMain
    LibMain --- Want
    LibMain --- Reading
    LibMain --- Read
    LibMain --- Custom
    Search --- Book
    Book --- Author
    Messages --- Thread
    Profile --- Setup
    Feed --- Reader
    Reader --- ReaderLib
    Profile --- Notifications
```

---

## 3. Data Flow (Open Library, Supabase, Giphy)

```mermaid
flowchart TB
    subgraph Client["Next.js static web app (GitHub Pages)"]
        UI[Pages & components]
        Services[lib/services]
        Hooks[React hooks + Supabase client]
    end

    subgraph External["External APIs"]
        OL[Open Library API<br/>search, works, editions, authors]
        GB[Google Books API<br/>cover fallback]
        Giphy[Giphy API<br/>GIF search in posts & messages]
    end

    subgraph Supabase["Supabase (PostgreSQL + Auth + Storage + Realtime)"]
        Auth[Auth: sessions, JWT]
        DB[(Tables: profiles, books, user_books,<br/>reviews, activity_events, follows,<br/>posts, messages, notifications,<br/>reading_sessions, reading_notes, …)]
        Storage[Storage: avatars, post images,<br/>message attachments]
        RT[Realtime: feed, notifications,<br/>messages optional]
    end

    UI --> Services
    Services --> Hooks
    Hooks --> Auth
    Hooks --> DB
    Hooks --> Storage
    Hooks --> RT

    Services -->|Book search & metadata| OL
    Services -->|Missing covers| GB
    Services -->|GIF picker| Giphy

    OL -->|Cache catalog row| DB
    UI -->|CRUD library, social, journal| DB
    UI -->|Upload media| Storage
    DB -->|Push updates| RT
    RT --> UI
```

---

## 4. Reading & Journal Flow

```mermaid
flowchart TD
    Book[/book/?id=/] --> OnShelf{On a shelf?}
    OnShelf -->|Add| ShelfPick[Want to read / Reading / Read]
    ShelfPick --> StartRead[Mark started → currently_reading]
    StartRead --> Sessions[reading_sessions table]
    Sessions --> SessionNote[Per-session journal note]
    StartRead --> Progress[pages / percent progress]
    Progress --> Finish[Mark finished → read shelf]
    Finish --> Review[reviews table + activity_events]

    Book --> ReadingNotes[reading_notes: quotes & highlights]
    ReadingNotes --> NotesPage[/notes/ global search]
    ReadingNotes --> ProfileNotes[Profile & reader pages]
    ReadingNotes --> RoomNotes[Reading Room timeline]

    Dashboard --> Charts[Activity charts]
    ReadingRoom --> Charts
    Charts --> Sessions
```

---

## 5. Social & Messaging Flow

```mermaid
flowchart TD
    Feed[/feed/] --> Tab{Feed tab}
    Tab --> ForYou[For You — ranked discovery]
    Tab --> Following[Following — people you follow]
    Feed --> Compose[Post composer]
    Compose --> Drafts[post_drafts autosave]
    Compose --> Attach[Images / GIFs / @mentions]
    Compose --> Posts[(posts table)]
    Posts --> Likes[post_likes]
    Posts --> Comments[post_comments + replies]
    Posts --> Repost[Quote repost with commentary]
    Posts --> Activity[activity_events]

    Reader[/reader/?username=/] --> FollowEdge[(follows)]
    FollowEdge --> Following
    Reader --> DM[Message button]
    DM --> Conv[(conversations + messages)]
    Conv --> Thread[/messages/thread/?id=/]
    Thread --> MsgAttach[Image & GIF attachments]

    Activity --> Notif[(notifications)]
    Notif --> NotifPage[/notifications/]
    Notif --> Browser[Browser toast alerts]
```

---

*Generated July 2026 — aligned with production at https://bookmarked.online*
