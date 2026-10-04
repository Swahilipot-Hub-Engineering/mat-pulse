import EventEmitter from 'events';
import { TelemetryPing, VehicleState, Route, TransitAlert } from '../models/types.js';
import { calculateBearing } from './geo.js';
import { calculateRouteEtas } from './eta.js';
import { loadStaticRoutes } from '../gtfs/static/generator.js';
import { config } from '../config.js';

export class VehicleTracker extends EventEmitter {
  private vehicles: Map<string, VehicleState> = new Map();
  private routes: Map<string, Route> = new Map();
  private alerts: Map<string, TransitAlert> = new Map();

  constructor() {
    super();
    this.initRoutes();
  }

  private initRoutes(): void {
    const staticRoutes = loadStaticRoutes();
    for (const route of staticRoutes) {
      this.routes.set(route.routeId, route);
    }
  }

  public getRoute(routeId: string): Route | undefined {
    return this.routes.get(routeId);
  }

  public getAllRoutes(regionId?: string): Route[] {
    const all = Array.from(this.routes.values());
    if (regionId && regionId !== 'all') {
      return all.filter(r => r.regionId === regionId);
    }
    return all;
  }

  public recordTelemetry(ping: TelemetryPing): VehicleState {
    const route = this.routes.get(ping.routeId);
    if (!route) {
      throw new Error(`Unknown route ID: ${ping.routeId}`);
    }

    const prevVehicle = this.vehicles.get(ping.vehicleId);
    let bearing = ping.bearing ?? 0;

    if (ping.bearing === undefined && prevVehicle) {
      bearing = calculateBearing(
        { latitude: prevVehicle.latitude, longitude: prevVehicle.longitude },
        { latitude: ping.latitude, longitude: ping.longitude }
      );
    }

    const { nextStopIndex, etas } = calculateRouteEtas(
      { latitude: ping.latitude, longitude: ping.longitude },
      ping.speedKmh,
      route
    );

    const nextStop = route.stops[nextStopIndex] || route.stops[route.stops.length - 1];

    const updatedState: VehicleState = {
      vehicleId: ping.vehicleId,
      routeId: ping.routeId,
      regionId: route.regionId,
      tripId: ping.tripId || `trip-${ping.routeId}-${ping.vehicleId}`,
      latitude: ping.latitude,
      longitude: ping.longitude,
      speedKmh: ping.speedKmh,
      bearing,
      lastUpdated: ping.timestamp || Date.now(),
      currentStopSequence: nextStopIndex + 1,
      nextStopId: nextStop ? nextStop.stopId : '',
      etas,
      occupancyStatus: ping.occupancyStatus || 'MANY_SEATS_AVAILABLE'
    };

    this.vehicles.set(ping.vehicleId, updatedState);
    this.emit('vehicleUpdated', updatedState);

    return updatedState;
  }

  public getVehicle(vehicleId: string): VehicleState | undefined {
    return this.vehicles.get(vehicleId);
  }

  public getActiveVehicles(routeId?: string, regionId?: string): VehicleState[] {
    const now = Date.now();
    const staleThresholdMs = config.staleVehicleThresholdSeconds * 1000;
    const active: VehicleState[] = [];

    for (const [id, vehicle] of this.vehicles.entries()) {
      if (now - vehicle.lastUpdated > staleThresholdMs) {
        this.vehicles.delete(id);
        this.emit('vehicleStale', id);
        continue;
      }

      if (routeId && vehicle.routeId !== routeId) {
        continue;
      }

      if (regionId && regionId !== 'all' && vehicle.regionId !== regionId) {
        continue;
      }

      active.push(vehicle);
    }

    return active;
  }

  public addAlert(alert: TransitAlert): void {
    this.alerts.set(alert.alertId, alert);
    this.emit('alertAdded', alert);
  }

  public getActiveAlerts(regionId?: string): TransitAlert[] {
    const nowSec = Math.floor(Date.now() / 1000);
    const active = Array.from(this.alerts.values()).filter(a => !a.endTime || a.endTime > nowSec);
    if (regionId && regionId !== 'all') {
      return active.filter(a => !a.regionId || a.regionId === regionId);
    }
    return active;
  }

  public clearAlert(alertId: string): boolean {
    return this.alerts.delete(alertId);
  }

  public clearAllVehicles(): void {
    this.vehicles.clear();
  }
}

export const tracker = new VehicleTracker();
