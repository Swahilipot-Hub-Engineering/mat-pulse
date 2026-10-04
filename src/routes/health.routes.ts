import { Router, Request, Response } from 'express';
import { tracker } from '../engine/tracker.js';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response): void => {
  const activeVehicles = tracker.getActiveVehicles();
  const routes = tracker.getAllRoutes();
  const alerts = tracker.getActiveAlerts();

  res.json({
    status: 'healthy',
    service: 'mat-pulse',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    stats: {
      activeVehiclesCount: activeVehicles.length,
      routesCount: routes.length,
      activeAlertsCount: alerts.length
    }
  });
});
