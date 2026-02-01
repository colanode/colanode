# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Colanode is an open-source, local-first collaboration platform supporting real-time chat, rich text editing, customizable databases, and file management. It uses a sophisticated CRDT-based architecture (powered by Yjs) to enable offline-first operation with automatic conflict resolution.

## Commands

### Development

```bash
# Install dependencies (also runs postinstall script to generate emoji/icon assets)
npm install
```

Prefer running dev/build/compile/format commands inside the specific app or package directory.

**Note:** Tests exist for `apps/server` and `apps/web` and are run with Vitest. Prefer running tests in the relevant app directory; `npm run test` at the repo root runs the same suites via Turbo.

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
Client storage maintains multiple layers:

1. **Current State** - JSON representation of latest merged state (for querying/UI)
2. **Merged CRDT State** - Binary Yjs state in `node_states` / `document_states`
3. **Pending Updates** - Local, unsynced CRDT updates in `node_updates` / `document_updates` kept separately so they can be reverted; once synced they are merged into `*_states` and removed

Server storage keeps current JSON state (`nodes` / `documents`) plus CRDT update history (`node_updates` / `document_updates`); background jobs merge older updates.

**Tables:**

- `nodes` / `documents` - Current state as JSON/JSONB
- `node_states` / `document_states` - Merged CRDT state (client-side)
- `node_updates` / `document_updates` - Pending local CRDT updates (client-side) and CRDT update history (server-side)

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

Each node type (space, page, database, message, etc.) defines:

- **Attribute Schema** - Zod schema for node metadata
- **Document Schema** (optional) - Zod schema for collaborative content
- **Permission Checks** - `canCreate`, `canUpdate`, `canDelete`, `canRead`
- **Text Extraction** - For search indexing
- **Mention Extraction** - For @mentions and notifications

**Example Node Types:**

- `space` - Top-level container
- `page` - Rich text document
- `database` - Structured data with custom fields and views
- `record` - Database row
- `database_view` - Saved database view
- `chat` - Chat container
- `channel` - Chat channel
- `message` - Chat message
- `file` - File attachment
- `folder` - Organizational container

**Important:** When adding a new node type, register it in the appropriate registry file and ensure both client and server import it.

### Configuration System

**Server Configuration:**

The server uses a JSON-based configuration system with smart reference resolution:

- **Config File Location**: Set via `CONFIG` environment variable (e.g., `CONFIG=/path/to/config.json`)
- **Default Behavior**: If `CONFIG` is not set, server uses schema defaults from `apps/server/src/lib/config/`
- **Example Config**: See `apps/server/config.example.json` for a complete template

**Reference Resolution:**

The config system supports special prefixes for dynamic value loading:

- `env://VAR_NAME` - Resolves to environment variable at runtime (required, fails if not set)
- `file://path/to/file` - Reads and inlines file contents at runtime (useful for certificates/secrets)
- Direct values - Plain strings/numbers/booleans in JSON

**Example:**
```json
{
  "postgres": {
    "url": "env://POSTGRES_URL",
    "ssl": {
      "ca": "file:///secrets/postgres-ca.pem"
    }
  },
  "storage": {
    "provider": {
      "type": "s3",
      "endpoint": "env://S3_ENDPOINT",
      "accessKey": "env://S3_ACCESS_KEY",
      "secretKey": "env://S3_SECRET_KEY"
    }
  }
}
```

**Required Configuration:**
- Only `postgres.url` is truly required (defaults to `env://POSTGRES_URL`)
- All other settings have sensible defaults in the Zod schemas
- Storage defaults to `file` type with `./data` directory
- Redis defaults to `env://REDIS_URL` but has fallback behavior

**For Docker/Production:**
1. Copy `apps/server/config.example.json` to your own config file
2. Update values (use `env://` for secrets, direct values for non-sensitive settings)
3. Mount your config file and set `CONFIG=/path/to/mounted/config.json`
4. Set required environment variables referenced by `env://` pointers

**For Local Development:**
- Use `.env` file in `apps/server/` directory
- Server will use schema defaults if no config file is provided
- See `apps/server/.env.example` for available environment variables

**Config Validation:**
- All config is validated using Zod schemas at startup
- Validation errors show clear messages about missing/invalid values
- Server exits immediately if config is invalid

**Client Apps:**

- Use standard `.env` files for build-time configuration
- Runtime configuration fetched from server

## Testing

**Automated Tests (Vitest):**

- `apps/server`: `npm run test`
- `apps/web`: `npm run test`
- Repo root: `npm run test` (runs app tests via Turbo)
- Focus manual verification on areas without test coverage
- Include clear verification steps in pull request descriptions

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
- Migrations live in `apps/server/src/data/migrations` and run via the Kysely migrator in `apps/server/src/data/database.ts`
- Add a migration for schema changes; avoid manual production edits. For local dev, dropping the DB is a last resort.

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

- **File** (default) - Local filesystem storage in `./data` directory
- **S3** - AWS S3 or compatible (MinIO, DigitalOcean Spaces, etc.)
- **GCS** - Google Cloud Storage
- **Azure** - Azure Blob Storage

**Configuration:**

Configure via `storage.provider.type` in your config file. Examples:

**Filesystem (default):**
```json
{
  "storage": {
    "provider": {
      "type": "file",
      "directory": "./data"
    }
  }
}
```

**S3-compatible:**
```json
{
  "storage": {
    "provider": {
      "type": "s3",
      "endpoint": "env://S3_ENDPOINT",
      "accessKey": "env://S3_ACCESS_KEY",
      "secretKey": "env://S3_SECRET_KEY",
      "bucket": "env://S3_BUCKET",
      "region": "env://S3_REGION",
      "forcePathStyle": false
    }
  }
}
```

**GCS:**
```json
{
  "storage": {
    "provider": {
      "type": "gcs",
      "bucket": "env://GCS_BUCKET",
      "projectId": "env://GCS_PROJECT_ID",
      "credentials": "file:///secrets/gcs-credentials.json"
    }
  }
}
```

**Azure:**
```json
{
  "storage": {
    "provider": {
      "type": "azure",
      "account": "env://AZURE_STORAGE_ACCOUNT",
      "accountKey": "env://AZURE_STORAGE_ACCOUNT_KEY",
      "containerName": "env://AZURE_CONTAINER_NAME"
    }
  }
}
```

See `apps/server/src/lib/storage/` for implementations and `apps/server/src/lib/config/storage.ts` for full schema.

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

- Client: Uses TanStack DB for reactive data fetching alongside TanStack Query
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
