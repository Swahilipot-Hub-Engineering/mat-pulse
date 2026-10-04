import { Router, Request, Response } from 'express';
import { tracker } from '../engine/tracker.js';
import { TelemetryPing } from '../models/types.js';

export const telemetryRouter = Router();

/**
 * Ingest telemetry from a matatu crew device or telematics tracker.
 * POST /api/v1/telemetry
 */
telemetryRouter.post('/', (req: Request, res: Response): void => {
  const body = req.body as Partial<TelemetryPing>;

  if (!body.vehicleId || !body.routeId || body.latitude === undefined || body.longitude === undefined) {
    res.status(400).json({
      error: 'Invalid telemetry payload',
      message: 'vehicleId, routeId, latitude, and longitude are required'
    });
    return;
  }

  // Validate Mombasa region coordinate bounding box roughly (-4.3 to -3.8 lat, 39.4 to 39.8 lon)
  if (body.latitude < -5.0 || body.latitude > -3.0 || body.longitude < 39.0 || body.longitude > 40.5) {
    res.status(400).json({
      error: 'Coordinate out of range',
      message: 'Coordinates must be within the coastal transit zone'
    });
    return;
  }

  const ping: TelemetryPing = {
    vehicleId: String(body.vehicleId).trim(),
    routeId: String(body.routeId).trim(),
    tripId: body.tripId ? String(body.tripId).trim() : undefined,
    latitude: Number(body.latitude),
    longitude: Number(body.longitude),
    speedKmh: Number(body.speedKmh) || 0,
    bearing: body.bearing !== undefined ? Number(body.bearing) : undefined,
    timestamp: body.timestamp || Date.now(),
    driverName: body.driverName,
    occupancyStatus: body.occupancyStatus
  };

  try {
    const updatedState = tracker.recordTelemetry(ping);
    res.status(200).json({
      success: true,
      data: updatedState
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Failed to record telemetry',
      message: err.message
    });
  }
});

/**
 * Batch telemetry ingest for telematics providers.
 * POST /api/v1/telemetry/batch
 */
telemetryRouter.post('/batch', (req: Request, res: Response): void => {
  const pings = req.body as Partial<TelemetryPing>[];

  if (!Array.isArray(pings)) {
    res.status(400).json({ error: 'Expected an array of telemetry pings' });
    return;
  }

  const results = [];
  const errors = [];

  for (const item of pings) {
    if (!item.vehicleId || !item.routeId || item.latitude === undefined || item.longitude === undefined) {
      errors.push({ item, error: 'Missing required fields' });
      continue;
    }

    try {
      const state = tracker.recordTelemetry({
        vehicleId: String(item.vehicleId).trim(),
        routeId: String(item.routeId).trim(),
        tripId: item.tripId ? String(item.tripId).trim() : undefined,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        speedKmh: Number(item.speedKmh) || 0,
        bearing: item.bearing !== undefined ? Number(item.bearing) : undefined,
        timestamp: item.timestamp || Date.now(),
        occupancyStatus: item.occupancyStatus
      });
      results.push(state);
    } catch (err: any) {
      errors.push({ item, error: err.message });
    }
  }

  res.status(200).json({
    success: true,
    processed: results.length,
    failed: errors.length,
    errors
  });
});
