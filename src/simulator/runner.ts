import { loadStaticRoutes } from '../gtfs/static/generator.js';
import { Route, Stop } from '../models/types.js';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1/telemetry';
const INTERVAL_MS = 3000;

interface SimVehicle {
  vehicleId: string;
  route: Route;
  currentStopIndex: number;
  progressBetweenStops: number; // 0.0 to 1.0
  speedKmh: number;
}

async function runSimulator(): Promise<void> {
  const routes = loadStaticRoutes();
  if (routes.length === 0) {
    console.error('No routes found to simulate!');
    process.exit(1);
  }

  console.log('🚐 MAT-PULSE Telemetry Simulator started');
  console.log(`📡 Pinging API at: ${API_URL}`);
  console.log(`⏱️  Interval: ${INTERVAL_MS / 1000}s`);

  // Initialize simulated vehicles across the routes
  const vehicles: SimVehicle[] = [
    {
      vehicleId: 'kda-884m',
      route: routes[0], // Bamburi - Posta
      currentStopIndex: 0,
      progressBetweenStops: 0.1,
      speedKmh: 35
    },
    {
      vehicleId: 'kdb-412p',
      route: routes[1] || routes[0], // Likoni - Posta
      currentStopIndex: 0,
      progressBetweenStops: 0.3,
      speedKmh: 28
    },
    {
      vehicleId: 'kdc-119z',
      route: routes[2] || routes[0], // Changamwe - Posta
      currentStopIndex: 1,
      progressBetweenStops: 0.5,
      speedKmh: 42
    }
  ];

  setInterval(async () => {
    for (const v of vehicles) {
      const stops = v.route.stops;
      const fromStop = stops[v.currentStopIndex];
      const toStop = stops[(v.currentStopIndex + 1) % stops.length];

      // Advance progress
      v.progressBetweenStops += 0.08;
      if (v.progressBetweenStops >= 1.0) {
        v.progressBetweenStops = 0.0;
        v.currentStopIndex = (v.currentStopIndex + 1) % stops.length;
      }

      // Linear interpolation between the two stops
      const lat = fromStop.latitude + (toStop.latitude - fromStop.latitude) * v.progressBetweenStops;
      const lon = fromStop.longitude + (toStop.longitude - fromStop.longitude) * v.progressBetweenStops;

      // Small jitter in speed
      const speed = Math.max(15, Math.min(60, v.speedKmh + (Math.random() * 6 - 3)));

      const payload = {
        vehicleId: v.vehicleId,
        routeId: v.route.routeId,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lon.toFixed(6)),
        speedKmh: Math.round(speed),
        timestamp: Date.now(),
        occupancyStatus: 'MANY_SEATS_AVAILABLE'
      };

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const json = await res.json() as any;
          const nextStop = json.data?.etas?.[0]?.stopName || 'Destination';
          const etaSec = json.data?.etas?.[0]?.etaSeconds || 0;
          console.log(`[${new Date().toLocaleTimeString()}] 🚐 ${v.vehicleId.toUpperCase()} @ [${lat.toFixed(4)}, ${lon.toFixed(4)}] -> Next: ${nextStop} (ETA: ${Math.round(etaSec / 60)} min)`);
        } else {
          console.error(`Failed to post telemetry for ${v.vehicleId}: ${res.statusText}`);
        }
      } catch (err: any) {
        console.error(`Error connecting to ${API_URL}: ${err.message}. Is the server running?`);
      }
    }
  }, INTERVAL_MS);
}

runSimulator().catch(console.error);
