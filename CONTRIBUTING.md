# Contributing to Colanode

Thanks for taking the time to contribute! Colanode is an open-source, local-first collaboration platform with web, desktop, and server components. We welcome bug reports, feature requests, docs improvements, and code contributions.

## Before you start

Before making any significant changes, please open an issue to discuss the proposal. Talking through changes early helps keep the contribution process smooth for everyone.

## Ways to contribute

- Report bugs and regressions
- Propose features or improvements
- Improve documentation
- Submit code changes

## Development setup (quick pointers)

See the main README for full local setup details:

- Root setup: `npm install`
- Server: `apps/server` (uses Postgres + Redis; Docker Compose is provided)
- Web: `apps/web`
- Desktop: `apps/desktop`
- Mobile: `apps/mobile` (experimental; not ready for production use)
- Scripts: see `scripts/README.md` for emojis, icons, and seed data

Notes:

- `npm install` runs a `postinstall` step that generates/copies emoji and icon assets into the apps.
- These generated asset outputs are intentionally ignored by git; please don’t add them to commits (focus on source changes under `scripts/` instead).

## Tests

Automated tests are currently very limited. If you change behavior, please include clear manual verification steps in your PR description, and run `npm run lint` (and `npm run build` when relevant) before opening a PR.

## Pull request process

- Fork the repo and branch from `main`.
- Keep PRs focused and scoped to a single change when possible.
- Update or add docs if your change affects usage or setup.
- For UI changes, include screenshots or a short video.

## License

By contributing, you agree that your contributions are licensed under the Apache 2.0 License (see `LICENSE`).
