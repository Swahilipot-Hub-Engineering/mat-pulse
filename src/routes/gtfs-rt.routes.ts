import { Router, Request, Response } from 'express';
import { tracker } from '../engine/tracker.js';
import {
  buildVehiclePositionsFeed,
  buildTripUpdatesFeed,
  buildAlertsFeed,
  encodeFeedToProtobuf
} from '../gtfs/realtime.js';

export const gtfsRtRouter = Router();

// ========================
// Vehicle Positions Feed
// ========================

// Protobuf endpoint for Google Transit / OpenTripPlanner
gtfsRtRouter.get('/vehicle-positions.pb', (_req: Request, res: Response): void => {
  const vehicles = tracker.getActiveVehicles();
  const feed = buildVehiclePositionsFeed(vehicles);
  const buffer = encodeFeedToProtobuf(feed);

  res.setHeader('Content-Type', 'application/x-protobuf');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(Buffer.from(buffer));
});

// JSON mirror endpoint for web and developer inspection
gtfsRtRouter.get('/vehicle-positions.json', (_req: Request, res: Response): void => {
  const vehicles = tracker.getActiveVehicles();
  const feed = buildVehiclePositionsFeed(vehicles);
  res.setHeader('Content-Type', 'application/json');
  res.json(feed);
});

// Default alias for vehicle-positions
gtfsRtRouter.get('/vehicle-positions', (req: Request, res: Response): void => {
  const format = req.query.format === 'json' ? 'json' : 'pb';
  if (format === 'json') {
    res.redirect('/api/v1/gtfs-rt/vehicle-positions.json');
  } else {
    res.redirect('/api/v1/gtfs-rt/vehicle-positions.pb');
  }
});

// ========================
// Trip Updates Feed
// ========================

gtfsRtRouter.get('/trip-updates.pb', (_req: Request, res: Response): void => {
  const vehicles = tracker.getActiveVehicles();
  const feed = buildTripUpdatesFeed(vehicles);
  const buffer = encodeFeedToProtobuf(feed);

  res.setHeader('Content-Type', 'application/x-protobuf');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(Buffer.from(buffer));
});

gtfsRtRouter.get('/trip-updates.json', (_req: Request, res: Response): void => {
  const vehicles = tracker.getActiveVehicles();
  const feed = buildTripUpdatesFeed(vehicles);
  res.setHeader('Content-Type', 'application/json');
  res.json(feed);
});

gtfsRtRouter.get('/trip-updates', (req: Request, res: Response): void => {
  const format = req.query.format === 'json' ? 'json' : 'pb';
  if (format === 'json') {
    res.redirect('/api/v1/gtfs-rt/trip-updates.json');
  } else {
    res.redirect('/api/v1/gtfs-rt/trip-updates.pb');
  }
});

// ========================
// Service Alerts Feed
// ========================

gtfsRtRouter.get('/alerts.pb', (_req: Request, res: Response): void => {
  const alerts = tracker.getActiveAlerts();
  const feed = buildAlertsFeed(alerts);
  const buffer = encodeFeedToProtobuf(feed);

  res.setHeader('Content-Type', 'application/x-protobuf');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(Buffer.from(buffer));
});

gtfsRtRouter.get('/alerts.json', (_req: Request, res: Response): void => {
  const alerts = tracker.getActiveAlerts();
  const feed = buildAlertsFeed(alerts);
  res.setHeader('Content-Type', 'application/json');
  res.json(feed);
});

gtfsRtRouter.post('/alerts', (req: Request, res: Response): void => {
  const body = req.body;
  if (!body.headerText || !body.descriptionText) {
    res.status(400).json({ error: 'headerText and descriptionText are required' });
    return;
  }

  const alert = {
    alertId: body.alertId || `alert-${Date.now()}`,
    routeId: body.routeId,
    stopId: body.stopId,
    headerText: String(body.headerText),
    descriptionText: String(body.descriptionText),
    cause: body.cause || 'TRAFFIC',
    effect: body.effect || 'SIGNIFICANT_DELAYS',
    startTime: body.startTime || Math.floor(Date.now() / 1000),
    endTime: body.endTime
  };

  tracker.addAlert(alert);
  res.status(201).json({ success: true, alert });
});
