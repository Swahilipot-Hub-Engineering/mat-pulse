import { describe, it, expect } from 'vitest';
import { calculateDistanceMeters, calculateBearing } from '../src/engine/geo.js';

describe('Geo Engine', () => {
  const posta = { latitude: -4.0628, longitude: 39.6705 };
  const buxton = { latitude: -4.0435, longitude: 39.6685 };

  it('calculates distance between two Mombasa points accurately', () => {
    const distance = calculateDistanceMeters(posta, buxton);
    // Posta to Buxton is approx 2.1 - 2.2 km straight line
    expect(distance).toBeGreaterThan(2000);
    expect(distance).toBeLessThan(2300);
  });

  it('returns 0 for identical points', () => {
    expect(calculateDistanceMeters(posta, posta)).toBe(0);
  });

  it('calculates bearing towards north appropriately', () => {
    // Posta (-4.0628) to Buxton (-4.0435) is roughly heading North (~355 deg)
    const bearing = calculateBearing(posta, buxton);
    expect(bearing).toBeGreaterThanOrEqual(350);
    expect(bearing).toBeLessThanOrEqual(360);
  });
});
