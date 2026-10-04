import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { VehicleState, TransitAlert } from '../models/types.js';

const { FeedMessage } = GtfsRealtimeBindings.transit_realtime;

/**
 * Builds a GTFS-Realtime VehiclePositions FeedMessage.
 */
export function buildVehiclePositionsFeed(vehicles: VehicleState[]): any {
  const timestamp = Math.floor(Date.now() / 1000);

  const entities = vehicles.map(v => {
    // Speed in GTFS-RT is meters per second
    const speedMps = v.speedKmh ? (v.speedKmh * 1000) / 3600 : 0;

    return {
      id: `vehicle-pos-${v.vehicleId}`,
      isDeleted: false,
      vehicle: {
        trip: {
          tripId: v.tripId,
          routeId: v.routeId,
          startDate: new Date(v.lastUpdated).toISOString().slice(0, 10).replace(/-/g, ''),
        },
        vehicle: {
          id: v.vehicleId,
          label: `Matatu ${v.vehicleId.toUpperCase()}`
        },
        position: {
          latitude: v.latitude,
          longitude: v.longitude,
          bearing: v.bearing,
          speed: speedMps
        },
        currentStopSequence: v.currentStopSequence,
        stopId: v.nextStopId,
        currentStatus: 2, // IN_TRANSIT_TO
        timestamp: Math.floor(v.lastUpdated / 1000)
      }
    };
  });

  return FeedMessage.create({
    header: {
      gtfsRealtimeVersion: '2.0',
      incrementality: 0, // FULL_DATASET
      timestamp
    },
    entity: entities
  });
}

/**
 * Builds a GTFS-Realtime TripUpdates FeedMessage.
 */
export function buildTripUpdatesFeed(vehicles: VehicleState[]): any {
  const timestamp = Math.floor(Date.now() / 1000);

  const entities = vehicles.map(v => {
    const stopTimeUpdates = v.etas.map((eta, index) => {
      const arrivalEpochSec = Math.floor(new Date(eta.estimatedArrivalTime).getTime() / 1000);
      return {
        stopSequence: v.currentStopSequence + index,
        stopId: eta.stopId,
        arrival: {
          time: arrivalEpochSec,
          delay: 0
        },
        departure: {
          time: arrivalEpochSec + 30, // 30s dwell time at matatu stage
          delay: 0
        }
      };
    });

    return {
      id: `trip-update-${v.tripId}`,
      isDeleted: false,
      tripUpdate: {
        trip: {
          tripId: v.tripId,
          routeId: v.routeId
        },
        vehicle: {
          id: v.vehicleId,
          label: `Matatu ${v.vehicleId.toUpperCase()}`
        },
        stopTimeUpdate: stopTimeUpdates,
        timestamp: Math.floor(v.lastUpdated / 1000)
      }
    };
  });

  return FeedMessage.create({
    header: {
      gtfsRealtimeVersion: '2.0',
      incrementality: 0,
      timestamp
    },
    entity: entities
  });
}

/**
 * Builds a GTFS-Realtime Alerts FeedMessage.
 */
export function buildAlertsFeed(alerts: TransitAlert[]): any {
  const timestamp = Math.floor(Date.now() / 1000);

  const entities = alerts.map(a => {
    return {
      id: `alert-${a.alertId}`,
      isDeleted: false,
      alert: {
        activePeriod: [
          {
            start: a.startTime,
            end: a.endTime || (a.startTime + 86400)
          }
        ],
        informedEntity: [
          {
            routeId: a.routeId || '',
            stopId: a.stopId || ''
          }
        ],
        headerText: {
          translation: [
            {
              text: a.headerText,
              language: 'en'
            }
          ]
        },
        descriptionText: {
          translation: [
            {
              text: a.descriptionText,
              language: 'en'
            }
          ]
        }
      }
    };
  });

  return FeedMessage.create({
    header: {
      gtfsRealtimeVersion: '2.0',
      incrementality: 0,
      timestamp
    },
    entity: entities
  });
}

/**
 * Serializes a FeedMessage into protobuf binary buffer.
 */
export function encodeFeedToProtobuf(feedMessage: any): Uint8Array {
  return FeedMessage.encode(feedMessage).finish();
}
