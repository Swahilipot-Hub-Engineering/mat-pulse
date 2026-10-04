import { Router, Request, Response } from 'express';
import { tracker } from '../engine/tracker.js';
import { getAllStops, generateGtfsCsvFiles, loadRegions, loadStaticRoutes } from '../gtfs/static/generator.js';

export const transitRouter = Router();

// List all supported Kenyan transit regions
transitRouter.get('/regions', (_req: Request, res: Response): void => {
  const regions = loadRegions();
  res.json({ success: true, count: regions.length, regions });
});

// List routes (optionally filtered by region)
transitRouter.get('/routes', (req: Request, res: Response): void => {
  const region = req.query.region ? String(req.query.region) : undefined;
  const routes = loadStaticRoutes(region);
  res.json({ success: true, count: routes.length, region: region || 'all', routes });
});

// List stops (optionally filtered by region)
transitRouter.get('/stops', (req: Request, res: Response): void => {
  const region = req.query.region ? String(req.query.region) : undefined;
  const stops = getAllStops(region);
  res.json({ success: true, count: stops.length, region: region || 'all', stops });
});

// List active vehicles currently transmitting telemetry
transitRouter.get('/vehicles', (req: Request, res: Response): void => {
  const routeId = req.query.routeId ? String(req.query.routeId) : undefined;
  const regionId = req.query.region ? String(req.query.region) : undefined;
  const vehicles = tracker.getActiveVehicles(routeId, regionId);
  res.json({ success: true, count: vehicles.length, vehicles });
});

// Download / inspect static GTFS files
transitRouter.get('/gtfs-static', (req: Request, res: Response): void => {
  const regionId = req.query.region ? String(req.query.region) : undefined;
  const files = generateGtfsCsvFiles(regionId);
  res.json({
    success: true,
    region: regionId || 'all',
    description: 'Static GTFS CSV components for Kenyan public transit',
    files
  });
});

// Server-Sent Events (SSE) stream for real-time live map updates
transitRouter.get('/stream', (req: Request, res: Response): void => {
  const regionId = req.query.region ? String(req.query.region) : undefined;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state snapshot immediately
  const initialData = JSON.stringify({
    type: 'SNAPSHOT',
    vehicles: tracker.getActiveVehicles(undefined, regionId),
    alerts: tracker.getActiveAlerts(regionId)
  });
  res.write(`data: ${initialData}\n\n`);

  // Listener for vehicle updates
  const onVehicleUpdated = (vehicle: any) => {
    if (!regionId || regionId === 'all' || vehicle.regionId === regionId) {
      res.write(`data: ${JSON.stringify({ type: 'VEHICLE_UPDATED', vehicle })}\n\n`);
    }
  };

  const onAlertAdded = (alert: any) => {
    if (!regionId || regionId === 'all' || !alert.regionId || alert.regionId === regionId) {
      res.write(`data: ${JSON.stringify({ type: 'ALERT_ADDED', alert })}\n\n`);
    }
  };

  tracker.on('vehicleUpdated', onVehicleUpdated);
  tracker.on('alertAdded', onAlertAdded);

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    tracker.off('vehicleUpdated', onVehicleUpdated);
    tracker.off('alertAdded', onAlertAdded);
  });
});
