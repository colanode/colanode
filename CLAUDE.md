# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Colanode is an open-source, local-first collaboration platform supporting real-time chat, rich text editing, customizable databases, and file management. It uses a sophisticated CRDT-based architecture (powered by Yjs) to enable offline-first operation with automatic conflict resolution.

## Commands

### Development

```bash
# Install dependencies (also runs postinstall script to generate emoji/icon assets)
npm install

# Development mode (runs all apps in watch mode)
npm run dev

# Watch core packages only (useful when developing core, crdt, or server)
npm run watch

# Build all packages and apps
npm run build

# Compile TypeScript without emitting files (type checking)
npm run compile

# Lint all packages
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

**Note:** Test commands exist in the codebase but there are currently no automated tests. Do not rely on `npm run test` for validation.

### Individual App Development

**Server:**
```bash
cd apps/server
cp .env.example .env  # Configure environment variables
npm run dev           # Start server with hot reload

# Start dependencies (Postgres, Redis, Mail server) via Docker Compose
docker compose -f hosting/docker/docker-compose.yaml up -d

# Include MinIO (S3-compatible storage) for testing
docker compose -f hosting/docker/docker-compose.yaml --profile s3 up -d
```

**Web:**
```bash
cd apps/web
npm run dev
```

**Desktop:**
```bash
cd apps/desktop
npm run dev
```

### Utility Scripts

Located in `scripts/`:

```bash
cd scripts

# Generate emoji assets (run from scripts directory)
npm run generate:emojis

# Generate icon assets (run from scripts directory)
npm run generate:icons

# Seed database with test data (run from scripts directory)
npm run seed
```

Note: Generated emoji and icon assets are git-ignored. These are regenerated on `npm install` via the postinstall hook.

## Architecture

### Monorepo Structure

This is a Turborepo monorepo with npm workspaces:

- **`packages/core`** - Shared types, validation schemas (Zod), business rules, and node type registry. Foundation for all other packages.
- **`packages/crdt`** - CRDT implementation wrapping Yjs. Provides type-safe document updates and conflict-free merging.
- **`packages/client`** - Client-side services, local SQLite database schema, and API communication layer. Handles mutations, synchronizers, and offline support.
- **`packages/ui`** - React components using TailwindCSS, Radix UI primitives, and TipTap editor. Shared between web and desktop apps.
- **`apps/server`** - Fastify-based API server with WebSocket support. Manages Postgres database, Redis events, and background jobs.
- **`apps/web`** - Web application (Vite + React + TanStack Router).
- **`apps/desktop`** - Electron desktop application.
- **`apps/mobile`** - React Native mobile app (experimental, not production-ready).
- **`scripts/`** - Utility scripts for generating emojis, icons, and seed data.

### Local-First Architecture

**Core Principle:** All data operations happen locally first, then sync to the server in the background.

**Client Write Path:**
1. User makes a change (e.g., edits a document)
2. Change is immediately applied to local SQLite database
3. CRDT update is generated using Yjs (as binary `Uint8Array`)
4. Update is stored in `mutations` table as a pending operation
5. `MutationService` batches and sends mutations to server via HTTP POST
6. Server validates, applies updates, and stores in Postgres
7. Server broadcasts changes to other clients via WebSocket

**Client Read Path:**
- All reads happen from local SQLite (instant response)
- `Synchronizer` services pull updates from server via WebSocket
- Updates are applied to local database in background
- UI reactively updates when local data changes

**Key Files:**
- `packages/client/src/services/workspaces/mutation-service.ts` - Mutation batching/syncing
- `packages/client/src/services/workspaces/synchronizer.ts` - Real-time sync via WebSocket
- `packages/client/src/databases/workspace/schema.ts` - Local SQLite schema
- `apps/server/src/api/client/routes/workspaces/mutations/mutations-sync.ts` - Server mutation endpoint
- `apps/server/src/services/socket-connection.ts` - WebSocket connection handler

### CRDT Integration (Yjs)

**Purpose:** Enable conflict-free collaborative editing with automatic merge resolution.

**Implementation:**
- `packages/crdt/src/index.ts` contains the `YDoc` class wrapping Yjs documents
- Each node (page, database record, etc.) has a corresponding Yjs document
- Updates are encoded as binary blobs (Base64 for storage, Uint8Array for processing)
- Server merges concurrent updates automatically using Yjs CRDT semantics

**Storage Strategy:**
Both client and server maintain two layers:
1. **Current State** - JSON representation of latest merged state (for querying)
2. **Update History** - Binary CRDT updates (for syncing and conflict resolution)

**Tables:**
- `nodes` / `documents` - Current state as JSON/JSONB
- `node_updates` / `document_updates` - Individual CRDT updates as binary blobs
- `node_states` / `document_states` - Merged CRDT state (client-side)

**Background Merging:**
Server jobs periodically merge old updates to reduce storage (`apps/server/src/jobs/node-updates-merge.ts`).

### Database Synchronization

**Local (SQLite) ↔ Server (Postgres):**

Cursor-based streaming synchronization:
- Each data stream (users, nodes, documents, collaborations, etc.) has a `Synchronizer`
- Synchronizers track a cursor (last synced revision number)
- Client requests updates via WebSocket: `synchronizer.input { cursor: 12345 }`
- Server responds with batch: `synchronizer.output { updates: [...], cursor: 12350 }`
- Client applies updates to local database and persists new cursor

**Synchronizer Types:**
- `users` - User list changes
- `collaborations` - Access control updates
- `node.updates` - Node CRDT updates (per workspace root)
- `document.updates` - Document CRDT updates (per workspace root)
- `node.reactions` - Emoji reactions
- `node.interactions` - Read receipts and activity tracking

**Key Files:**
- `packages/client/src/services/workspaces/synchronizer.ts`
- `apps/server/src/synchronizers/*` - Server-side data fetchers
- `apps/server/src/lib/event-bus.ts` - Event system for triggering syncs

### Node Type Registry

**Location:** `packages/core/src/registry/nodes/`

Each node type (workspace, page, database, message, etc.) defines:
- **Attribute Schema** - Zod schema for node metadata
- **Document Schema** (optional) - Zod schema for collaborative content
- **Permission Checks** - `canCreate`, `canUpdate`, `canDelete`, `canRead`
- **Text Extraction** - For search indexing
- **Mention Extraction** - For @mentions and notifications

**Example Node Types:**
- `workspace` - Top-level container
- `page` - Rich text document
- `database` - Structured data with custom fields and views
- `message` - Chat message
- `file` - File attachment
- `folder` - Organizational container

**Important:** When adding a new node type, register it in the appropriate registry file and ensure both client and server import it.

### Configuration System

**Server Configuration:**
- Primary config: `apps/server/config.json` (shipped with Docker image)
- Supports environment variable pointers: `env://VAR_NAME` or `env://VAR_NAME?` (optional)
- Supports file content inlining: `file://path/to/secret.pem`
- Only `POSTGRES_URL` and `REDIS_URL` are required env vars
- For Docker: mount custom `config.json` to override defaults
- For Kubernetes: use Helm chart with `--set-file colanode.configFile.data=./config.json`

**Client Apps:**
- Use standard `.env` files for build-time configuration
- Runtime configuration fetched from server

## Testing

**Current State:**
- There are currently **no automated tests** in this codebase
- Test commands exist in package.json files but will not run any actual tests
- Focus on manual verification for all changes
- Always run `npm run lint` before committing to catch TypeScript/ESLint issues
- Run `npm run build` to ensure TypeScript compilation succeeds
- Include clear manual verification steps in pull request descriptions

## Development Tips

### Working with CRDTs

When modifying node or document schemas:
1. Update Zod schema in `packages/core/src/registry/nodes/<type>.ts`
2. The CRDT layer automatically handles schema validation via `YDoc.update()`
3. Test with multiple clients to verify conflict resolution
4. Remember: updates are append-only, deletions use tombstones

### Debugging Synchronization

**Client-side:**
- Check `mutations` table for pending operations
- Check `cursors` table for sync position
- Use browser DevTools WebSocket tab to inspect messages

**Server-side:**
- Logs are in JSON format (Pino logger)
- Look for `synchronizer.input` / `synchronizer.output` messages
- Check `node_updates` table for stored updates
- Verify revision numbers are incrementing

### Database Migrations

**Server (Postgres):**
- Schema defined in `apps/server/src/data/schema.ts`
- No formal migration system yet; schema changes require careful coordination
- For local dev: drop and recreate database if needed

**Client (SQLite):**
- Schema versioning handled in `packages/client/src/databases/workspace/schema.ts`
- Migration logic in `packages/client/src/databases/workspace/migrations.ts`
- Migrations run automatically on app startup

### Adding a New Node Type

1. Create schema in `packages/core/src/registry/nodes/<type>.ts`
2. Define attribute schema, document schema (if collaborative), and permissions
3. Register in `packages/core/src/registry/nodes/index.ts`
4. Update server-side node creation logic in `apps/server/src/lib/nodes.ts`
5. Add client-side service in `packages/client/src/services/`
6. Create UI components in `packages/ui/src/components/`

### Storage Backends

Server supports multiple storage backends for files:
- **Filesystem** (default) - Local storage
- **S3** - AWS S3 or compatible (MinIO, DigitalOcean Spaces, etc.)
- **GCS** - Google Cloud Storage
- **Azure Blob Storage**

Configure via `STORAGE_TYPE` in `config.json`. See `apps/server/src/lib/storage/` for implementations.

## Common Patterns

### Service Layer Pattern
Services encapsulate business logic and coordinate between database and API:
- `packages/client/src/services/` - Client-side services
- `apps/server/src/services/` - Server-side services

### Repository Pattern
Database access abstracted through clear interfaces:
- `packages/client/src/databases/` - Client database layer
- `apps/server/src/data/` - Server database layer

### Event-Driven Updates
- Client: Uses React Query for reactive data fetching
- Server: Uses EventBus (Redis-backed) for cross-instance communication
- Background jobs via BullMQ for asynchronous processing

### Optimistic Updates
All mutations are optimistic:
1. Update local state immediately
2. Show UI change instantly
3. Send mutation to server in background
4. On failure (after 10 retries), show error and optionally revert
5. CRDT ensures eventual consistency even if server order differs

## Important Considerations

- **Generated Assets:** Emoji and icon files are generated during `npm install`. Don't commit these to git.
- **TypeScript Source Imports:** Packages use TypeScript source directly (not compiled outputs) during development for faster iteration.
- **Local-First Mindset:** Always assume network can fail. Design features to work offline first.
- **CRDT Limitations:** Not all data types use CRDTs (e.g., messages and files use simpler database tables).
- **Mobile App:** The `apps/mobile` is experimental and not production-ready.
- **Performance:** For large workspaces, synchronizers per root node can cause memory pressure. Monitor closely.
