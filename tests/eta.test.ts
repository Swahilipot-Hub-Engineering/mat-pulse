import { describe, it, expect } from 'vitest';
import { calculateRouteEtas } from '../src/engine/eta.js';
import { loadStaticRoutes } from '../src/gtfs/static/generator.js';

describe('ETA Engine', () => {
  const routes = loadStaticRoutes();
  const bamburiRoute = routes.find(r => r.routeId === 'route-bamburi-posta')!;
  const rongaiRoute = routes.find(r => r.routeId === 'route-nrb-rongai-cbd')!;

  it('calculates ETAs for upcoming stops along Bamburi-Posta route', () => {
    // Current position near Lights stage
    const currentPos = { latitude: -4.0150, longitude: 39.7020 };
    const currentSpeedKmh = 30;

    const result = calculateRouteEtas(currentPos, currentSpeedKmh, bamburiRoute);

    expect(result.nextStopIndex).toBeGreaterThanOrEqual(1);
    expect(result.etas.length).toBeGreaterThan(0);

    // ETAs should be in strictly ascending order
    for (let i = 1; i < result.etas.length; i++) {
      expect(result.etas[i].etaSeconds).toBeGreaterThan(result.etas[i - 1].etaSeconds);
      expect(result.etas[i].distanceMeters).toBeGreaterThan(result.etas[i - 1].distanceMeters);
    }
  });

  it('calculates ETAs for Nairobi corridor (Rongai - CBD)', () => {
    // Current position near Galleria Mall
    const currentPos = { latitude: -1.3486, longitude: 36.7645 };
    const currentSpeedKmh = 45;

    const result = calculateRouteEtas(currentPos, currentSpeedKmh, rongaiRoute);

    expect(result.nextStopIndex).toBeGreaterThanOrEqual(1);
    expect(result.etas.length).toBeGreaterThan(0);
  });

  it('handles vehicle at the end of the route gracefully', () => {
    const lastStop = bamburiRoute.stops[bamburiRoute.stops.length - 1];
    const result = calculateRouteEtas(lastStop, 20, bamburiRoute);

    expect(result.etas.length).toBeGreaterThanOrEqual(1);
  });
});
