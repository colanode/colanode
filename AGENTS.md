# Repository Guidelines

## Architecture Overview
Colanode is a local-first collaboration workspace. Clients keep a local SQLite cache and sync to the server (Fastify + Postgres + Redis) in the background for offline-first behavior. Real-time editing uses CRDTs (Yjs) to merge concurrent changes. Shared packages provide core types, sync logic, and UI; see `README.md` for product and hosting context.

## Project Structure & Module Organization
- `apps/`: client and server apps (`server`, `web`, `desktop`, `mobile`).
- `packages/`: shared libraries (`core`, `client`, `ui`, `crdt`).
- `scripts/`: asset and seed tooling (postinstall runs from here).
- `hosting/`: Docker Compose and Kubernetes (Helm) deploy configs.
- `assets/`: repository images used in docs.

## Development Guide (Quick Start)
- Install dependencies: `npm install`.
- Repo-level tasks: `npm run dev`, `npm run build`, `npm run lint`, `npm run format`.
- Run apps directly:
  - `apps/server`: `cp .env.example .env && npm run dev`
  - `apps/web`: `npm run dev` (Vite on port 4000)
  - `apps/desktop`: `npm run dev`
- Local dependencies: `docker compose -f hosting/docker/docker-compose.yaml up -d`.

## Coding Guidelines
- Ground changes in the existing codebase. Start from the closest feature and mirror its folders, naming, and flow.
- Keep shared behavior in `packages/`; keep `apps/` thin and focused on wiring and UI.
- Server routes use Fastify plugins with Zod schemas from `@colanode/core`. Update schemas and error codes before handlers.
- Client operations follow the query/mutation pattern: define typed `type: 'feature.action'` inputs/outputs in `packages/client/src/queries` or `packages/client/src/mutations`, then wire handlers in `packages/client/src/handlers`.
- Use Kysely (`database`) for SQL access and limit raw SQL.
- UI styling uses Tailwind utilities and shared styles in `packages/ui/src/styles`. Prefer shared components over one-off styling.
- Use `@colanode/*` imports and follow ESLint import grouping; keep filenames consistent with nearby code.

## Server Configuration
- Config file location: set via `CONFIG` environment variable (e.g., `CONFIG=/path/to/config.json`).
- If `CONFIG` is not set, server uses schema defaults from `apps/server/src/lib/config/`.
- Template: `apps/server/config.example.json`.
- Reference resolution in JSON:
  - `env://VAR_NAME` - resolves to environment variable (required, fails if not set).
  - `file://path/to/file` - reads and inlines file contents (useful for certificates).
  - Direct values - plain strings/numbers/booleans for non-sensitive settings.
- Only `postgres.url` is required (defaults to `env://POSTGRES_URL`); all other settings have schema defaults.
- For production: copy `config.example.json`, update values, mount it, and set `CONFIG` + required env vars.
- Storage config via `storage.provider.type`: `file` (default), `s3`, `gcs`, or `azure`.
- See `apps/server/src/lib/config/` for full schemas and validation.

## Testing
Automated tests are not in place yet. Validate changes manually and note verification steps.
