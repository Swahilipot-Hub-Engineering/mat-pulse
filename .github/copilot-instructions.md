# Mat-Pulse — Copilot Instructions

GitHub Copilot loads this file automatically as context for this repository.
See [`AGENTS.md`](../AGENTS.md) for the full agent contract.

## Big picture

- **Mat-Pulse** is an open-source real-time transit telemetry engine and GTFS / GTFS-Realtime (GTFS-RT) platform for Mombasa matatus.
- **Stack:** Node.js 20+, TypeScript, Express, `gtfs-realtime-bindings`, Leaflet (frontend), Vitest (testing).
- **Entry points:** Server: `src/server.ts`, Simulator: `src/simulator/runner.ts`, Web UI: `src/public/index.html` + `src/public/app.js`.
- Deployed to Docker / cloud from `main`; `staging` is the integration branch.

## Commands that work

- Dev server: `npm run dev` (port 3000)
- Simulator: `npm run simulate`
- Test: `npm test`
- Typecheck: `npm run typecheck`
- Build: `npm run build`

## Key concepts

- **Mombasa Corridors:** Route definitions live in `src/gtfs/static/mombasa-routes.json` (Bamburi–Posta, Likoni–Posta, Changamwe–Posta).
- **Telemetry Ingestion:** `POST /api/v1/telemetry` takes vehicle ID, route ID, latitude, longitude, and speed.
- **GTFS-RT Protobuf:** Binary endpoints `/api/v1/gtfs-rt/vehicle-positions.pb` and `/api/v1/gtfs-rt/trip-updates.pb` are strictly typed using `gtfs-realtime-bindings`.
- **ETA Engine:** `src/engine/eta.ts` projects distance along route stops and calculates arrival timestamps based on effective corridor speed.

## Conventions

- Use ESM imports with `.js` extensions (e.g., `import { tracker } from '../engine/tracker.js'`).
- Keep web UI lightweight, responsive, and friendly for low-end Android smartphones on 3G.
- Target `staging` in pull requests.
