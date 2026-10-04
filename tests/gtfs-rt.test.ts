import { describe, it, expect } from 'vitest';
import {
  buildVehiclePositionsFeed,
  buildTripUpdatesFeed,
  encodeFeedToProtobuf
} from '../src/gtfs/realtime.js';
import { VehicleState } from '../src/models/types.js';

describe('GTFS Realtime Encoder', () => {
  const mockVehicles: VehicleState[] = [
    {
      vehicleId: 'kda-101a',
      routeId: 'route-bamburi-posta',
      tripId: 'trip-route-bamburi-posta-kda-101a',
      latitude: -4.0150,
      longitude: 39.7020,
      speedKmh: 40,
      bearing: 180,
      lastUpdated: Date.now(),
      currentStopSequence: 3,
      nextStopId: 'stop-links-rd',
      occupancyStatus: 'MANY_SEATS_AVAILABLE',
      etas: [
        {
          stopId: 'stop-links-rd',
          stopName: 'Links Road Stage',
          distanceMeters: 800,
          etaSeconds: 90,
          estimatedArrivalTime: new Date(Date.now() + 90000).toISOString()
        }
      ]
    }
  ];

  it('builds a compliant VehiclePositions feed message and encodes to Protobuf', () => {
    const feed = buildVehiclePositionsFeed(mockVehicles);
    expect(feed.header).toBeDefined();
    expect(feed.header.gtfsRealtimeVersion).toBe('2.0');
    expect(feed.entity.length).toBe(1);
    expect(feed.entity[0].vehicle.vehicle.id).toBe('kda-101a');

    const buffer = encodeFeedToProtobuf(feed);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('builds a compliant TripUpdates feed message', () => {
    const feed = buildTripUpdatesFeed(mockVehicles);
    expect(feed.entity.length).toBe(1);
    expect(feed.entity[0].tripUpdate.stopTimeUpdate.length).toBe(1);
    expect(feed.entity[0].tripUpdate.stopTimeUpdate[0].stopId).toBe('stop-links-rd');
  });
});
