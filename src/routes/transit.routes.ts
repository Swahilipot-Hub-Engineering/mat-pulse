import { Router, Request, Response } from 'express';
import { tracker } from '../engine/tracker.js';
import { getAllStops, generateGtfsCsvFiles, loadStaticRoutes } from '../gtfs/static/generator.js';

export const transitRouter = Router();

// List all routes with stops
transitRouter.get('/routes', (_req: Request, res: Response): void => {
  const routes = loadStaticRoutes();
  res.json({ success: true, count: routes.length, routes });
});

// List all registered stops in Mombasa
transitRouter.get('/stops', (_req: Request, res: Response): void => {
  const stops = getAllStops();
  res.json({ success: true, count: stops.length, stops });
});

// List active vehicles currently transmitting telemetry
transitRouter.get('/vehicles', (req: Request, res: Response): void => {
  const routeId = req.query.routeId ? String(req.query.routeId) : undefined;
  const vehicles = tracker.getActiveVehicles(routeId);
  res.json({ success: true, count: vehicles.length, vehicles });
});

// Download / inspect static GTFS files
transitRouter.get('/gtfs-static', (_req: Request, res: Response): void => {
  const files = generateGtfsCsvFiles();
  res.json({
    success: true,
    description: 'Static GTFS CSV components for Mombasa matatu transit',
    files
  });
});

// Server-Sent Events (SSE) stream for real-time live map updates
transitRouter.get('/stream', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state snapshot immediately
  const initialData = JSON.stringify({
    type: 'SNAPSHOT',
    vehicles: tracker.getActiveVehicles(),
    alerts: tracker.getActiveAlerts()
  });
  res.write(`data: ${initialData}\n\n`);

  // Listener for vehicle updates
  const onVehicleUpdated = (vehicle: any) => {
    res.write(`data: ${JSON.stringify({ type: 'VEHICLE_UPDATED', vehicle })}\n\n`);
  };

  const onAlertAdded = (alert: any) => {
    res.write(`data: ${JSON.stringify({ type: 'ALERT_ADDED', alert })}\n\n`);
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
