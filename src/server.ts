import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { telemetryRouter } from './routes/telemetry.routes.js';
import { gtfsRtRouter } from './routes/gtfs-rt.routes.js';
import { transitRouter } from './routes/transit.routes.js';
import { healthRouter } from './routes/health.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// API Routers
app.use('/api/v1/telemetry', telemetryRouter);
app.use('/api/v1/gtfs-rt', gtfsRtRouter);
app.use('/api/v1/transit', transitRouter);
app.use('/api/v1/health', healthRouter);

// Fallback route for SPA
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.env === 'development' ? err.message : 'An error occurred'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, config.host, () => {
    console.log(`====================================================`);
    console.log(`  MAT-PULSE 🌊 Mombasa Real-time Matatu Transit`);
    console.log(`  Server listening on http://${config.host}:${config.port}`);
    console.log(`  GTFS-RT VehiclePositions: /api/v1/gtfs-rt/vehicle-positions.pb`);
    console.log(`  GTFS-RT TripUpdates:      /api/v1/gtfs-rt/trip-updates.pb`);
    console.log(`  Live Map Dashboard:       http://localhost:${config.port}`);
    console.log(`====================================================`);
  });
}
