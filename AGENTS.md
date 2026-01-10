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
- Primary config: `apps/server/config.json` (shipped with Docker image).
- Supports environment variable pointers: `env://VAR_NAME` or `env://VAR_NAME?` (optional).
- Supports file content inlining: `file://path/to/secret.pem`.
- Only `POSTGRES_URL` and `REDIS_URL` are required env vars.
- For Docker: mount a custom `config.json` to override defaults.
- For Kubernetes: use the Helm chart with `--set-file colanode.configFile.data=./config.json`.

## Testing
Automated tests are not in place yet. Validate changes manually and note verification steps.
