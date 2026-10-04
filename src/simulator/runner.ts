import { loadStaticRoutes } from '../gtfs/static/generator.js';
import { Route } from '../models/types.js';

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
  const allRoutes = loadStaticRoutes();
  if (allRoutes.length === 0) {
    console.error('No routes found to simulate!');
    process.exit(1);
  }

  console.log('===========================================================');
  console.log('🚐 MAT-PULSE National Telemetry Simulator (Kenya Transit)');
  console.log(`📡 Target API: ${API_URL}`);
  console.log(`⏱️  Update Frequency: ${INTERVAL_MS / 1000}s`);
  console.log('===========================================================');

  // Match routes across Kenya
  const rongaiRoute = allRoutes.find(r => r.routeId === 'route-nrb-rongai-cbd') || allRoutes[0];
  const githuraiRoute = allRoutes.find(r => r.routeId === 'route-nrb-githurai-cbd') || allRoutes[0];
  const bamburiRoute = allRoutes.find(r => r.routeId === 'route-bamburi-posta') || allRoutes[0];
  const likoniRoute = allRoutes.find(r => r.routeId === 'route-likoni-posta') || allRoutes[0];
  const kisumuRoute = allRoutes.find(r => r.routeId === 'route-ksm-kondele-cbd') || allRoutes[0];

  const vehicles: SimVehicle[] = [
    {
      vehicleId: 'kdd-555a', // Nairobi
      route: rongaiRoute,
      currentStopIndex: 0,
      progressBetweenStops: 0.2,
      speedKmh: 42
    },
    {
      vehicleId: 'kdf-777b', // Nairobi
      route: githuraiRoute,
      currentStopIndex: 1,
      progressBetweenStops: 0.4,
      speedKmh: 48
    },
    {
      vehicleId: 'kda-884m', // Mombasa
      route: bamburiRoute,
      currentStopIndex: 1,
      progressBetweenStops: 0.1,
      speedKmh: 35
    },
    {
      vehicleId: 'kdb-412p', // Mombasa
      route: likoniRoute,
      currentStopIndex: 0,
      progressBetweenStops: 0.3,
      speedKmh: 26
    },
    {
      vehicleId: 'kdg-333c', // Kisumu
      route: kisumuRoute,
      currentStopIndex: 0,
      progressBetweenStops: 0.5,
      speedKmh: 32
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

      // Small realistic speed variance
      const speed = Math.max(15, Math.min(65, v.speedKmh + (Math.random() * 6 - 3)));

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
          console.log(`[${new Date().toLocaleTimeString()}] 🚐 [${v.route.regionId?.toUpperCase()}] ${v.vehicleId.toUpperCase()} (${v.route.routeShortName}) -> Next: ${nextStop} (~${Math.round(etaSec / 60)} min)`);
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
