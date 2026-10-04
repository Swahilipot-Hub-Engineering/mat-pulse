# AGENTS.md — guide for AI coding agents

Context for GitHub Copilot, the Copilot app, and any other coding agent working in this
repository. **Keep it accurate** — a stale instruction here is worse than none, because
agents will follow it confidently.

> Human contributors: read [CONTRIBUTING.md](CONTRIBUTING.md) instead. This file is the
> machine-facing summary of the same rules.

## Project summary

**Mat-Pulse** is an open-source real-time transit telemetry engine and GTFS / GTFS-Realtime (GTFS-RT) platform for Mombasa matatus. It is built with Node.js 20+, TypeScript, Express, and Leaflet, and generates compliant transit feeds for Google Maps, commuter apps, and chatbots.

## Commands — use exactly these

| Task | Command | Notes |
| --- | --- | --- |
| Install | `npm install` | Uses package.json / package-lock.json |
| Dev server | `npm run dev` | Serves on port `3000` with hot-reload via tsx |
| Simulator | `npm run simulate` | Streams mock matatu telemetry along Mombasa routes |
| Build | `npm run build` | Compiles TypeScript via `tsc` into `dist/` |
| Typecheck | `npm run typecheck` | `tsc --noEmit` |
| Test (all) | `npm test` | Runs vitest test suite |
| Test (one file) | `npx vitest run tests/api.test.ts` | Target specific test file |

Do **not** invent scripts. If a command you need does not exist, check `package.json` first.

## Repository layout

```
src/
  models/       # TypeScript types for telemetry, vehicle states, routes, stops, and ETAs
  gtfs/         # Static GTFS CSV generator and GTFS-Realtime Protobuf encoders
    static/     # Mombasa transit corridors, stops, and route data (JSON)
  engine/       # Spatial math (haversine, bearing), ETA estimator, vehicle state tracker
  routes/       # Express route handlers (/telemetry, /gtfs-rt, /transit, /health)
  simulator/    # Mock telemetry simulator runner for local development
  public/       # Mobile-first interactive Leaflet map dashboard
docs/           # Architecture, onboarding, runbook, ADRs
tests/          # Vitest automated test suite (geo, eta, tracker, gtfs-rt, api)
.github/        # CI workflows, branch policy, issue templates, labels
```

## Conventions

- **Language:** TypeScript 5.7+ in strict mode. Use ES Modules (`import`/`export`), explicit types, and avoid `any`.
- **Imports:** Relative ESM paths ending in `.js` (e.g. `import { tracker } from './engine/tracker.js'`).
- **Transit Standards:** Follow GTFS Schedule and GTFS-Realtime v2.0 specifications strictly. Speeds in GTFS-RT must be in meters per second; speeds in internal telemetry APIs are km/h.
- **Commits:** Conventional Commits — `feat(scope): description`.
- **Branches:** Branch from `staging`, name `feat/…`, `fix/…`, `docs/…`, `chore/…`.
- **Pull requests:** Always target `staging`, never `main`.

## Rules for agents

**Always**
- Read the existing code near your change and match its patterns before writing anything new.
- Run `npm test` and `npm run typecheck` after changing code, and report real results.
- Keep changes scoped to the requested task.
- Update `README.md`, `.env.example`, and this file when your change modifies commands or configuration.
- Add or update tests for behaviour changes.

**Never**
- Commit secrets, `.env` files, API keys, or live vehicle tracking credentials.
- Force-push, rewrite history, or merge a pull request directly.
- Push directly to `main` or `staging`.
- Add heavy UI dependencies without confirmation — keep the web map lightweight for 3G phones.
- Fabricate command output or test results.

## Definition of done

- [ ] `npm test` passes
- [ ] `npm run typecheck` and `npm run build` pass with zero errors
- [ ] Changes are scoped to the task
- [ ] Docs and `.env.example` updated if affected
- [ ] PR targets `staging` with a Conventional Commit title
