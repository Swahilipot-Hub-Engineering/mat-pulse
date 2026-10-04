# Runbook — Mat-Pulse

Operational guide for **Mat-Pulse**.

## At a glance

| | |
| :--- | :--- |
| Production API | `https://matpulse.swahilipothub.co.ke` |
| Hosting | Docker / Render / VPS |
| Health Check | `/api/v1/health` |
| On Call | @jkose002 |
| Community Mentors | @Swahilipot-Hub-Engineering/mentors |

## Deployment with Docker

```bash
# Build and run container in detached mode
docker compose up --build -d

# Check container status
docker compose ps

# View server logs
docker compose logs -f mat-pulse
```

## Smoke Test

Verify the deployment with these quick curl commands:

```bash
# 1. Health check
curl -f http://localhost:3000/api/v1/health

# 2. GTFS Static routes
curl -f http://localhost:3000/api/v1/transit/routes

# 3. GTFS-RT Protobuf endpoint
curl -f -I http://localhost:3000/api/v1/gtfs-rt/vehicle-positions.pb
```

## Common Issues & Troubleshooting

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| `EADDRINUSE` port 3000 | Port 3000 occupied | Set `PORT=3001` in `.env` |
| GTFS-RT feed empty | No telemetry received in past 5 min | Check simulator or driver apps are pinging `/api/v1/telemetry` |
| Bounding box rejection | Coordinates outside coastal region | Verify lat is ~ -4.0 and lng is ~ 39.6 |
