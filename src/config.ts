import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  telemetrySecret: process.env.TELEMETRY_API_KEY || 'pwani-matatu-key',
  gtfsAgencyName: process.env.GTFS_AGENCY_NAME || 'Mombasa Matatu Transit SACCOs',
  gtfsAgencyUrl: process.env.GTFS_AGENCY_URL || 'https://swahilipothub.co.ke',
  gtfsAgencyTimezone: process.env.GTFS_AGENCY_TIMEZONE || 'Africa/Nairobi',
  staleVehicleThresholdSeconds: parseInt(process.env.STALE_VEHICLE_SECONDS || '300', 10), // 5 min
};
