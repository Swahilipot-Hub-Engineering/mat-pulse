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
gtfsRtRouter.get('/vehicle-positions.pb', (req: Request, res: Response): void => {
  const region = req.query.region ? String(req.query.region) : undefined;
  const vehicles = tracker.getActiveVehicles(undefined, region);
  const feed = buildVehiclePositionsFeed(vehicles);
  const buffer = encodeFeedToProtobuf(feed);

  res.setHeader('Content-Type', 'application/x-protobuf');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(Buffer.from(buffer));
});

// JSON mirror endpoint for web and developer inspection
gtfsRtRouter.get('/vehicle-positions.json', (req: Request, res: Response): void => {
  const region = req.query.region ? String(req.query.region) : undefined;
  const vehicles = tracker.getActiveVehicles(undefined, region);
  const feed = buildVehiclePositionsFeed(vehicles);
  res.setHeader('Content-Type', 'application/json');
  res.json(feed);
});

// Default alias for vehicle-positions
gtfsRtRouter.get('/vehicle-positions', (req: Request, res: Response): void => {
  const format = req.query.format === 'json' ? 'json' : 'pb';
  const regionQuery = req.query.region ? `?region=${req.query.region}` : '';
  if (format === 'json') {
    res.redirect(`/api/v1/gtfs-rt/vehicle-positions.json${regionQuery}`);
  } else {
    res.redirect(`/api/v1/gtfs-rt/vehicle-positions.pb${regionQuery}`);
  }
});

// ========================
// Trip Updates Feed
// ========================

gtfsRtRouter.get('/trip-updates.pb', (req: Request, res: Response): void => {
  const region = req.query.region ? String(req.query.region) : undefined;
  const vehicles = tracker.getActiveVehicles(undefined, region);
  const feed = buildTripUpdatesFeed(vehicles);
  const buffer = encodeFeedToProtobuf(feed);

  res.setHeader('Content-Type', 'application/x-protobuf');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(Buffer.from(buffer));
});

gtfsRtRouter.get('/trip-updates.json', (req: Request, res: Response): void => {
  const region = req.query.region ? String(req.query.region) : undefined;
  const vehicles = tracker.getActiveVehicles(undefined, region);
  const feed = buildTripUpdatesFeed(vehicles);
  res.setHeader('Content-Type', 'application/json');
  res.json(feed);
});

gtfsRtRouter.get('/trip-updates', (req: Request, res: Response): void => {
  const format = req.query.format === 'json' ? 'json' : 'pb';
  const regionQuery = req.query.region ? `?region=${req.query.region}` : '';
  if (format === 'json') {
    res.redirect(`/api/v1/gtfs-rt/trip-updates.json${regionQuery}`);
  } else {
    res.redirect(`/api/v1/gtfs-rt/trip-updates.pb${regionQuery}`);
  }
});

// ========================
// Service Alerts Feed
// ========================

gtfsRtRouter.get('/alerts.pb', (req: Request, res: Response): void => {
  const region = req.query.region ? String(req.query.region) : undefined;
  const alerts = tracker.getActiveAlerts(region);
  const feed = buildAlertsFeed(alerts);
  const buffer = encodeFeedToProtobuf(feed);

  res.setHeader('Content-Type', 'application/x-protobuf');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(Buffer.from(buffer));
});

gtfsRtRouter.get('/alerts.json', (req: Request, res: Response): void => {
  const region = req.query.region ? String(req.query.region) : undefined;
  const alerts = tracker.getActiveAlerts(region);
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
    regionId: body.regionId,
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
