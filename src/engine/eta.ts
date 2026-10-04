import { Coordinates, EtaPrediction, Route, Stop } from '../models/types.js';
import { calculateDistanceMeters } from './geo.js';

const DEFAULT_AVERAGE_SPEED_KMH = 25; // Typical urban matatu corridor speed in Mombasa
const MIN_SPEED_KMH = 10; // Floor speed for stationary/traffic scenarios

/**
 * Predicts ETAs for remaining stops along a route given the vehicle's current location and speed.
 */
export function calculateRouteEtas(
  currentPos: Coordinates,
  currentSpeedKmh: number,
  route: Route
): { nextStopIndex: number; etas: EtaPrediction[] } {
  const stops = route.stops;
  if (!stops || stops.length === 0) {
    return { nextStopIndex: 0, etas: [] };
  }

  // Find the closest stop to current position
  let closestIndex = 0;
  let minDistance = Infinity;

  for (let i = 0; i < stops.length; i++) {
    const dist = calculateDistanceMeters(currentPos, stops[i]);
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  // Determine if vehicle has passed closest stop or is approaching it
  // If vehicle is very close (e.g. < 40m), it's at the stop; otherwise check next stops
  let nextIndex = closestIndex;
  if (closestIndex < stops.length - 1) {
    const distToClosest = calculateDistanceMeters(currentPos, stops[closestIndex]);
    const distToNext = calculateDistanceMeters(currentPos, stops[closestIndex + 1]);
    const stopToStop = calculateDistanceMeters(stops[closestIndex], stops[closestIndex + 1]);

    // If closer to next stop than closest stop is to next, vehicle has passed closest stop
    if (distToNext < stopToStop && distToNext < distToClosest) {
      nextIndex = closestIndex + 1;
    }
  }

  // Speed in m/s (use realistic fallback if stopped at stage or in heavy traffic)
  const effectiveSpeedKmh = Math.max(currentSpeedKmh || DEFAULT_AVERAGE_SPEED_KMH, MIN_SPEED_KMH);
  const speedMps = (effectiveSpeedKmh * 1000) / 3600;

  const nowMs = Date.now();
  const etas: EtaPrediction[] = [];

  let accumulatedDistance = calculateDistanceMeters(currentPos, stops[nextIndex]);

  for (let i = nextIndex; i < stops.length; i++) {
    if (i > nextIndex) {
      accumulatedDistance += calculateDistanceMeters(stops[i - 1], stops[i]);
    }

    const etaSeconds = Math.round(accumulatedDistance / speedMps);
    const arrivalTime = new Date(nowMs + etaSeconds * 1000).toISOString();

    etas.push({
      stopId: stops[i].stopId,
      stopName: stops[i].stopName,
      distanceMeters: Math.round(accumulatedDistance),
      etaSeconds,
      estimatedArrivalTime: arrivalTime
    });
  }

  return {
    nextStopIndex: nextIndex,
    etas
  };
}
