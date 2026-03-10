# Colanode Mobile

> **Status:** Experimental – work in progress
> The Colanode mobile app is under active development and **not ready for production use**.
> It is included in this repository to make it easier to test, iterate, and contribute to its development.

## Overview

The mobile app brings Colanode's local-first collaboration platform to iOS and Android. Built with Expo and React Native, it shares the same `@colanode/client` and `@colanode/core` packages used by the web and desktop apps, giving it offline-first operation, CRDT-based sync via Yjs, and a local SQLite database for instant reads.

### What's implemented

- **Authentication** – Server selection, email login with OTP verification, registration, and password reset.
- **Real-time chat** – 1:1 and channel messaging with replies, editing, reactions (emoji picker with categories and search), copy, and delete.
- **Spaces & content** – Browse spaces, channels, pages, folders, and files. View rich text pages (paragraphs, task lists, tables, mentions) and preview/download files.
- **Content creation** – Create spaces, channels, pages, and folders. Upload files from the device. Rename and delete nodes.
- **Workspace management** – Switch between workspaces, create new ones, invite members, and manage roles.
- **Settings** – Account and workspace settings with avatar upload, members list, and app info.
- **Offline awareness** – Network status banner, unread counts from radar data, and pull-to-refresh throughout.

### What's not included

- Rich text editing (messages are plain text only)
- Database views
- Push notifications

## Getting started

### Prerequisites

- Node.js (see root `.nvmrc`)
- npm (workspaces are managed at the monorepo root)
- Expo CLI (`npx expo`)
- Xcode (for iOS Simulator) or Android Studio (for Android Emulator)
- A running Colanode server (see `apps/server/README.md`)

### Install dependencies

From the **repository root**:

```bash
npm install
```

This also runs the postinstall script that generates emoji and icon assets required by the app.

### Run on iOS Simulator

```bash
cd apps/mobile
npx expo run:ios
```

### Run on Android Emulator

```bash
cd apps/mobile
npx expo run:android
```

### Start the dev server only

```bash
cd apps/mobile
npx expo start
```

## Architecture

### Project structure

```
apps/mobile/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout (AppService init, auth routing)
│   ├── (auth)/             # Auth screens (login, register, reset, etc.)
│   └── (app)/              # Main app (tab navigation)
│       ├── (home)/         # Home tab – unread summary, recent activity
│       ├── (spaces)/       # Spaces tab – browse and manage content
│       ├── (chats)/        # Chats tab – messaging
│       └── (settings)/     # Settings tab – account, workspace, members
├── src/
│   ├── components/         # Reusable React Native components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom hooks (queries, mutations, network)
│   ├── lib/                # Utilities (colors, crypto polyfill, etc.)
│   ├── services/           # Mobile-specific service implementations
│   └── mocks/              # Metro bundler mocks for DOM-only packages
├── index.js                # Custom entry point (loads crypto polyfill first)
├── metro.config.js         # Bundler config with module mocking
└── app.json                # Expo configuration
```

### How it works

The app follows the same **local-first architecture** as the web and desktop clients:

1. All data reads come from a local SQLite database (instant).
2. Writes are applied locally first, then synced to the server in the background.
3. CRDT updates (Yjs) handle conflict resolution automatically.
4. A WebSocket connection keeps the local database in sync with the server.

The entry point (`index.js`) loads a `crypto.getRandomValues` polyfill before anything else — this is required because Yjs and the `ulid` ID generator call it at module load time and React Native doesn't provide it natively.

### Key layers

- **Routing** – Expo Router with `(auth)` and `(app)` route groups. The app group uses tab navigation with nested stack navigators.
- **Contexts** – `AppServiceContext` (client singleton), `WorkspaceContext` (current userId/workspaceId/role), `WorkspaceSwitcherContext`, and `ThemeProvider`.
- **Hooks** – `useLiveQuery` for reactive subscribed queries, `useQuery` for one-shot reads, `useNodeListQuery` for node lists with eventBus invalidation, and `useMutation` for writes.
- **Services** – Three mobile-specific implementations bridge `@colanode/client` interfaces to Expo APIs:
  - `MobileFileSystem` – file I/O via `expo-file-system`
  - `MobilePathService` – path resolution using Expo's `Paths` API
  - `MobileKyselyService` – SQLite via `expo-sqlite` with a custom Kysely dialect

### Metro bundler mocking

Some packages pulled in transitively by `@colanode/client` are DOM-only and would crash the React Native bundler. The `metro.config.js` handles this by redirecting:

- `@tiptap/core` and `@tiptap/pm` → empty module (rich text editor, not used on mobile)
- `isomorphic-webcrypto` → custom mock that delegates to `globalThis.crypto` (set up by the polyfill)
