import { describe, it, expect, beforeEach } from 'vitest';
import { VehicleTracker } from '../src/engine/tracker.js';

describe('Vehicle Tracker', () => {
  let tracker: VehicleTracker;

  beforeEach(() => {
    tracker = new VehicleTracker();
  });

  it('records vehicle telemetry and updates state', () => {
    const updated = tracker.recordTelemetry({
      vehicleId: 'kda-999y',
      routeId: 'route-bamburi-posta',
      latitude: -4.0150,
      longitude: 39.7020,
      speedKmh: 35,
      timestamp: Date.now()
    });

    expect(updated.vehicleId).toBe('kda-999y');
    expect(updated.routeId).toBe('route-bamburi-posta');
    expect(updated.etas.length).toBeGreaterThan(0);

    const retrieved = tracker.getVehicle('kda-999y');
    expect(retrieved).toBeDefined();
    expect(retrieved?.speedKmh).toBe(35);
  });

  it('calculates bearing between successive pings if not provided', () => {
    tracker.recordTelemetry({
      vehicleId: 'kda-999y',
      routeId: 'route-bamburi-posta',
      latitude: -4.0628,
      longitude: 39.6705,
      speedKmh: 30,
      timestamp: Date.now() - 5000
    });

    const second = tracker.recordTelemetry({
      vehicleId: 'kda-999y',
      routeId: 'route-bamburi-posta',
      latitude: -4.0435,
      longitude: 39.6685,
      speedKmh: 30,
      timestamp: Date.now()
    });

    expect(second.bearing).toBeGreaterThanOrEqual(350);
  });

  it('manages service alerts', () => {
    tracker.addAlert({
      alertId: 'nyali-traffic',
      headerText: 'Heavy Traffic at Nyali Bridge',
      descriptionText: 'Expect 20 min delays on Bamburi-Posta corridor',
      cause: 'ACCIDENT',
      effect: 'SIGNIFICANT_DELAYS',
      startTime: Math.floor(Date.now() / 1000)
    });

    const alerts = tracker.getActiveAlerts();
    expect(alerts.length).toBe(1);
    expect(alerts[0].alertId).toBe('nyali-traffic');

    tracker.clearAlert('nyali-traffic');
    expect(tracker.getActiveAlerts().length).toBe(0);
  });
});
