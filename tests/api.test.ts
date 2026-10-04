import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';

describe('HTTP API Endpoints', () => {
  it('GET /api/v1/health returns healthy status and service stats', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('mat-pulse');
    expect(res.body.stats.routesCount).toBeGreaterThan(0);
  });

  it('GET /api/v1/transit/routes returns Mombasa routes', async () => {
    const res = await request(app).get('/api/v1/transit/routes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.routes.length).toBeGreaterThan(0);
    expect(res.body.routes[0].routeId).toBeDefined();
  });

  it('POST /api/v1/telemetry records ping and returns updated vehicle state', async () => {
    const payload = {
      vehicleId: 'kda-test-1',
      routeId: 'route-bamburi-posta',
      latitude: -4.0150,
      longitude: 39.7020,
      speedKmh: 35
    };

    const res = await request(app)
      .post('/api/v1/telemetry')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vehicleId).toBe('kda-test-1');
  });

  it('POST /api/v1/telemetry rejects invalid coordinates', async () => {
    const payload = {
      vehicleId: 'kda-test-2',
      routeId: 'route-bamburi-posta',
      latitude: 50.0, // outside Kenya
      longitude: 0.0
    };

    const res = await request(app)
      .post('/api/v1/telemetry')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Coordinate out of range');
  });

  it('GET /api/v1/gtfs-rt/vehicle-positions.json returns GTFS-RT feed JSON', async () => {
    const res = await request(app).get('/api/v1/gtfs-rt/vehicle-positions.json');
    expect(res.status).toBe(200);
    expect(res.body.header).toBeDefined();
    expect(res.body.header.gtfsRealtimeVersion).toBe('2.0');
  });

  it('GET /api/v1/gtfs-rt/vehicle-positions.pb returns protobuf binary stream', async () => {
    const res = await request(app).get('/api/v1/gtfs-rt/vehicle-positions.pb');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/x-protobuf');
  });
});
