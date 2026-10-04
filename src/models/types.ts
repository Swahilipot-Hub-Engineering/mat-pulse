export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Stop extends Coordinates {
  stopId: string;
  stopName: string;
  sequence: number;
}

export interface Route {
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeColor: string;
  agencyId: string;
  stops: Stop[];
}

export interface TelemetryPing extends Coordinates {
  vehicleId: string;
  routeId: string;
  tripId?: string;
  speedKmh: number;
  bearing?: number;
  timestamp: number; // Unix epoch milliseconds or seconds
  driverName?: string;
  occupancyStatus?: 'EMPTY' | 'MANY_SEATS_AVAILABLE' | 'FEW_SEATS_AVAILABLE' | 'STANDING_ROOM_ONLY' | 'FULL';
}

export interface EtaPrediction {
  stopId: string;
  stopName: string;
  distanceMeters: number;
  etaSeconds: number;
  estimatedArrivalTime: string; // ISO 8601 string
}

export interface VehicleState extends Coordinates {
  vehicleId: string;
  routeId: string;
  tripId: string;
  speedKmh: number;
  bearing: number;
  lastUpdated: number; // epoch ms
  currentStopSequence: number;
  nextStopId: string;
  etas: EtaPrediction[];
  occupancyStatus: 'EMPTY' | 'MANY_SEATS_AVAILABLE' | 'FEW_SEATS_AVAILABLE' | 'STANDING_ROOM_ONLY' | 'FULL';
}

export interface TransitAlert {
  alertId: string;
  routeId?: string;
  stopId?: string;
  headerText: string;
  descriptionText: string;
  cause: string;
  effect: string;
  startTime: number;
  endTime?: number;
}
