# ADR-0002: GTFS Schedule and GTFS-Realtime Standardization

- **Status:** Accepted
- **Date:** 2026-10-04
- **Deciders:** @jkose002, @Swahilipot-Hub-Engineering/maintainers

## Context

Mombasa public transit relies on informal 14-seater and 33-seater matatus. Most matatus lack published schedules and operate on demand-driven dispatching (leaving when full). To integrate with global transit platforms like Google Maps, Apple Maps, and OpenTripPlanner, transit data must conform to the General Transit Feed Specification (GTFS) and GTFS-Realtime (GTFS-RT).

## Decision

We adopt GTFS Schedule for static routes/stops and GTFS-Realtime v2.0 (Protocol Buffers) for live telemetry:
1. `VehiclePositions.pb`: Publishes live GPS coordinates, bearing, and speed in meters/second.
2. `TripUpdates.pb`: Publishes stop-level arrival countdowns (ETAs) and predicted delays.
3. `Alerts.pb`: Publishes regional service disruptions (ferry queues, weather, roadblocks).
4. JSON mirrors are served alongside `.pb` streams to enable developer debugging and web/mobile dashboard consumption.

## Consequences

- Direct compatibility with Google Transit Partner Program.
- Clean separation between internal telemetry ingestion and open transit feed generation.
- Enables community members to build third-party mobile apps and WhatsApp bots on open standards.
