# Colanode Mobile

> **Status:** Experimental and not production-ready.
> The mobile app exists to help the team iterate on Colanode's native experience, validate product decisions, and share as much logic as possible with the web and desktop clients.

## Overview

Colanode Mobile is an Expo + React Native client for Colanode's local-first collaboration platform. It reuses the same shared data model and sync stack as the other apps:

- `@colanode/client` for local database access, queries, mutations, and sync
- `@colanode/core` for schemas, types, permissions, and business rules
- `@colanode/crdt` for Yjs-backed collaborative documents
- `@colanode/ui` for shared editor behavior and UI building blocks where it makes sense

The app is mostly native React Native UI. The main exception is page editing: the rich-text editor runs as a small browser app inside a `WebView`, while the surrounding shell, routing, data access, and native integrations stay in React Native.

## What Exists Today

- Authentication: server selection, OTP login, registration, password reset
- Local-first chat and channel browsing
- Spaces, folders, files, pages, and workspace navigation
- Page viewing and editing
- File picking and uploads from the device
- Workspace switching and basic settings flows
- Offline-aware reads from the local SQLite cache

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
npm run ios
```

```bash
cd apps/mobile
npm run android
```

```bash
cd apps/mobile
npm run start
```

The `prestart`, `preios`, and `preandroid` scripts prepare the embedded page editor asset before Expo starts.

## High-Level Architecture

There are three important layers:

### 1. Native mobile shell

This is the real Expo / React Native app:

- file-based routes under `app/`
- native screens and components under `src/`
- Expo-backed services for filesystem, SQLite, paths, media picking, and platform integration

This layer owns:

- navigation
- auth flow
- workspace selection
- chat UI
- native sheets and action menus
- loading data from the local client services
- sending mutations and handling platform integrations

### 2. Shared local-first data layer

The mobile app follows the same local-first model as the desktop and web clients:

1. Reads come from the local SQLite cache.
2. Writes are applied locally first.
3. Mutations sync to the server in the background.
4. CRDT updates merge concurrent document edits.
5. WebSocket-based synchronizers keep local state fresh.

This is why mobile can reuse so much from `@colanode/client`, `@colanode/core`, and `@colanode/crdt` instead of reimplementing business logic in the app.

### 3. Embedded page editor

Rich-text page editing is implemented as an embedded browser app loaded into a React Native `WebView`.

Why this exists:

- the shared editor stack is browser-oriented
- TipTap / ProseMirror depend on DOM APIs
- React Native cannot run DOM-based editor code directly
- a `WebView` gives the app a browser runtime inside the native screen

So the page editor is effectively "a tiny website shipped inside the app".

## How Page Editing Works

The page screen is still a native screen, but the document body is rendered by the embedded editor.

High-level flow:

1. The native page screen loads the page node, current document state, and pending document updates using the shared mobile hooks.
2. `PageWebView` loads a local HTML asset into `react-native-webview`.
3. That HTML boots the embedded editor app, which uses `react-dom` and the shared editor stack.
4. The editor sends a `ready` message to the native shell.
5. The native shell sends initial state, theme, permissions, and document data into the WebView.
6. When the editor needs queries or mutations, it sends bridge messages back to native.
7. The native app executes those operations through the existing mediator and returns the results.

In practice:

- native owns the page screen, routing, theme, and app services
- the embedded browser app owns the DOM-based editor UI
- the bridge connects the two

## Embedded Editor Setup

The editor lives in its own browser-oriented mini-app:

```text
apps/mobile/webviews/editor/
```

That directory has its own:

- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `editor.html`
- browser-side `src/`

The editor is built into a single HTML file:

```text
apps/mobile/webviews/editor/dist/editor.html
```

Then the copy script:

```text
apps/mobile/scripts/copy-editor.js
```

copies the built file into:

```text
apps/mobile/assets/editor-dist/editor.html
```

Metro bundles that copied HTML asset with the native app, and `PageWebView` loads it at runtime.

This split is intentional:

- `apps/mobile/src/**` stays native-only
- `apps/mobile/webviews/editor/**` stays browser-only

Keeping those runtimes separate makes the build, TypeScript config, and mental model much clearer.

## Project Structure

```text
apps/mobile/
├── app/                       # Expo Router routes
│   ├── (auth)/                # Authentication flows
│   └── (app)/                 # Main application routes
├── src/
│   ├── components/            # Native React Native UI
│   ├── contexts/              # App, theme, workspace, and other providers
│   ├── hooks/                 # Query, mutation, and platform hooks
│   ├── lib/                   # Mobile-specific helpers
│   ├── mocks/                 # Metro mocks for browser-only modules
│   └── services/              # Expo-backed implementations for client services
├── scripts/
│   └── copy-editor.js         # Builds/copies the embedded editor asset
├── webviews/
│   └── editor/                # Browser app used inside the page WebView
├── assets/
│   └── editor-dist/           # Generated HTML asset loaded by the WebView
├── metro.config.js            # Metro asset + module resolution customization
└── README.md
```

## Key Mobile-Specific Pieces

### Routing

Expo Router is used for file-based routing. The app is split into `(auth)` and `(app)` route groups, with nested stacks and tabs for the main experience.

### Contexts and services

The mobile app wires shared client abstractions to Expo APIs:

- filesystem access
- local SQLite database access
- path resolution
- network state
- theming and workspace state

### Queries and mutations

The hooks in `src/hooks/` wrap the shared client mediator so screens and components can read from the local database and execute mutations without duplicating business logic.

### Metro configuration

`metro.config.js` is customized so the mobile app can:

- bundle `.db` assets such as emoji/icon databases
- bundle `.html` assets for the embedded editor
- mock browser-only dependencies that should not execute in the native runtime

## Working On The Embedded Editor

If you are changing the page editor itself:

- browser-side editor code lives in `apps/mobile/webviews/editor/src/`
- native hosting/bridge code lives in `apps/mobile/src/components/pages/page-webview.tsx`
- the native page screen lives in `apps/mobile/app/(app)/(spaces)/page/[pageId]/index.tsx`

Useful commands:

```bash
cd apps/mobile/webviews/editor
npm run build
```

```bash
cd apps/mobile/webviews/editor
npm run compile
```

```bash
cd apps/mobile
npm run ios
```

## Notes And Tradeoffs

- The app is still evolving quickly, so some flows are intentionally incomplete.
- The page title is managed by the native screen header, while the document body is managed by the embedded editor.
- Using a `WebView` for the editor is a tradeoff: it adds build/bridge complexity, but it allows the app to reuse the mature shared web editor stack instead of maintaining a second rich-text editor implementation in pure React Native.
