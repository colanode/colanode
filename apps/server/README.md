# Colanode Server (apps/server)

Colanode server is the authoritative sync, auth, and realtime layer for the local-first collaboration stack. Clients keep a local SQLite cache and sync mutation batches to this server; the server validates, persists, and broadcasts changes over WebSocket.

## Architecture overview

- **Runtime**: Fastify + Zod validation, WebSocket support, Redis-backed event bus, BullMQ jobs, Kysely/Postgres persistence.
- **Data model**: Nodes, documents, collaborations, reactions, interactions, and tombstones are revisioned streams with merge-safe CRDT updates.
- **Sync**: Clients push mutation batches; server writes to Postgres and emits events. WebSocket synchronizers stream incremental changes per entity type using revision cursors.
- **Storage**: File data is stored via pluggable providers (file system, S3, GCS, Azure). TUS handles resumable uploads.
- **Security**: Token-per-device authentication, rate limiting (IP + device + email), workspace authorization gates.

## Requirements

- Node.js 20+ (tests require this due to Vitest v4).
- Postgres with the pgvector extension.
- Redis (or compatible).
- Docker is recommended for local dev and required for Testcontainers-based tests.

## Quick start (local dev)

From the repo root:

```bash
npm install
docker compose -f hosting/docker/docker-compose.yaml up -d
```

From `apps/server`:

```bash
cp .env.example .env
npm run dev
```

## Configuration

The server reads configuration from a JSON file, or falls back to schema defaults in `apps/server/src/lib/config/`.

- `CONFIG` points to the config JSON file.
- `apps/server/config.example.json` is the recommended template.
- Values can reference `env://VAR_NAME` or `file://path/to/secret` for secrets.
- `postgres.url` is required and defaults to `env://POSTGRES_URL`.

## Code map

- `apps/server/src/api`: HTTP + WebSocket routes and plugins.
- `apps/server/src/data`: database + redis clients and migrations.
- `apps/server/src/synchronizers`: WebSocket sync streams by entity type.
- `apps/server/src/jobs`: background jobs and handlers.
- `apps/server/src/services`: email, jobs, and other infrastructure services.
- `apps/server/src/lib`: shared server logic and helpers.

## Tests

From `apps/server`:

```bash
npm run test
```

Notes:

- Tests use Testcontainers for Postgres (pgvector) and Redis. Docker must be running.
- Fastify route tests use `fastify.inject()` (no network ports).
- Shared test helpers live in `apps/server/test/helpers`.
