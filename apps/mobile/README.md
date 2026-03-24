# Colanode Mobile

> **Status:** Experimental and not production-ready.
> The mobile app exists to help the team iterate on Colanode's native experience, validate product decisions, and share as much logic as possible with the web and desktop clients.

## Overview

Colanode Mobile is an Expo + React Native client for Colanode's local-first collaboration platform. It reuses the same shared data model and sync stack as the other apps:

- `@colanode/client` for local database access, queries, mutations, and sync
- `@colanode/core` for schemas, types, permissions, and business rules
- `@colanode/crdt` for Yjs-backed collaborative documents
- `@colanode/ui` for shared editor behavior, database components, and UI building blocks where it makes sense

The app is mostly native React Native UI. The main exception is content editing: the rich-text editor, database views, and record detail screens run as a browser app inside a `WebView`, while the surrounding shell, routing, data access, and native integrations stay in React Native.

## Architecture

```mermaid
graph TB
    subgraph Clients
        Web["Web App<br/>(Vite + React)"]
        Desktop["Desktop App<br/>(Electron)"]
        Mobile["Mobile App<br/>(Expo + React Native)"]
    end

    subgraph "Shared Packages"
        Core["@colanode/core<br/>Types, schemas, permissions"]
        Client["@colanode/client<br/>Queries, mutations, sync"]
        CRDT["@colanode/crdt<br/>Yjs documents"]
        UI["@colanode/ui<br/>Shared editor + components"]
    end

    subgraph Server
        API["Fastify API Server"]
        WS["WebSocket"]
        Postgres[(Postgres)]
        Redis[(Redis)]
        Jobs["BullMQ Jobs"]
    end

    Web --> Core & Client & CRDT & UI
    Desktop --> Core & Client & CRDT & UI
    Mobile --> Core & Client & CRDT & UI

    Web -- "HTTP + WS" --> API
    Desktop -- "HTTP + WS" --> API
    Mobile -- "HTTP + WS" --> API

    API --> Postgres & Redis
    WS --> Redis
    Jobs --> Postgres & Redis

    style Mobile fill:#4B7BE5,color:#fff
```

### How data flows on mobile

```mermaid
sequenceDiagram
    participant User
    participant Screen as Native Screen
    participant SQLite as Local SQLite
    participant Sync as MutationService
    participant Server as Colanode Server

    User->>Screen: Tap / type / interact
    Screen->>SQLite: Write locally (optimistic)
    Screen-->>User: UI updates instantly
    SQLite->>Sync: Queue mutation
    Sync->>Server: POST /mutations (batched)
    Server-->>Sync: ACK + revision
    Server->>Screen: WebSocket push (other changes)
    Screen->>SQLite: Apply remote updates
    SQLite-->>Screen: Reactive query fires
    Screen-->>User: UI refreshes
```

### How the embedded editor WebView works

The WebView hosts three rendering modes — page editing, database views, and record detail — all sharing the same bridge and communication protocol.

```mermaid
sequenceDiagram
    participant Screen as Native Screen
    participant WV as WebView
    participant Bridge as Bridge Messages
    participant App as AppService

    Screen->>WV: Load editor.html asset
    WV->>Bridge: "ready"
    Screen->>WV: init (mode, CRDT state, theme, permissions)
    WV->>WV: Render based on mode:<br/>page → TipTap editor<br/>database → database table view<br/>record → record attributes + editor

    loop User edits
        WV->>Bridge: mutation.request
        Bridge->>App: Execute via mediator
        App-->>Bridge: Result
        Bridge-->>WV: mutation.response
    end

    loop Data subscriptions
        WV->>Bridge: query.subscribe.request
        Bridge->>App: Subscribe via mediator
        App-->>Bridge: Initial data
        App->>Bridge: event.publish (live updates)
        Bridge-->>WV: Collection updates
    end

    Note over Screen,WV: CRDT updates debounced (500ms),<br/>flushed on background/navigate
```

## What Exists Today

- **Authentication:** server selection, OTP login, registration, password reset
- **Messaging:** chat and channel browsing, message sending, replies, reactions, editing, deletion
- **Content:** spaces, folders, files, pages, databases, records, and workspace navigation
- **Page editing:** inline rich-text editing via embedded TipTap WebView (paragraph, headings, lists, tasks, blockquotes, code blocks, tables, horizontal rules, inline databases)
- **Database views:** table view with inline field editing, record creation, view tabs, filters, sorts, and settings — rendered inside the WebView using shared `@colanode/ui` database components
- **Record editing:** record attributes (name, fields) and rich-text body editing, also rendered in the WebView
- **File management:** file picking, upload (resumable via tus-js-client), download, and preview
- **Workspaces:** workspace switching, creation, and basic settings
- **Members:** member list, invite flow with email chips and role picker
- **Offline support:** reads from local SQLite cache, offline-aware UI with network banner
- **Unread tracking:** unread dots on chat list items, unread summary on home screen
- **Theming:** dark and light mode with system preference detection

## Getting Started

### Prerequisites

- Node.js (see the repository root for the expected version)
- npm
- Xcode for iOS Simulator and/or Android Studio for Android Emulator
- A running Colanode server

### Install dependencies

From the repository root:

```bash
npm install
```

### Run the mobile app

```bash
cd apps/mobile
npm run ios       # iOS Simulator
npm run android   # Android Emulator
npm run start     # Expo dev server only
```

The `prestart`, `preios`, and `preandroid` scripts build and copy the embedded editor asset before Expo starts.

## Project Structure

```text
apps/mobile/
├── app/                               # Expo Router file-based routes
│   ├── _layout.tsx                    # Root: AppService init, QueryClient, SplashScreen
│   ├── (auth)/                        # Auth screens
│   │   ├── index.tsx                  #   Server selection
│   │   ├── login.tsx                  #   Email/password + OTP login
│   │   ├── register.tsx               #   Registration
│   │   ├── reset.tsx                  #   Password reset
│   │   ├── server-add.tsx             #   Add custom server
│   │   └── create-workspace.tsx       #   First workspace creation
│   └── (app)/                         # Main app (tabs)
│       ├── _layout.tsx                # Tab navigator + WorkspaceContext
│       ├── (home)/index.tsx           # Unread summary, recent chats, quick actions
│       ├── (chats)/                   # Chat tab
│       │   ├── index.tsx              #   Chat list
│       │   ├── [chatId].tsx           #   Conversation view
│       │   └── new-chat.tsx           #   Create chat
│       ├── (spaces)/                  # Spaces tab
│       │   ├── index.tsx              #   Space list
│       │   ├── create-space.tsx       #   Create space form
│       │   ├── space/[spaceId].tsx    #   Space children browser
│       │   ├── channel/[channelId].tsx#   Channel messages
│       │   ├── page/[pageId]/         #   Page viewer/editor (WebView)
│       │   ├── database/[databaseId].tsx # Database view (WebView)
│       │   ├── record/[recordId].tsx  #   Record detail + editor (WebView)
│       │   ├── file/[fileId].tsx      #   File preview/download
│       │   └── folder/[folderId].tsx  #   Folder contents
│       └── (settings)/                # Settings tab
│           ├── index.tsx              #   Settings home
│           ├── account.tsx            #   Account + avatar upload
│           ├── workspace.tsx          #   Workspace settings
│           ├── members.tsx            #   Member list
│           ├── invite.tsx             #   Invite members
│           ├── create-workspace.tsx   #   Create workspace
│           └── about.tsx              #   App info
├── src/
│   ├── components/
│   │   ├── ui/                        # Reusable: buttons, inputs, sheets, banners
│   │   ├── messages/                  # Message list, items, input, reactions, actions
│   │   ├── nodes/                     # Node icons, child lists, create/rename/action sheets
│   │   ├── pages/                     # WebView wrapper, editor toolbar, block type sheet
│   │   ├── auth/                      # Login, register, verify, reset forms
│   │   ├── avatars/                   # Avatar display + picker
│   │   ├── emojis/                    # Emoji picker (categories + search)
│   │   ├── chats/                     # Chat list items with unread badges
│   │   ├── spaces/                    # Space list items
│   │   ├── files/                     # File list items
│   │   ├── workspaces/                # Workspace switcher, create form
│   │   └── conversation/              # Shared conversation screen
│   ├── contexts/                      # App service, workspace, theme, switcher
│   ├── hooks/                         # useLiveQuery, useQuery, useMutation, useNodeRole, etc.
│   ├── services/                      # Expo implementations: filesystem, SQLite, paths
│   ├── lib/                           # Crypto polyfill, colors, query client, utils
│   └── mocks/                         # Metro mocks for browser-only modules
├── webviews/
│   └── editor/                        # Embedded editor (separate Vite build)
│       ├── src/
│       │   ├── main.tsx               # Bootstrap: lazy-loads bridge + editor
│       │   ├── bridge.ts             # Native ↔ WebView message protocol
│       │   ├── editor.tsx            # Root component: mode routing, contexts, keyboard
│       │   ├── document-editor.tsx   # TipTap rich-text editor (page/record body)
│       │   ├── database-runtime.tsx  # Database table view (mobile-specific layout)
│       │   ├── record-runtime.tsx    # Record attributes + document editor
│       │   ├── extensions/           # TipTap node extensions (database, page, file, folder)
│       │   └── views/               # TipTap node views (database, page, file, folder, mention)
│       ├── vite.config.ts             # Builds to single HTML file
│       └── editor.html                # Entry HTML
├── assets/
│   └── editor-dist/editor.html        # Built editor asset (copied by pre-scripts)
├── scripts/copy-editor.js             # Builds + copies editor before Expo starts
├── index.js                           # Entry: crypto polyfill → expo-router
├── app.json                           # Expo config (iOS + Android)
├── eas.json                           # EAS Build profiles
├── metro.config.js                    # Asset extensions, module mocks
└── tsconfig.json                      # TypeScript config with package aliases
```

## Key Layers

### 1. Native mobile shell

The Expo / React Native app handles everything except the rich-text and database editor DOM:

- File-based routing via Expo Router with `(auth)` and `(app)` route groups
- Tab navigation: Home, Spaces, Chats, Settings
- Native screens and components for all UI
- Expo-backed services for filesystem, SQLite, camera/media, clipboard, and network detection
- TanStack Query for data fetching with event bus integration

### 2. Shared local-first data layer

The mobile app follows the same local-first model as the desktop and web clients:

1. **Reads** come from the local SQLite cache (instant).
2. **Writes** are applied locally first (optimistic).
3. **Mutations** sync to the server in batches via HTTP.
4. **CRDT updates** merge concurrent document edits via Yjs.
5. **WebSocket synchronizers** keep local state fresh with cursor-based streaming.

This is why mobile can reuse `@colanode/client`, `@colanode/core`, and `@colanode/crdt` instead of reimplementing business logic.

### 3. Embedded editor WebView

Rich-text editing, database views, and record detail screens are implemented as an embedded browser app loaded into a React Native `WebView`.

Why:

- The shared editor stack (TipTap / ProseMirror) depends on DOM APIs
- Database and record UIs use `@colanode/ui` components built with Radix UI, TanStack DB, and Tailwind CSS — all browser-only
- React Native cannot run DOM-based editor or UI code directly
- A WebView gives the app a browser runtime inside the native screen
- This lets mobile reuse the shared web components instead of maintaining parallel implementations

The editor lives in `webviews/editor/`, has its own Vite build, and produces a single HTML file that Metro bundles as an asset. The native `PageWebView` component loads it and communicates via a bidirectional message bridge.

The WebView operates in three modes:

| Mode | Renders | Used by |
|---|---|---|
| `page` | TipTap rich-text editor with inline database blocks | `page/[pageId]` |
| `database` | Database table view with view tabs, filters, sorts | `database/[databaseId]` |
| `record` | Record attributes (name, fields) + TipTap body editor | `record/[recordId]` |

### 4. Database and record rendering

Database views and record editing run inside the WebView and use shared `@colanode/ui` components (database table, record attributes, field value editors, view settings, etc.) via TanStack DB collections that communicate with native through the bridge.

The WebView's `database-runtime.tsx` intentionally reimplements some of the surrounding table/view/header layout rather than reusing the full shared `DatabaseViews` component from `packages/ui`. This is because the shared components include desktop-specific features (drag-and-drop column reordering, column resizing, board/calendar layouts) that don't work well on mobile. The mobile-specific layout provides a touch-friendly table view while still reusing the shared data layer, field value components, and database context providers. Consolidating these into a single responsive implementation in `packages/ui` is a future goal.

## Metro Configuration

`metro.config.js` is customized for mobile-specific needs:

- **Asset extensions:** `.db` (emoji/icon databases) and `.html` (embedded editor)
- **Empty mocks:** `@tiptap/core`, `@tiptap/pm` (DOM-dependent, pulled in via barrel exports but not used at runtime)
- **Custom mocks:** `isomorphic-webcrypto` (delegates to native `globalThis.crypto`)
- **Blocked patterns:** `kysely/dist/*file-migration-provider` (webpack-specific, incompatible with Hermes)

The custom `index.js` entry point loads `crypto-polyfill.ts` before anything else, ensuring `crypto.getRandomValues` is available when `ulid` and Yjs modules initialize.

## Working On The Embedded Editor

Browser-side editor code lives in `webviews/editor/src/`. Native hosting and bridge code lives in `src/components/pages/page-webview.tsx`. The native screens are at `app/(app)/(spaces)/page/[pageId]/index.tsx`, `database/[databaseId].tsx`, and `record/[recordId].tsx`.

```bash
# Rebuild the editor after changes
cd apps/mobile/webviews/editor
npm run build

# Run the app (pre-scripts rebuild automatically)
cd apps/mobile
npm run ios
```

The bridge protocol supports:

| Direction | Messages |
|---|---|
| Native → WebView | `init`, `state.update`, `theme.change`, `permission.change`, `flush`, `block.command`, `keyboard.show`, `keyboard.hide`, `editor.blur`, `event.publish` |
| WebView → Native | `ready`, `mutation.request`, `query.request`, `query.subscribe.request`, `query.unsubscribe.request`, `navigate.node`, `navigate.url`, `editor.focus`, `error` |

The WebView uses TanStack DB collections for reactive data access. Collections subscribe to queries via the bridge (`query.subscribe.request`) and receive live updates through forwarded events (`event.publish`). This gives database and record views the same reactive behavior as the web/desktop apps.

## Dependencies

| Category | Key packages |
|---|---|
| Framework | `expo` ~54, `react` 19.1, `react-native` 0.81 |
| Routing | `expo-router` ~6 |
| State | `@tanstack/react-query` ^5 |
| Platform APIs | `expo-file-system`, `expo-sqlite`, `expo-crypto`, `expo-image-picker`, `expo-document-picker`, `expo-clipboard` |
| Network | `@react-native-community/netinfo` |
| WebView | `react-native-webview` ^13 |
| UI | `react-native-svg`, `react-native-screens`, `react-native-safe-area-context` |

## Notes And Tradeoffs

- The app is still evolving quickly, so some flows are intentionally incomplete.
- The page title is managed by the native screen header, while the document body is managed by the embedded editor.
- Using a WebView for the editor and database views adds build/bridge complexity, but lets the app reuse the shared web component stack instead of maintaining parallel implementations in pure React Native.
- Database views on mobile currently support the table layout only. Board and calendar layouts are not available on mobile and the view shows a message directing users to switch to a table view.
- The mobile `database-runtime.tsx` reimplements some table/view layout that exists in shared `packages/ui` because the shared version includes desktop-specific drag-and-drop and resize features. Consolidating into a responsive shared implementation is planned for the future.
- No inline mark editing (bold/italic) in the editor yet — plain text formatting per block only.
- No push notifications yet.
