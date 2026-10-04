import { Coordinates } from '../models/types.js';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculate the great-circle distance between two coordinates in meters using the Haversine formula.
 */
export function calculateDistanceMeters(coord1: Coordinates, coord2: Coordinates): number {
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Calculate the initial bearing (forward azimuth) from point 1 to point 2 in degrees (0..360).
 */
export function calculateBearing(start: Coordinates, end: Coordinates): number {
  const startLat = toRadians(start.latitude);
  const startLon = toRadians(start.longitude);
  const endLat = toRadians(end.latitude);
  const endLon = toRadians(end.longitude);

  const dLon = endLon - startLon;

  const y = Math.sin(dLon) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLon);

  const initialBearing = Math.atan2(y, x);
  const compassBearing = (toDegrees(initialBearing) + 360) % 360;

  return Math.round(compassBearing);
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
